import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAP_EDITOR_SAVE_KEY,
  MAP_EDITOR_SCHEMA,
  MAP_EDITOR_MAX_ENEMIES,
  MAP_EDITOR_MAX_PLATFORMS,
  MAP_EDITOR_MAX_STAGES,
  MAP_EDITOR_MAX_CHAIN,
  MAP_EDITOR_SHARE_PREFIX,
  MAP_EDITOR_WORLD_H,
  MAP_EDITOR_SURVIVE_MIN,
  MAP_EDITOR_SURVIVE_MAX,
  MAP_EDITOR_BALANCE_TARGET,
  MAP_EDITOR_DIFFICULTY_OPTIONS,
  MAP_EDITOR_OBJECTIVES,
  mapDifficultyScale,
  playerPower,
  enemyLoad,
  threatRating,
  autoBalanceBlueprint,
  customBossOverrides,
  MAP_EDITOR_LAYOUTS,
  MAP_EDITOR_PRESETS,
  MAP_EDITOR_ENEMY_OPTIONS,
  MAP_EDITOR_BOSS_OPTIONS,
  layoutFor,
  terrainFromLayout,
  supportsSpawn,
  isTemplateTerrain,
  spawnForBlueprint,
  sanitizeBlueprint,
  validateBlueprint,
  customRoomFromBlueprint,
  defaultEditorSave,
  sanitizeEditorSave,
  blueprintFromPreset,
  upsertBlueprint,
  removeBlueprint,
  recordEditorPlay,
  recordEditorClear,
  editorSummary,
  newBlueprintId,
  chainFor,
  chainLength,
  encodeShareCode,
  decodeShareCode,
  drawEditorPreview,
} from '../src/mapeditor.js';
import { AshenGame, ALL_ROOMS, ALL_ENEMY_INFO, ALL_BOSS_INFO, WORLD_W } from '../src/core.js';
import { ZONES as ZONES_TABLE } from '../src/zones.js';

test('the editor ships one playable starter stage and a sanitized save shape', () => {
  assert.equal(MAP_EDITOR_SAVE_KEY, 'ashen-vow-mapeditor-v1');
  assert.equal(MAP_EDITOR_SCHEMA, 3);
  const save = defaultEditorSave();
  assert.equal(save.version, MAP_EDITOR_SCHEMA);
  assert.equal(save.stages.length, 1);
  assert.equal(save.selectedId, save.stages[0].id);
  assert.ok(save.stages[0].enemies.length >= 1);
  assert.equal(save.stages[0].platforms.length, terrainFromLayout('flat').length);
  assert.equal(save.stages[0].nextStageId, null);
  assert.equal(save.stages[0].difficulty, 'normal');
  assert.equal(save.stages[0].objective, 'clear');
  assert.equal(save.stages[0].surviveSeconds, 60);
  assert.ok(save.stages[0].enemies.every((enemy) => enemy.elite === false));
  assert.deepEqual(save.plays, {});
  assert.deepEqual(save.clears, {});

  const round = sanitizeEditorSave(JSON.parse(JSON.stringify(save)));
  assert.equal(round.stages[0].name, save.stages[0].name);
  assert.equal(round.stages[0].enemies.length, save.stages[0].enemies.length);
  assert.deepEqual(round.stages[0].platforms, save.stages[0].platforms);
  assert.equal(round.selectedId, save.selectedId);
});

