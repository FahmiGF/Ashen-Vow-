import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUZZLE_TYPES, PUZZLE_ENGINE_IDS, PUZZLE_ABILITIES, PUZZLE_ARC1, PUZZLE_STAGES,
  PUZZLE_BOSSES, PUZZLE_HINT_COST, PUZZLE_BOSS_TIME_LIMIT, PUZZLE_STAGE_BY_ID,
  PUZZLE_BOSS_BY_ID, PUZZLE_ARCS, PUZZLE_LORE, PUZZLE_TYPE_LORE,
  generatePuzzle, generateStagePuzzle, applyPuzzleMove, puzzleIsSolved, validatePuzzle,
  publishPuzzle, puzzleSnapshot, decodePuzzleState, encodePuzzleState,
  defaultPuzzleProgress, sanitizePuzzleProgress, puzzleStageUnlocked, recordPuzzleSolve,
  recordPuzzleBoss, puzzleSummary, puzzleHintText, payPuzzleHint, puzzleBossTimer,
  formatPuzzleTime,
} from '../src/puzzle.js';

test('twenty-three puzzle categories cover eight real engines', () => {
  assert.equal(PUZZLE_TYPES.length, 23);
  assert.equal(new Set(PUZZLE_TYPES.map((type) => type.id)).size, 23);
  for (const type of PUZZLE_TYPES) {
    assert.ok(PUZZLE_ENGINE_IDS.includes(type.engine), `${type.id} uses unknown engine`);
    assert.ok(type.name && type.desc);
  }
  // The three named systems plus the twenty additional challenges.
  assert.ok(PUZZLE_TYPES.some((type) => type.id === 'connect_dots'));
  assert.ok(PUZZLE_TYPES.some((type) => type.id === 'pipe_connections'));
  assert.ok(PUZZLE_TYPES.some((type) => type.id === 'image_restoration'));
});

test('every generated puzzle is solvable at every difficulty', () => {
  for (const type of PUZZLE_TYPES) {
    for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
      const puzzle = generatePuzzle(type.id, difficulty, `seed-${type.id}-${difficulty}`);
      const validation = validatePuzzle(puzzle);
      assert.ok(validation.ok, `${type.id} d${difficulty}: ${validation.errors.join(', ')}`);
      assert.ok(validation.solutionMoves > 0);
      assert.equal(puzzleIsSolved(puzzle), false, `${type.id} must start unsolved`);
    }
  }
});

test('replaying the recorded solution solves every puzzle deterministically', () => {
  for (const type of PUZZLE_TYPES) {
    const puzzle = generatePuzzle(type.id, 3, 'determinism');
    const twin = generatePuzzle(type.id, 3, 'determinism');
    assert.deepEqual(puzzle.state, twin.state);
    let current = { ...puzzle, state: JSON.parse(JSON.stringify(puzzle.initial)), moves: 0 };
    for (const move of puzzle.solution) {
      const result = applyPuzzleMove(current, move);
      assert.equal(result.ok, true, `${type.id} rejected ${JSON.stringify(move)}`);
      current = result.puzzle;
    }
    assert.equal(puzzleIsSolved(current), true, `${type.id} did not solve`);
  }
});

test('invalid interactions are rejected without mutating the puzzle', () => {
  const puzzle = generatePuzzle('connect_dots', 2, 'invalid');
  const before = JSON.stringify(puzzle);
  assert.equal(applyPuzzleMove(puzzle, { cell: [99, 99] }).ok, false);
  assert.equal(applyPuzzleMove(puzzle, { nonsense: true }).ok, false);
  assert.equal(JSON.stringify(puzzle), before);
});

test('editor publish gate rejects broken and unsolvable layouts', () => {
  const puzzle = generatePuzzle('pipe_connections', 2, 'editor');
  assert.equal(publishPuzzle(puzzle).ok, true);
  assert.equal(publishPuzzle({ ...puzzle, solution: [] }).ok, false);
  assert.equal(publishPuzzle({ ...puzzle, solution: [{ rotate: 999, turns: 1 }] }).ok, false);
  assert.equal(publishPuzzle({ ...puzzle, typeId: 'missing_type' }).ok, false);
  assert.equal(publishPuzzle({ ...puzzle, w: 1, h: 1 }).ok, false);
});

