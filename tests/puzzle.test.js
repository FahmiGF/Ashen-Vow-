import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PUZZLE_TYPES, PUZZLE_ENGINE_IDS, PUZZLE_ABILITIES, PUZZLE_ARC1, PUZZLE_BOSSES,
  PUZZLE_STAGE_BY_ID, PUZZLE_BOSS_BY_ID, generatePuzzle, generateStagePuzzle,
  applyPuzzleMove, puzzleIsSolved, validatePuzzle, publishPuzzle, puzzleSnapshot,
  decodePuzzleState, encodePuzzleState, defaultPuzzleProgress, sanitizePuzzleProgress,
  puzzleStageUnlocked, recordPuzzleSolve, recordPuzzleBoss, puzzleSummary,
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

test('Arc 1 has ten connected stages, ten abilities and puzzle bosses', () => {
  assert.equal(PUZZLE_ARC1.length, 10);
  assert.equal(PUZZLE_ABILITIES.length, 10);
  assert.equal(PUZZLE_BOSSES.length, 5);
  for (let index = 0; index < PUZZLE_ARC1.length; index += 1) {
    const stage = PUZZLE_ARC1[index];
    assert.equal(stage.index, index);
    assert.ok(PUZZLE_STAGE_BY_ID[stage.id]);
    assert.ok(stage.typeId);
    const puzzle = generateStagePuzzle(index, 'arc');
    assert.equal(puzzle.engine, PUZZLE_TYPES.find((type) => type.id === stage.typeId).engine);
    assert.equal(validatePuzzle(puzzle).ok, true);
  }
  assert.ok(PUZZLE_BOSS_BY_ID[PUZZLE_ARC1[9].boss]);
  assert.equal(PUZZLE_ARC1[9].boss, 'ancient_heart');
});

test('stages unlock in order and the final boss requires the full arc', () => {
  let progress = defaultPuzzleProgress();
  assert.equal(puzzleStageUnlocked(progress, 0), true);
  assert.equal(puzzleStageUnlocked(progress, 1), false);
  const skipped = recordPuzzleSolve(progress, 'arc1_5');
  assert.equal(skipped.firstClear, false);
  const earlyBoss = recordPuzzleBoss(progress, 'ancient_heart');
  assert.equal(earlyBoss.firstClear, false);
  for (const stage of PUZZLE_ARC1) {
    const result = recordPuzzleSolve(progress, stage.id, { moves: 4 });
    assert.equal(result.firstClear, true);
    progress = result.progress;
  }
  assert.equal(progress.solved.length, 10);
  assert.equal(progress.abilities.length, 10);
  assert.equal(progress.stage, 10);
  const boss = recordPuzzleBoss(progress, 'ancient_heart');
  assert.equal(boss.firstClear, true);
  assert.equal(recordPuzzleBoss(boss.progress, 'ancient_heart').firstClear, false);
  assert.ok(puzzleSummary(progress).percent >= 90);
});

test('puzzle Adventure can be completed solo by replaying solutions', () => {
  let progress = defaultPuzzleProgress();
  for (let index = 0; index < PUZZLE_ARC1.length; index += 1) {
    let puzzle = generateStagePuzzle(index, 'solo');
    let current = { ...puzzle, state: JSON.parse(JSON.stringify(puzzle.initial)), moves: 0 };
    for (const move of puzzle.solution) current = applyPuzzleMove(current, move).puzzle;
    assert.equal(puzzleIsSolved(current), true);
    progress = recordPuzzleSolve(progress, PUZZLE_ARC1[index].id, { moves: current.moves }).progress;
  }
  assert.equal(progress.stats.solved, 10);
  assert.equal(progress.abilities.length, 10);
  const boss = recordPuzzleBoss(progress, 'ancient_heart');
  assert.equal(boss.firstClear, true);
});

test('save sanitizer repairs forged progress and keeps unknown fields', () => {
  const raw = {
    solved: ['arc1_3', 'arc1_1', 'nope'],
    bosses: ['ancient_heart'],
    hints: { arc1_1: 2, nope: 99 },
    stats: { attempts: '7', solved: -3 },
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
  assert.deepEqual(clean.custom, { kept: true });
});