test('sanitizer clamps junk ids, counts and unknown content instead of trusting them', () => {
  const blueprint = sanitizeBlueprint({
    id: 'bad id with spaces',
    name: '   ',
    subtitle: '',
    layout: 'nope',
    zone: 'atlantis',
    music: 'nope',
    bossMusic: 'nope',
    intro: 'nope',
    classId: 'nobody',
    weapons: ['sword', 'sword', 'nope', 'bow', 'pike', 'scythe', 'halberd', 'crossbow'],
    arrows: 999,
    flasks: 99,
    ash: -50,
    boss: 'not_a_boss',
    nextStageId: 'not a stage id',
    enemies: [
      { type: 'crawler', x: 400 },
      { type: 'not_an_enemy', x: 200 },
      { type: 'sentinel', x: 99_999 },
      ...Array.from({ length: MAP_EDITOR_MAX_ENEMIES + 5 }, () => ({ type: 'crawler', x: 500 })),
    ],
  }, 0);

  assert.match(blueprint.id, /^stage_/);
  assert.equal(blueprint.name, 'Peta 1');
  assert.equal(blueprint.layout, 'flat');
  assert.equal(blueprint.zone, 'ashen');
  assert.equal(blueprint.music, 'ashen');
  assert.equal(blueprint.bossMusic, 'boss');
  assert.equal(blueprint.intro, 'none');
  assert.equal(blueprint.classId, 'sera');
  assert.equal(blueprint.nextStageId, null);
  assert.ok(blueprint.weapons.length <= 5);
  assert.ok(blueprint.weapons.includes('sword'));
  assert.equal(blueprint.arrows, 60);
  assert.equal(blueprint.flasks, 6);
  assert.equal(blueprint.ash, 0);
  assert.equal(blueprint.boss, null);
  assert.equal(blueprint.enemies.length, MAP_EDITOR_MAX_ENEMIES);
  assert.ok(blueprint.enemies.every((enemy) => ALL_ENEMY_INFO[enemy.type]));
  assert.ok(blueprint.enemies.every((enemy) => enemy.x >= 60 && enemy.x <= 1340));
});

test('validation accepts every preset and rejects the real blockers', () => {
  for (const preset of MAP_EDITOR_PRESETS) {
    const blueprint = sanitizeBlueprint(preset, 0);
    const report = validateBlueprint(blueprint);
    assert.equal(report.ok, true, `${preset.id}: ${report.errors.join(',')}`);
  }

  const noName = validateBlueprint({ ...MAP_EDITOR_PRESETS[0], name: '   ' });
  assert.equal(noName.ok, false);
  assert.match(noName.errors.join(' '), /Nama peta/i);

  const tooMany = validateBlueprint({
    ...MAP_EDITOR_PRESETS[0],
    enemies: Array.from({ length: MAP_EDITOR_MAX_ENEMIES + 2 }, () => 'crawler'),
  });
  assert.equal(tooMany.ok, false);
  assert.match(tooMany.errors.join(' '), /Maksimal/i);

  const unknownEnemy = validateBlueprint({ ...MAP_EDITOR_PRESETS[0], enemies: ['ghost_of_junk'] });
  assert.equal(unknownEnemy.ok, false);
  assert.match(unknownEnemy.errors.join(' '), /Musuh tidak dikenal/i);

  const unknownBoss = validateBlueprint({ ...MAP_EDITOR_PRESETS[0], boss: 'nobody' });
  assert.equal(unknownBoss.ok, false);
  assert.match(unknownBoss.errors.join(' '), /Bos tidak dikenal/i);

  const empty = validateBlueprint({ ...MAP_EDITOR_PRESETS[0], enemies: [], boss: null });
  assert.equal(empty.ok, true);
  assert.match(empty.warnings.join(' '), /tidak punya musuh/i);
});

test('every authored layout keeps the spawn point on solid ground', () => {
  const spawn = spawnForBlueprint();
  for (const layout of MAP_EDITOR_LAYOUTS) {
    assert.ok(layout.platforms.length >= 1);
    const grounded = layout.platforms.some(
      (platform) => spawn.x >= platform.x && spawn.x <= platform.x + platform.w && platform.y >= spawn.y,
    );
    assert.ok(grounded, `${layout.id} leaves the spawn in the air`);
    assert.ok(supportsSpawn(layout.platforms), `${layout.id} must support the spawn`);
  }
  assert.equal(layoutFor('missing').id, MAP_EDITOR_LAYOUTS[0].id);
});