test('puzzle snapshots survive the co-op codec', () => {
  const puzzle = generatePuzzle('mirror_reflection', 2, 'coop');
  const move = puzzle.solution[0];
  const moved = applyPuzzleMove(puzzle, move).puzzle;
  const encoded = encodePuzzleState(moved);
  const decoded = decodePuzzleState(encoded);
  assert.equal(decoded.id, moved.id);
  assert.deepEqual(decoded.state, moved.state);
  assert.equal(decodePuzzleState('{broken'), null);
  // A remote move produces the same deterministic result.
  const local = applyPuzzleMove(puzzle, move).puzzle;
  assert.deepEqual(puzzleSnapshot(local).state, puzzleSnapshot(moved).state);
});

test('puzzle campaign ships one hundred stages across ten arcs', () => {
  assert.equal(PUZZLE_STAGES.length, 100);
  assert.equal(PUZZLE_ARC1.length, 10);
  assert.equal(PUZZLE_ABILITIES.length, 10);
  assert.equal(PUZZLE_BOSSES.length, 10);
  assert.deepEqual([...new Set(PUZZLE_STAGES.map((stage) => stage.arc))], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (let index = 0; index < PUZZLE_STAGES.length; index += 1) {
    const stage = PUZZLE_STAGES[index];
    assert.equal(stage.index, index);
    assert.ok(PUZZLE_STAGE_BY_ID[stage.id]);
    assert.ok(stage.typeId);
    assert.ok(stage.arcTitle);
    const puzzle = generateStagePuzzle(index, 'arc');
    assert.equal(puzzle.engine, PUZZLE_TYPES.find((type) => type.id === stage.typeId).engine);
    assert.equal(validatePuzzle(puzzle).ok, true);
  }
  const bossStages = PUZZLE_STAGES.filter((stage) => stage.boss);
  assert.equal(bossStages.length, 10);
  assert.equal(new Set(bossStages.map((stage) => stage.boss)).size, 10);
  for (const stage of bossStages) {
    assert.ok(PUZZLE_BOSS_BY_ID[stage.boss]);
    assert.equal(stage.timed, true);
    assert.equal(puzzleBossTimer(stage), PUZZLE_BOSS_TIME_LIMIT);
  }
  assert.equal(puzzleBossTimer(PUZZLE_STAGES[0]), 0);
  assert.equal(formatPuzzleTime(PUZZLE_BOSS_TIME_LIMIT), '01:30');
  assert.equal(PUZZLE_ARC1[9].boss, 'ancient_heart');
  // Every one of the 23 systems appears in the campaign.
  assert.equal(new Set(PUZZLE_STAGES.map((stage) => stage.typeId)).size, PUZZLE_TYPES.length);
});

test('stages unlock in order and each arc boss requires its arc', () => {
  let progress = defaultPuzzleProgress();
  assert.equal(puzzleStageUnlocked(progress, 0), true);
  assert.equal(puzzleStageUnlocked(progress, 1), false);
  const skipped = recordPuzzleSolve(progress, 'arc1_5');
  assert.equal(skipped.firstClear, false);
  const earlyBoss = recordPuzzleBoss(progress, 'ancient_heart');
  assert.equal(earlyBoss.firstClear, false);
  for (const stage of PUZZLE_STAGES) {
    const result = recordPuzzleSolve(progress, stage.id, { moves: 4 });
    assert.equal(result.firstClear, true);
    progress = result.progress;
  }
  assert.equal(progress.solved.length, 100);
  assert.equal(progress.abilities.length, 10);
  assert.equal(progress.stage, 100);
  for (const stage of PUZZLE_STAGES.filter((entry) => entry.boss)) {
    const boss = recordPuzzleBoss(progress, stage.boss);
    assert.equal(boss.firstClear, true, `${stage.boss} should be claimable after ${stage.id}`);
    assert.equal(recordPuzzleBoss(boss.progress, stage.boss).firstClear, false);
    progress = boss.progress;
  }
  assert.equal(progress.bosses.length, 10);
  assert.equal(puzzleSummary(progress).percent, 100);
});

test('puzzle Adventure can be completed solo by replaying all one hundred solutions', () => {
  let progress = defaultPuzzleProgress();
  for (let index = 0; index < PUZZLE_STAGES.length; index += 1) {
    let puzzle = generateStagePuzzle(index, 'solo');
    let current = { ...puzzle, state: JSON.parse(JSON.stringify(puzzle.initial)), moves: 0 };
    for (const move of puzzle.solution) current = applyPuzzleMove(current, move).puzzle;
    assert.equal(puzzleIsSolved(current), true);
    progress = recordPuzzleSolve(progress, PUZZLE_STAGES[index].id, { moves: current.moves }).progress;
  }
  assert.equal(progress.stats.solved, 100);
  assert.equal(progress.abilities.length, 10);
  const boss = recordPuzzleBoss(progress, 'ancient_heart');
  assert.equal(boss.firstClear, true);
});

test('hints reveal a real solution step and cost 100 campaign Gema', () => {
  assert.equal(PUZZLE_HINT_COST, 100);
  for (const type of PUZZLE_TYPES) {
    const puzzle = generatePuzzle(type.id, 2, `hint-${type.id}`);
    assert.ok(puzzleHintText(puzzle).length > 10, `${type.id} hint is too vague`);
  }
  const poor = payPuzzleHint(defaultPuzzleProgress(), 99, 'arc1_1');
  assert.equal(poor.ok, false);
  assert.equal(poor.reason, 'insufficient');
  assert.equal(poor.echoes, 99);
  assert.equal(poor.progress.stats.hints, 0);
  const paid = payPuzzleHint(defaultPuzzleProgress(), 250, 'arc1_1');
  assert.equal(paid.ok, true);
  assert.equal(paid.cost, 100);
  assert.equal(paid.echoes, 150);
  assert.equal(paid.progress.stats.hints, 1);
  assert.equal(paid.progress.hints.arc1_1, 1);
});

test('every arc finale is a boss-timed puzzle with lore and a unique boss', () => {
  assert.equal(PUZZLE_BOSS_TIME_LIMIT, 90);
  assert.equal(PUZZLE_ARCS.length, 10);
  assert.equal(Object.keys(PUZZLE_TYPE_LORE).length, PUZZLE_TYPES.length);
  assert.ok(PUZZLE_LORE.intro.length > 40 && PUZZLE_LORE.epilogue.length > 40);
  for (const arc of PUZZLE_ARCS) {
    assert.ok(arc.story.length > 40, `arc ${arc.arc} story`);
    assert.ok(arc.secret.length > 20, `arc ${arc.arc} secret`);
    assert.ok(PUZZLE_BOSS_BY_ID[arc.boss], `arc ${arc.arc} boss`);
    assert.ok(PUZZLE_BOSS_BY_ID[arc.boss].lore.length > 30, `arc ${arc.arc} boss lore`);
    const stages = PUZZLE_STAGES.filter((stage) => stage.arc === arc.arc);
    assert.equal(stages.length, 10);
    const finale = stages[9];
    assert.equal(finale.boss, arc.boss);
    assert.equal(finale.timed, true);
  }
});

test('save sanitizer repairs forged progress and keeps unknown fields', () => {
  const raw = {
    solved: ['arc1_3', 'arc1_1', 'nope'],
    bosses: ['ancient_heart', 'flooded_architect'],
    hints: { arc1_1: 2, nope: 99 },
    stats: { attempts: '7', solved: -3, timeouts: '2' },
    custom: { kept: true },
  };
  const clean = sanitizePuzzleProgress(raw);
  assert.deepEqual(clean.solved, ['arc1_1']);
  assert.equal(clean.stage, 1);
  assert.deepEqual(clean.abilities, ['rune_scanner']);
  assert.deepEqual(clean.bosses, []);
  assert.deepEqual(clean.hints, { arc1_1: 2 });
  assert.equal(clean.stats.attempts, 7);
  assert.equal(clean.stats.solved, 0);
  assert.equal(clean.stats.timeouts, 2);
  assert.deepEqual(clean.custom, { kept: true });
});