test('free-form terrain replaces the template and validation guards the spawn', () => {
  const floating = sanitizeBlueprint(
    { ...MAP_EDITOR_PRESETS[0], platforms: [{ x: 400, y: 200, w: 200, h: 18 }] },
    0,
  );
  assert.deepEqual(floating.platforms, [{ x: 400, y: 200, w: 200, h: 18 }]);
  assert.equal(supportsSpawn(floating.platforms), false);
  assert.equal(isTemplateTerrain(floating), false);
  const report = validateBlueprint(floating);
  assert.equal(report.ok, false);
  assert.match(report.errors.join(' '), /Titik awal/);

  const grounded = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[0],
      platforms: [{ x: 0, y: 470, w: 600, h: 70 }, { x: 700, y: 300, w: 180, h: 18 }],
    },
    0,
  );
  assert.equal(validateBlueprint(grounded).ok, true);
  assert.equal(grounded.platforms.length, 2);

  const clamped = sanitizeBlueprint(
    { ...MAP_EDITOR_PRESETS[0], platforms: [{ x: -200, y: 20, w: 99_999, h: 999 }] },
    0,
  );
  assert.deepEqual(clamped.platforms[0], { x: 0, y: 140, w: WORLD_W, h: 80 });

  const empty = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], platforms: [] }, 0);
  assert.deepEqual(empty.platforms, terrainFromLayout('flat'));

  const many = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[0],
      platforms: Array.from({ length: MAP_EDITOR_MAX_PLATFORMS + 10 }, () => ({ x: 100, y: 300, w: 100, h: 18 })),
    },
    0,
  );
  assert.equal(many.platforms.length, MAP_EDITOR_MAX_PLATFORMS);

  assert.equal(isTemplateTerrain(MAP_EDITOR_PRESETS[0]), true);
  assert.equal(isTemplateTerrain(MAP_EDITOR_PRESETS[1]), true);
});

test('a blueprint becomes a synthetic room that never joins the campaign', () => {
  const before = ALL_ROOMS.length;
  const blueprint = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[2],
      enemies: [{ type: 'crawler', x: 300 }, { type: 'sentinel', x: 700 }],
      boss: 'warden',
      checkpoint: true,
      relic: true,
    },
    0,
  );
  const room = customRoomFromBlueprint(blueprint);

  assert.equal(room.custom, true);
  assert.equal(room.index, -1);
  assert.equal(room.id, 'custom_stage');
  assert.equal(room.zone, 'cinder');
  assert.deepEqual(room.palette, ZONES_TABLE.cinder.palette);
  assert.equal(room.boss, 'warden');
  assert.equal(room.enemies.length, 2);
  assert.equal(room.enemies[0].minX, 130);
  assert.equal(room.enemies[0].maxX, 470);
  assert.equal(room.gate.next, -1);
  assert.ok(room.checkpoint && room.merchant);
  assert.ok(room.relic);
  assert.deepEqual(room.platforms, blueprint.platforms);
  assert.equal(ALL_ROOMS.length, before, 'custom stages never touch ALL_ROOMS');
});

test('the engine loads a custom stage, spawns its roster and ends on a blessing', () => {
  const blueprint = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[0],
      layout: 'terraces',
      zone: 'mycelial',
      classId: 'karn',
      flasks: 4,
      enemies: [{ type: 'crawler', x: 320 }, { type: 'wraith', x: 760 }],
      boss: null,
    },
    0,
  );
  const room = customRoomFromBlueprint(blueprint);
  const game = new AshenGame();
  game.loadArena(room);
  for (const def of room.enemies) game.spawnEnemy({ ...def });
  game.applyCharacter(blueprint.classId);
  game.player.maxFlasks = blueprint.flasks;
  game.player.flasks = blueprint.flasks;

  assert.equal(game.roomIndex, -1);
  assert.equal(game.room.custom, true);
  assert.equal(game.enemies.length, 2);
  assert.equal(game.boss, null);
  assert.equal(game.player.maxFlasks, 4);
  assert.equal(game.gates[0].next, -1);

  // Walking into the open decorative exit must not load a campaign room.
  game.enemies.length = 0;
  game.player.x = 1360;
  game.updateGate();
  assert.equal(game.roomIndex, -1);
  assert.equal(game.room.custom, true);
});

test('a custom boss always grants a blessing and never fakes a campaign victory', () => {
  const blueprint = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[1], boss: 'oathbreaker', enemies: [] }, 0);
  const room = customRoomFromBlueprint(blueprint);
  const game = new AshenGame();
  game.loadArena(room);
  const boss = game.spawnBoss(blueprint.boss, { rewardOverride: 'blessing' });
  assert.ok(boss);
  assert.equal(boss.kind, 'oathbreaker');
  assert.equal(ALL_BOSS_INFO.oathbreaker.reward, 'victory');

  boss.deathTimer = 0;
  game.finishBoss();
  assert.equal(game.state, 'blessing');
  assert.equal(game.boss, null);
  assert.equal(game.bossDefeated[-1], true);
  assert.ok(!game.bossDefeated[7], 'the campaign Oathbreaker slot stays untouched');
});

test('room chains link in order, drop broken links and cap at six rooms', () => {
  const save = sanitizeEditorSave({
    stages: [
      { ...MAP_EDITOR_PRESETS[0], id: 'stage_1', nextStageId: 'stage_2' },
      { ...MAP_EDITOR_PRESETS[1], id: 'stage_2', nextStageId: 'stage_3' },
      { ...MAP_EDITOR_PRESETS[2], id: 'stage_3', nextStageId: null },
    ],
  });
  assert.deepEqual(chainFor(save, 'stage_1').map((stage) => stage.id), ['stage_1', 'stage_2', 'stage_3']);
  assert.deepEqual(chainFor(save, 'stage_2').map((stage) => stage.id), ['stage_2', 'stage_3']);
  assert.equal(chainFor(save, 'stage_3').length, 1);
  assert.equal(chainLength(save, 'stage_1'), 3);

  const cyclic = sanitizeEditorSave({
    stages: [
      { ...MAP_EDITOR_PRESETS[0], id: 'stage_1', nextStageId: 'stage_2' },
      { ...MAP_EDITOR_PRESETS[1], id: 'stage_2', nextStageId: 'stage_1' },
    ],
  });
  assert.equal(cyclic.stages[0].nextStageId, null);
  assert.equal(cyclic.stages[1].nextStageId, null);

  const dangling = sanitizeEditorSave({
    stages: [{ ...MAP_EDITOR_PRESETS[0], id: 'stage_1', nextStageId: 'ghost_stage' }],
  });
  assert.equal(dangling.stages[0].nextStageId, null);

  // The validator names a cycle before it is saved and repaired.
  const before = sanitizeEditorSave({
    stages: [
      { ...MAP_EDITOR_PRESETS[0], id: 'stage_1' },
      { ...MAP_EDITOR_PRESETS[1], id: 'stage_2', nextStageId: 'stage_1' },
    ],
  });
  const cycle = validateBlueprint({ ...before.stages[0], nextStageId: 'stage_2' }, before);
  assert.equal(cycle.ok, false);
  assert.match(cycle.errors.join(' '), /berputar/);
  const self = validateBlueprint({ ...before.stages[0], nextStageId: 'stage_1' }, before);
  assert.equal(self.ok, false);
  assert.match(self.errors.join(' '), /dirinya sendiri/);
  const missing = validateBlueprint({ ...before.stages[0], nextStageId: 'ghost_stage' }, before);
  assert.equal(missing.ok, false);
  assert.match(missing.errors.join(' '), /tidak ditemukan/);

  // A seven-room chain is one room too long.
  const long = sanitizeEditorSave({
    stages: Array.from({ length: MAP_EDITOR_MAX_CHAIN + 1 }, (_, index) => ({
      ...MAP_EDITOR_PRESETS[0],
      id: `stage_${index + 1}`,
      nextStageId: index < MAP_EDITOR_MAX_CHAIN ? `stage_${index + 2}` : null,
    })),
  });
  const tooLong = validateBlueprint(long.stages[0], long);
  assert.equal(tooLong.ok, false);
  assert.match(tooLong.errors.join(' '), /Rantai maksimal/);
  assert.equal(chainFor(long, 'stage_1').length, MAP_EDITOR_MAX_CHAIN);

  const trimmed = removeBlueprint(save, 'stage_2');
  assert.equal(trimmed.stages.find((stage) => stage.id === 'stage_1').nextStageId, null);
});

test('share codes round-trip a map and a whole chain', () => {
  const save = sanitizeEditorSave({
    stages: [
      {
        ...MAP_EDITOR_PRESETS[0],
        id: 'stage_1',
        name: 'Jurang Āsh — 試作',
        platforms: [{ x: 0, y: 470, w: 700, h: 70 }, { x: 760, y: 300, w: 200, h: 18 }],
        nextStageId: 'stage_2',
      },
      { ...MAP_EDITOR_PRESETS[1], id: 'stage_2', name: 'Duel Kedua', nextStageId: null },
    ],
  });
  const code = encodeShareCode(chainFor(save, 'stage_1'));
  assert.ok(code.startsWith(MAP_EDITOR_SHARE_PREFIX));
  const decoded = decodeShareCode(code);
  assert.equal(decoded.ok, true);
  assert.equal(decoded.stages.length, 2);
  assert.equal(decoded.stages[0].name, 'Jurang Āsh — 試作');
  assert.deepEqual(decoded.stages[0].platforms, save.stages[0].platforms);
  assert.equal(decoded.stages[0].nextStageId, decoded.stages[1].id);
  assert.equal(decoded.stages[1].nextStageId, null);
  assert.equal(decoded.stages[0].boss, null);
  assert.equal(decoded.stages[1].boss, 'warden');

  assert.equal(decodeShareCode('').ok, false);
  assert.equal(decodeShareCode('bukan kode').ok, false);
  assert.equal(decodeShareCode(`${MAP_EDITOR_SHARE_PREFIX}!!!!`).ok, false);
  const oldVersion = `AVME1.${Buffer.from(JSON.stringify({ v: 1, stages: [] })).toString('base64url')}`;
  assert.match(decodeShareCode(oldVersion).error, /Versi/);
  const emptyPayload = `AVME1.${Buffer.from(JSON.stringify({ v: MAP_EDITOR_SCHEMA, stages: [] })).toString('base64url')}`;
  assert.match(decodeShareCode(emptyPayload).error, /tidak berisi peta/);

  const many = encodeShareCode(
    Array.from({ length: MAP_EDITOR_MAX_CHAIN + 4 }, (_, index) => ({
      ...MAP_EDITOR_PRESETS[0],
      id: `stage_${index + 1}`,
    })),
  );
  assert.equal(decodeShareCode(many).stages.length, MAP_EDITOR_MAX_CHAIN);

  // Takaran, objective and elite flags travel with the code.
  const siege = sanitizeEditorSave({
    stages: [
      {
        ...MAP_EDITOR_PRESETS[3],
        id: 'stage_1',
        difficulty: 'nightmare',
        surviveSeconds: 90,
        enemies: [{ type: 'crawler', x: 300, elite: true }, { type: 'brute', x: 700 }],
      },
    ],
  });
  const siegeCode = decodeShareCode(encodeShareCode(chainFor(siege, 'stage_1')));
  assert.equal(siegeCode.ok, true);
  assert.equal(siegeCode.stages[0].difficulty, 'nightmare');
  assert.equal(siegeCode.stages[0].objective, 'survive');
  assert.equal(siegeCode.stages[0].surviveSeconds, 90);
  assert.equal(siegeCode.stages[0].enemies[0].elite, true);
  assert.equal(siegeCode.stages[0].enemies[1].elite, false);

  // A v0.40.0 code (schema 2) still imports with the safe defaults.
  const legacy = `AVME1.${Buffer.from(JSON.stringify({
    v: 2,
    stages: [{
      n: 'Peta Lama', s: 'dari v0.40.0', l: 'flat', p: [{ x: 0, y: 470, w: 1400, h: 70 }],
      z: 'ashen', m: 'ashen', bm: 'boss', i: 'none', c: 'sera', w: ['sword'],
      a: 0, f: 3, ash: 45, r: false, k: false, bo: null, e: [], nx: -1,
    }],
  })).toString('base64url')}`;
  const old = decodeShareCode(legacy);
  assert.equal(old.ok, true);
  assert.equal(old.stages[0].name, 'Peta Lama');
  assert.equal(old.stages[0].difficulty, 'normal');
  assert.equal(old.stages[0].objective, 'clear');
});

test('the preview canvas draws terrain, spawn, roster and boss without throwing', () => {
  const calls = { fillRect: 0, arc: 0, strokeRect: 0, gradients: 0 };
  const gradient = { addColorStop() {} };
  const ctx = {
    createLinearGradient() { calls.gradients += 1; return gradient; },
    createRadialGradient() { calls.gradients += 1; return gradient; },
    fillRect() { calls.fillRect += 1; },
    strokeRect() { calls.strokeRect += 1; },
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    arc() { calls.arc += 1; },
    clearRect() {},
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };
  const blueprint = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[2],
      boss: 'warden',
      checkpoint: true,
      relic: true,
      enemies: [{ type: 'crawler', x: 300 }, { type: 'brute', x: 900 }],
    },
    0,
  );
  drawEditorPreview(ctx, blueprint, 700, Math.round((700 / WORLD_W) * MAP_EDITOR_WORLD_H), {
    selected: 1,
    pending: { x: 200, y: 260, w: 160, h: 18 },
  });
  assert.ok(calls.fillRect >= blueprint.platforms.length + 3);
  assert.ok(calls.arc >= blueprint.enemies.length + 1);
  assert.ok(calls.gradients >= 2);
  assert.equal(drawEditorPreview(null, blueprint, 700, 270), undefined);
});

test('a two-room chain plays as one run inside the real engine', () => {
  const save = sanitizeEditorSave({
    stages: [
      {
        ...MAP_EDITOR_PRESETS[0],
        id: 'stage_1',
        ash: 120,
        enemies: [{ type: 'crawler', x: 300 }],
        nextStageId: 'stage_2',
      },
      {
        ...MAP_EDITOR_PRESETS[1],
        id: 'stage_2',
        ash: 10,
        enemies: [{ type: 'sentinel', x: 400 }],
        boss: 'warden',
        nextStageId: null,
      },
    ],
  });
  const chain = chainFor(save, 'stage_1');
  assert.equal(chain.length, 2);

  const game = new AshenGame();
  const first = customRoomFromBlueprint(chain[0]);
  game.loadArena(first);
  for (const def of first.enemies) game.spawnEnemy({ ...def });
  game.ash = chain[0].ash;
  game.player.hp = 40;

  const second = customRoomFromBlueprint(chain[1]);
  game.loadArena(second);
  for (const def of second.enemies) game.spawnEnemy({ ...def });
  game.spawnBoss(chain[1].boss, { rewardOverride: 'blessing' });

  assert.equal(game.roomIndex, -1);
  assert.equal(game.ash, 120, 'ash carries across the chain, the next room does not reset it');
  assert.equal(game.player.hp, 40, 'health carries across the chain');
  assert.equal(game.enemies.length, 1);
  assert.equal(game.enemies[0].type, 'sentinel');
  assert.equal(game.boss?.kind, 'warden');
});

test('takaran scales one map without rewriting the global difficulty', () => {
  assert.equal(MAP_EDITOR_DIFFICULTY_OPTIONS.length, 6);
  assert.equal(mapDifficultyScale('normal').hp, 1);
  assert.equal(mapDifficultyScale('nope').id, 'normal');

  const soft = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], difficulty: 'story' }, 0);
  const hard = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], difficulty: 'hard' }, 0);
  const softRoom = customRoomFromBlueprint(soft);
  const hardRoom = customRoomFromBlueprint(hard);
  assert.equal(hardRoom.difficulty, 'hard');
  assert.ok(hardRoom.enemies[0].hpScale > softRoom.enemies[0].hpScale);
  assert.equal(hardRoom.enemies[0].dmgScale, 1.18);
  assert.equal(hardRoom.enemies[0].speedScale, 1.06);

  const game = new AshenGame();
  game.loadArena(softRoom);
  const weak = game.spawnEnemy({ ...softRoom.enemies[0] });
  const other = new AshenGame();
  other.loadArena(hardRoom);
  const tough = other.spawnEnemy({ ...hardRoom.enemies[0] });
  assert.ok(tough.maxHp > weak.maxHp, 'a harder takaran really raises HP in the engine');
  assert.ok(tough.dmg > weak.dmg, 'a harder takaran really raises damage in the engine');
  assert.equal(tough.elite, false);
});

test('elite enemies spawn elite in the engine and cost more threat', () => {
  const plain = sanitizeBlueprint(
    { ...MAP_EDITOR_PRESETS[0], enemies: [{ type: 'crawler', x: 400 }, { type: 'crawler', x: 600 }] },
    0,
  );
  const withElite = sanitizeBlueprint(
    { ...MAP_EDITOR_PRESETS[0], enemies: [{ type: 'crawler', x: 400, elite: true }, { type: 'crawler', x: 600 }] },
    0,
  );
  assert.equal(withElite.enemies[0].elite, true);
  assert.ok(enemyLoad(withElite) > enemyLoad(plain));

  const room = customRoomFromBlueprint(withElite);
  const game = new AshenGame();
  game.loadArena(room);
  const elite = game.spawnEnemy({ ...room.enemies[0] });
  assert.equal(elite.elite, true);
  assert.equal(elite.eliteRank, 'custom');
  assert.ok(elite.reward > game.spawnEnemy({ ...room.enemies[1] }).reward, 'elites pay a bigger bounty');

  const report = validateBlueprint(withElite);
  assert.equal(report.ok, true);
  assert.equal(report.rating.elites, 1);
});

test('the threat meter bands a map and AUTO-SEIMBANG tunes it both ways', () => {
  const empty = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], enemies: [], boss: null }, 0);
  const emptyRating = threatRating(empty);
  assert.equal(emptyRating.band, 'ringan');
  assert.match(emptyRating.tips.join(' '), /Tambah musuh/i);

  const brutal = sanitizeBlueprint(
    {
      ...MAP_EDITOR_PRESETS[0],
      difficulty: 'abyssal',
      enemies: Array.from({ length: 24 }, (_, index) => ({ type: 'brute', x: 120 + index * 40, elite: index < 6 })),
      boss: 'oathbreaker',
    },
    0,
  );
  const brutalRating = threatRating(brutal);
  assert.equal(brutalRating.band, 'brutal');
  assert.ok(brutalRating.ratio > 3.6);
  assert.match(brutalRating.tips.join(' '), /Kurangi musuh|Turunkan/i);

  const tuned = autoBalanceBlueprint(brutal);
  assert.ok(tuned.steps.length > 0);
  assert.notEqual(tuned.rating.band, 'brutal');
  assert.ok(tuned.rating.ratio <= 3.6);
  assert.ok(tuned.blueprint.flasks >= brutal.flasks);
  // Every step is reported as a readable action, never a silent rewrite.
  assert.ok(tuned.steps.every((step) => /flask|musuh|takaran/.test(step)));

  const light = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], enemies: [{ type: 'crawler', x: 300 }] }, 0);
  assert.equal(threatRating(light).band, 'ringan');
  const boosted = autoBalanceBlueprint(light);
  assert.ok(boosted.blueprint.enemies.length > 1);
  assert.notEqual(boosted.rating.band, 'ringan');
  assert.ok(boosted.rating.ratio <= MAP_EDITOR_BALANCE_TARGET + 1);

  // A balanced map is left alone.
  const balanced = sanitizeBlueprint(
    { ...MAP_EDITOR_PRESETS[0], enemies: Array.from({ length: 8 }, (_, index) => ({ type: 'crawler', x: 200 + index * 80 })) },
    0,
  );
  assert.equal(threatRating(balanced).band, 'seimbang');
  const stable = autoBalanceBlueprint(balanced);
  assert.equal(stable.steps.length, 0);
  assert.equal(stable.blueprint.enemies.length, balanced.enemies.length);

  // Player power reacts to sustain and weapons, not only to the class.
  const frail = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], flasks: 1, weapons: ['sword'] }, 0);
  const kitted = sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], flasks: 6, weapons: ['sword', 'pike', 'bow'], arrows: 40, relic: true }, 0);
  assert.ok(playerPower(kitted) > playerPower(frail));
});

test('survival maps carry their clock and are validated like every other field', () => {
  const siege = sanitizeBlueprint(MAP_EDITOR_PRESETS[3], 0);
  assert.equal(MAP_EDITOR_PRESETS[3].id, 'preset_siege');
  assert.equal(siege.objective, 'survive');
  assert.equal(siege.surviveSeconds, 60);
  const room = customRoomFromBlueprint(siege);
  assert.equal(room.objective, 'survive');
  assert.equal(room.surviveSeconds, 60);

  assert.equal(sanitizeBlueprint({ ...siege, surviveSeconds: 5 }, 0).surviveSeconds, MAP_EDITOR_SURVIVE_MIN);
  assert.equal(sanitizeBlueprint({ ...siege, surviveSeconds: 9999 }, 0).surviveSeconds, MAP_EDITOR_SURVIVE_MAX);
  assert.equal(sanitizeBlueprint({ ...siege, objective: 'nope' }, 0).objective, 'clear');

  const bad = validateBlueprint({ ...siege, surviveSeconds: 5 });
  assert.equal(bad.ok, false);
  assert.match(bad.errors.join(' '), /Waktu bertahan/);
  const unknown = validateBlueprint({ ...siege, objective: 'joget' });
  assert.equal(unknown.ok, false);
  assert.match(unknown.errors.join(' '), /Objektif tidak dikenal/);
  const quiet = validateBlueprint({ ...siege, enemies: [], boss: null });
  assert.equal(quiet.ok, true);
  assert.match(quiet.warnings.join(' '), /bertahan tanpa lawan/i);
  assert.ok(MAP_EDITOR_OBJECTIVES.some((entry) => entry.id === 'survive'));
});

test('boss overrides scale with the map takaran and keep the blessing reward', () => {
  const normal = customBossOverrides(sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[1], difficulty: 'normal' }, 0));
  const abyssal = customBossOverrides(sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[1], difficulty: 'abyssal' }, 0));
  assert.equal(normal.rewardOverride, 'blessing');
  assert.equal(normal.maxHp, ALL_BOSS_INFO.warden.maxHp);
  assert.ok(abyssal.maxHp > normal.maxHp);
  assert.ok(abyssal.contact > normal.contact);
  assert.deepEqual(customBossOverrides(sanitizeBlueprint({ ...MAP_EDITOR_PRESETS[0], boss: null }, 0)), { rewardOverride: 'blessing' });

  const room = customRoomFromBlueprint(MAP_EDITOR_PRESETS[1]);
  const game = new AshenGame();
  game.loadArena(room);
  const boss = game.spawnBoss('warden', abyssal);
  assert.equal(boss.maxHp, abyssal.maxHp);
  assert.equal(boss.rewardOverride, 'blessing');
});

test('save helpers cap stages, keep the last one and record plays and clears', () => {
  assert.equal(newBlueprintId({ stages: [] }), 'stage_1');
  assert.equal(newBlueprintId({ stages: [{ id: 'stage_1' }, { id: 'stage_3' }] }), 'stage_2');

  let save = defaultEditorSave();
  const second = blueprintFromPreset('preset_duel', save, 1);
  save = upsertBlueprint(save, second);
  assert.equal(save.stages.length, 2);
  assert.equal(save.selectedId, second.id);

  save = recordEditorPlay(save, second.id);
  save = recordEditorPlay(save, second.id);
  assert.equal(save.plays[second.id], 2);

  save = recordEditorClear(save, second.id, 84.4);
  save = recordEditorClear(save, second.id, 61.2);
  save = recordEditorClear(save, second.id, 120);
  assert.equal(save.clears[second.id].count, 3);
  assert.equal(save.clears[second.id].best, 61.2);

  const summary = editorSummary(save);
  assert.equal(summary.stages, 2);
  assert.equal(summary.plays, 2);
  assert.equal(summary.clears, 3);
  assert.equal(summary.best, 61.2);
  assert.ok(summary.enemies >= 1);
  assert.ok(summary.platforms >= 2);

  save = removeBlueprint(save, second.id);
  assert.equal(save.stages.length, 1);
  assert.equal(save.clears[second.id], undefined);

  const only = removeBlueprint(save, save.stages[0].id);
  assert.equal(only.stages.length, 1, 'the last stage is never removed');

  const many = sanitizeEditorSave({
    stages: Array.from({ length: MAP_EDITOR_MAX_STAGES + 6 }, (_, index) => ({ ...MAP_EDITOR_PRESETS[0], id: `stage_${index + 1}` })),
  });
  assert.equal(many.stages.length, MAP_EDITOR_MAX_STAGES);
});

test('editor catalogues only offer content the engine can actually run', () => {
  assert.ok(MAP_EDITOR_ENEMY_OPTIONS.length > 100);
  assert.ok(MAP_EDITOR_BOSS_OPTIONS.length > 100);
  assert.ok(MAP_EDITOR_ENEMY_OPTIONS.every((option) => ALL_ENEMY_INFO[option.id]));
  assert.ok(MAP_EDITOR_BOSS_OPTIONS.every((option) => ALL_BOSS_INFO[option.id]));
  assert.ok(ZONES_TABLE.ashen, 'zone table stays the single background source');
});
