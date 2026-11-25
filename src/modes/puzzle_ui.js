// Puzzle Adventure — The Lost Mechanism — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  PUZZLE_ABILITIES,
  PUZZLE_ARCS,
  PUZZLE_BOSSES,
  PUZZLE_BOSS_BY_ID,
  PUZZLE_HINT_COST,
  PUZZLE_LORE,
  PUZZLE_STAGES,
  PUZZLE_TYPES,
  PUZZLE_TYPE_BY_ID,
  PUZZLE_TYPE_LORE,
  applyPuzzleMove,
  formatPuzzleTime,
  generatePuzzle,
  payPuzzleHint,
  puzzleBossTimer,
  puzzleHintText,
  puzzleIsSolved,
  puzzleStageUnlocked,
  puzzleSummary,
  recordPuzzleBoss,
  recordPuzzleSolve,
  sanitizePuzzleProgress,
} from '../puzzle.js';
import * as __lib0 from '../puzzle.js';

export function install(A) {
// ── Puzzle Adventure ──────────────────────────────────────────────────────
function puzzleState() {
  return A.progressBlock('puzzle', sanitizePuzzleProgress);
}

function showPuzzleAdventure(tab) {
  const nextTab = typeof tab === 'string' ? tab : A.puzzleTab;
  stopPuzzleTimer();
  A.cancelPrologue();
  A.started = false;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.closeDialogue(true);
  A.spectating = false;
  A.puzzleRun = null;
  A.puzzleSelected = -1;
  A.puzzleTab = nextTab;
  A.menuView = 'puzzle';
  A.clearHeldKeys();
  buildPuzzleScreen();
  A.syncScreens();
}

function buildPuzzleScreen() {
  const p = puzzleState();
  const summary = puzzleSummary(p);
  const wallet = A.expState();
  const head = A.$('puzzle-summary');
  if (head) {
    head.innerHTML = `
      <div class="lab-stat"><span>TAHAP</span><strong>${summary.solved}/${summary.stages}</strong></div>
      <div class="lab-stat"><span>ARC</span><strong>${summary.arcs}</strong></div>
      <div class="lab-stat"><span>JENIS TEKA-TEKI</span><strong>${summary.types}</strong></div>
      <div class="lab-stat"><span>KEMAMPUAN</span><strong>${summary.abilities}/${summary.abilityTotal}</strong></div>
      <div class="lab-stat"><span>PROGRES</span><strong>${summary.percent}%</strong></div>
      <div class="lab-stat"><span>BOSS</span><strong>${summary.bosses}</strong></div>
      <div class="lab-stat"><span>GEMA</span><strong>✦ ${wallet.echoes}</strong></div>
      <div class="lab-stat"><span>BERIKUTNYA</span><strong>${summary.next ? summary.next.name : 'SELESAI'}</strong></div>`;
  }
  document.querySelectorAll('[data-puzzle-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.puzzleTab === A.puzzleTab);
  });
  const body = A.$('puzzle-body');
  if (!body) return;
  if (A.puzzleTab === 'index') {
    body.innerHTML = puzzleIndexMarkup(p);
    return;
  }
  if (A.puzzleTab === 'lore') {
    body.innerHTML = puzzleLoreMarkup();
    return;
  }
  const abilities = PUZZLE_ABILITIES.map((ability) => `<span class="puzzle-ability ${p.abilities.includes(ability.id) ? '' : 'locked'}">${p.abilities.includes(ability.id) ? '✦' : '◇'} ${A.esc(ability.name)}</span>`).join('');
  let currentArc = 0;
  const stages = PUZZLE_STAGES.map((stage) => {
    const solved = p.solved.includes(stage.id);
    const unlocked = puzzleStageUnlocked(p, stage.index);
    const type = PUZZLE_TYPE_BY_ID[stage.typeId];
    const heading = stage.arc !== currentArc
      ? `<div class="puzzle-arc-head"><span>ARC ${stage.arc}</span><strong>${A.esc(stage.arcTitle)}</strong><em>${stage.arc === 1 ? '10 TAHAP' : '10 TAHAP · BOS'}</em></div>`
      : '';
    currentArc = stage.arc;
    return `${heading}<article class="puzzle-stage ${solved ? 'cleared' : ''} ${stage.timed ? 'timed' : ''} ${unlocked ? '' : 'locked'}">
      <span class="puzzle-stage-index">${String(stage.index + 1).padStart(2, '0')}</span>
      <div>
        <h3>${A.esc(stage.name)}</h3>
        <p>${A.esc(stage.location)} · ${A.esc(type?.name || stage.typeId)}${stage.boss ? ` · BOS-TIMED ${formatPuzzleTime(stage.timeLimit)}` : ''}</p>
      </div>
      <button class="btn btn-ghost btn-compact" type="button" data-puzzle-stage="${stage.index}" ${unlocked ? '' : 'disabled'}>
        ${solved ? 'SELESAI' : unlocked ? 'MAINKAN' : 'TERKUNCI'}
      </button>
    </article>`;
  }).join('');
  body.innerHTML = `<div class="puzzle-abilities">${abilities}</div>${stages}`;
}

function puzzleIndexMarkup(progress) {
  const counts = {};
  for (const stage of PUZZLE_STAGES) counts[stage.typeId] = (counts[stage.typeId] || 0) + 1;
  const cards = PUZZLE_TYPES.map((type) => `<article class="puzzle-lore-card">
    <div class="puzzle-lore-head"><span>${String(type.index + 1).padStart(2, '0')} · ${A.esc(type.engine)}</span><strong>${A.esc(type.name)}</strong><em>${counts[type.id] || 0}x TAHAP</em></div>
    <p>${A.esc(type.desc)}</p>
    <blockquote>${A.esc(PUZZLE_TYPE_LORE[type.id] || '')}</blockquote>
  </article>`).join('');
  return `<div class="puzzle-lore-intro"><span>INDEKS MEKANISME</span><p>${A.esc(PUZZLE_LORE.intro)}</p><em>${PUZZLE_TYPES.length} sistem · ${PUZZLE_STAGES.length} tahap · ${progress.solved.length} tuntas</em></div>
    <div class="puzzle-lore-grid">${cards}</div>`;
}

function puzzleLoreMarkup() {
  const arcs = PUZZLE_ARCS.map((arc) => {
    const stages = PUZZLE_STAGES.filter((stage) => stage.arc === arc.arc);
    const boss = PUZZLE_BOSS_BY_ID[arc.boss];
    return `<article class="puzzle-arc-lore">
      <div class="puzzle-lore-head"><span>ARC ${arc.arc} · ${stages.length} TAHAP</span><strong>${A.esc(arc.title)}</strong><em>${A.esc(boss?.name || 'BOS')}</em></div>
      <p>${A.esc(arc.story)}</p>
      <blockquote>${A.esc(arc.secret)}</blockquote>
      <small>${A.esc(boss?.lore || '')}</small>
    </article>`;
  }).join('');
  return `<div class="puzzle-lore-intro"><span>CATATAN LORE</span><p>${A.esc(PUZZLE_LORE.intro)}</p><em>${PUZZLE_ARCS.length} arc · ${PUZZLE_BOSSES.length} bos</em></div>
    <div class="puzzle-lore-stack">${arcs}</div>
    <div class="puzzle-lore-epilogue"><span>EPILOG</span><p>${A.esc(PUZZLE_LORE.epilogue)}</p></div>`;
}

function startPuzzleStage(index) {
  const stage = PUZZLE_STAGES[index];
  if (!stage || !puzzleStageUnlocked(puzzleState(), index)) return false;
  const phases = stage.boss ? (PUZZLE_BOSS_BY_ID[stage.boss]?.phases || [stage.typeId]) : [stage.typeId];
  A.puzzleRun = {
    stageIndex: index, stage, phase: 0, phases,
    puzzle: generatePuzzle(phases[0], stage.difficulty, `arc|${stage.id}|0`), done: false,
    timeLimit: puzzleBossTimer(stage), deadline: 0,
  };
  A.puzzleSelected = -1;
  A.menuView = 'puzzlePlay';
  buildPuzzlePlay();
  startPuzzleTimer();
  A.syncScreens();
  return true;
}

function buildPuzzlePlay() {
  if (!A.puzzleRun) return;
  const { stage, puzzle, phase, phases } = A.puzzleRun;
  const eyebrow = A.$('puzzle-play-eyebrow');
  const title = A.$('puzzle-play-title');
  const desc = A.$('puzzle-play-desc');
  const status = A.$('puzzle-status');
  if (eyebrow) eyebrow.textContent = `ARC ${stage.arc} · ${stage.location.toUpperCase()} · STAGE ${stage.index + 1} / ${PUZZLE_STAGES.length}${phases.length > 1 ? ` · FASE ${phase + 1}/${phases.length}` : ''}`;
  if (title) title.textContent = puzzle.typeName;
  if (desc) desc.textContent = PUZZLE_TYPE_BY_ID[puzzle.typeId]?.desc || '';
  if (status) status.textContent = `Langkah: ${puzzle.moves} · Susun sampai mekanisme menyala.`;
  const wallet = A.$('puzzle-currency');
  if (wallet) wallet.textContent = `✦ ${A.expState().echoes} GEMA · PETUNJUK ${PUZZLE_HINT_COST} GEMA`;
  updatePuzzleTimerWidget();
  const board = A.$('puzzle-board');
  if (!board) return;
  board.innerHTML = puzzleBoardMarkup(puzzle);
}

function puzzleBoardMarkup(puzzle) {
  if (puzzle.engine === 'path') {
    const pathCells = new Set(puzzle.state.path.map(([x, y]) => `${x},${y}`));
    const blocked = new Set(puzzle.blocked);
    const cells = [];
    for (let y = 0; y < puzzle.h; y += 1) {
      for (let x = 0; x < puzzle.w; x += 1) {
        const key = `${x},${y}`;
        const isStart = x === puzzle.start[0] && y === puzzle.start[1];
        const isGoal = x === puzzle.goal[0] && y === puzzle.goal[1];
        const classes = ['puzzle-cell'];
        if (blocked.has(key)) classes.push('blocked');
        if (pathCells.has(key)) classes.push('path');
        if (isStart) classes.push('start');
        if (isGoal) classes.push('goal');
        cells.push(`<button class="${classes.join(' ')}" type="button" data-cell="${x},${y}" ${blocked.has(key) ? 'disabled' : ''}>${isStart ? '●' : isGoal ? '□' : pathCells.has(key) ? '·' : ''}</button>`);
      }
    }
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${puzzle.w},minmax(0,1fr))">${cells.join('')}</div>`;
  }
  if (puzzle.engine === 'pipes') {
    const glyph = { straight: '│', elbow: '└', tee: '┬', cross: '┼', deadend: '╵' };
    const cells = puzzle.pieces.map((kind, index) => {
      const rotation = puzzle.state.rotations[index] || 0;
      const source = index === 0;
      const sink = index === puzzle.base.length - 1;
      return `<button class="puzzle-cell ${source ? 'source' : ''} ${sink ? 'target' : ''}" type="button" data-rotate="${index}" title="Putar pipa">
        <span style="display:inline-block;transform:rotate(${rotation * 90}deg)">${glyph[kind] || '┼'}</span>
      </button>`;
    }).join('');
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${puzzle.w},minmax(0,1fr))">${cells}</div>`;
  }
  if (puzzle.engine === 'beam') {
    const cells = [];
    for (let y = 0; y < puzzle.h; y += 1) {
      for (let x = 0; x < puzzle.w; x += 1) {
        const mirrorIndex = (puzzle.mirrorPositions || []).findIndex(([mx, my]) => mx === x && my === y);
        const isSource = x === puzzle.source[0] && y === puzzle.source[1];
        const isTarget = x === puzzle.target[0] && y === puzzle.target[1];
        if (mirrorIndex >= 0) {
          const glyph = puzzle.mirrors[mirrorIndex] === '/' ? '/' : '\\';
          const rotation = puzzle.state.rotations[mirrorIndex] || 0;
          cells.push(`<button class="puzzle-cell mirror" type="button" data-rotate="${mirrorIndex}"><span style="display:inline-block;transform:rotate(${rotation * 90}deg)">${glyph}</span></button>`);
        } else {
          cells.push(`<button class="puzzle-cell ${isSource ? 'source' : ''} ${isTarget ? 'target' : ''}" type="button" disabled>${isSource ? '◉' : isTarget ? '◈' : ''}</button>`);
        }
      }
    }
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${puzzle.w},minmax(0,1fr))">${cells.join('')}</div>`;
  }
  if (puzzle.engine === 'sequence' || puzzle.engine === 'image' || puzzle.engine === 'swap') {
    const labels = puzzle.engine === 'image'
      ? puzzle.state.order.map((value) => `PETAK ${value + 1}`)
      : puzzle.state.order.map((value) => String(value).replace('rune_', 'RUNE '));
    const tiles = labels.map((label, index) => `<button class="puzzle-tile ${A.puzzleSelected === index ? 'selected' : ''}" type="button" data-swap="${index}">${A.esc(label)}</button>`).join('');
    return `<div class="puzzle-sequence">${tiles}</div>`;
  }
  if (puzzle.engine === 'gear' || puzzle.engine === 'toggle') {
    const cells = puzzle.state.state.map((value, index) => `<button class="puzzle-cell ${value ? 'on' : ''}" type="button" data-toggle="${index}">${value ? '✦' : '◇'}<span style="font-size:9px;display:block">${index + 1}</span></button>`).join('');
    return `<div class="puzzle-board" style="grid-template-columns:repeat(${Math.min(6, puzzle.count)},minmax(0,1fr))">${cells}</div>`;
  }
  return '<p class="puzzle-status">Teka-teki ini belum punya papan.</p>';
}

function handlePuzzleBoardClick(event) {
  if (!A.puzzleRun || A.puzzleRun.done) return;
  const puzzle = A.puzzleRun.puzzle;
  let move = null;
  const cell = event.target.closest('[data-cell]');
  if (cell) {
    const [x, y] = cell.dataset.cell.split(',').map(Number);
    move = { cell: [x, y] };
  }
  const rotate = event.target.closest('[data-rotate]');
  if (rotate) move = { rotate: Number(rotate.dataset.rotate), turns: 1 };
  const swap = event.target.closest('[data-swap]');
  if (swap) {
    const index = Number(swap.dataset.swap);
    if (A.puzzleSelected < 0) {
      A.puzzleSelected = index;
      buildPuzzlePlay();
      return;
    }
    if (A.puzzleSelected === index) {
      A.puzzleSelected = -1;
      buildPuzzlePlay();
      return;
    }
    move = { a: A.puzzleSelected, b: index };
    A.puzzleSelected = -1;
  }
  const toggle = event.target.closest('[data-toggle]');
  if (toggle) move = { index: Number(toggle.dataset.toggle) };
  if (!move) return;
  const result = applyPuzzleMove(puzzle, move);
  if (!result.ok) {
    const status = A.$('puzzle-status');
    if (status) status.textContent = 'Langkah itu tidak valid untuk mekanisme ini.';
    return;
  }
  A.puzzleRun.puzzle = result.puzzle;
  buildPuzzlePlay();
  if (puzzleIsSolved(result.puzzle)) finishPuzzleStage();
}

function finishPuzzleStage() {
  if (!A.puzzleRun) return;
  const run = A.puzzleRun;
  if (run.phase < run.phases.length - 1) {
    run.phase += 1;
    A.puzzleSelected = -1;
    run.puzzle = generatePuzzle(run.phases[run.phase], run.stage.difficulty, `arc|${run.stage.id}|${run.phase}`);
    resetPuzzleTimer();
    buildPuzzlePlay();
    A.showToast(`Mekanisme fase ${run.phase + 1} aktif — waktu diatur ulang.`, 2000);
    return;
  }
  run.done = true;
  stopPuzzleTimer();
  const record = recordPuzzleSolve(A.progress.puzzle, run.stage.id, { moves: run.puzzle.moves });
  A.progress.puzzle = record.progress;
  if (run.stage.boss) {
    const boss = recordPuzzleBoss(A.progress.puzzle, run.stage.boss);
    A.progress.puzzle = boss.progress;
    if (boss.firstClear) A.showToast(`${PUZZLE_BOSS_BY_ID[run.stage.boss]?.name || 'Bos'} dikalahkan — Ancient Compass diraih.`, 3000);
  }
  A.saveProgress();
  const status = A.$('puzzle-status');
  if (status) status.textContent = 'Mekanisme menyala. Jalan terbuka.';
  setTimeout(() => {
    if (A.menuView === 'puzzlePlay') showPuzzleAdventure('stages');
  }, 900);
}

function updatePuzzleTimerWidget() {
  const widget = A.$('puzzle-timer');
  const value = A.$('puzzle-timer-value');
  if (!widget || !value) return;
  const timed = !!A.puzzleRun?.stage?.timed && !A.puzzleRun.done;
  widget.classList.toggle('hidden', !timed);
  if (!timed) return;
  const remaining = A.puzzleRun.deadline > 0 ? (A.puzzleRun.deadline - Date.now()) / 1000 : A.puzzleRun.timeLimit;
  value.textContent = formatPuzzleTime(remaining);
  widget.classList.toggle('danger', remaining <= 15);
}

function startPuzzleTimer() {
  stopPuzzleTimer();
  if (!A.puzzleRun?.stage?.timed) {
    updatePuzzleTimerWidget();
    return;
  }
  A.puzzleRun.timeLimit = puzzleBossTimer(A.puzzleRun.stage);
  A.puzzleRun.deadline = Date.now() + A.puzzleRun.timeLimit * 1000;
  updatePuzzleTimerWidget();
  A.puzzleTimerInterval = setInterval(updatePuzzleTimer, 200);
}

function resetPuzzleTimer() {
  if (!A.puzzleRun?.stage?.timed) return;
  A.puzzleRun.deadline = Date.now() + A.puzzleRun.timeLimit * 1000;
  updatePuzzleTimerWidget();
}

function stopPuzzleTimer() {
  if (A.puzzleTimerInterval) clearInterval(A.puzzleTimerInterval);
  A.puzzleTimerInterval = null;
  const widget = A.$('puzzle-timer');
  if (widget) widget.classList.add('hidden');
}

function updatePuzzleTimer() {
  if (!A.puzzleRun || A.puzzleRun.done) {
    stopPuzzleTimer();
    return;
  }
  updatePuzzleTimerWidget();
  if (A.puzzleRun.deadline > 0 && Date.now() >= A.puzzleRun.deadline) timeoutPuzzleStage();
}

function timeoutPuzzleStage() {
  if (!A.puzzleRun || A.puzzleRun.done) return;
  A.puzzleRun.done = true;
  stopPuzzleTimer();
  const run = A.puzzleRun;
  puzzleState().stats.timeouts += 1;
  A.saveProgress();
  const status = A.$('puzzle-status');
  if (status) status.textContent = `WAKTU HABIS — ${PUZZLE_BOSS_BY_ID[run.stage.boss]?.name || 'bos'} menutup mekanisme. Coba lagi.`;
  const timer = A.$('puzzle-timer');
  if (timer) { timer.classList.remove('hidden'); timer.classList.add('danger'); }
  const value = A.$('puzzle-timer-value');
  if (value) value.textContent = '00:00';
  setTimeout(() => {
    if (A.menuView === 'puzzlePlay' && A.puzzleRun === run) showPuzzleAdventure('stages');
  }, 1400);
}

function resetPuzzleBoard() {
  if (!A.puzzleRun) return;
  A.puzzleRun.puzzle = generatePuzzle(A.puzzleRun.puzzle.typeId, A.puzzleRun.puzzle.difficulty, A.puzzleRun.puzzle.seed);
  A.puzzleSelected = -1;
  buildPuzzlePlay();
}

function showPuzzleHint() {
  if (!A.puzzleRun || A.puzzleRun.done) return;
  const status = A.$('puzzle-status');
  const wallet = A.expState();
  const payment = payPuzzleHint(A.progress.puzzle, wallet.echoes, A.puzzleRun.stage.id, PUZZLE_HINT_COST);
  if (!payment.ok) {
    if (status) status.textContent = `Gema tidak cukup. Butuh ✦ ${payment.cost} Gema — kumpulkan dari kampanye utama. (Punya ✦ ${payment.echoes})`;
    return;
  }
  wallet.echoes = payment.echoes;
  A.progress.puzzle = payment.progress;
  A.saveProgress();
  if (status) status.textContent = `−✦ ${payment.cost} Gema · ${puzzleHintText(A.puzzleRun.puzzle)} · Sisa ✦ ${wallet.echoes}.`;
  const balance = A.$('puzzle-currency');
  if (balance) balance.textContent = `✦ ${wallet.echoes} GEMA · PETUNJUK ${PUZZLE_HINT_COST} GEMA`;
}

  return { puzzleState, showPuzzleAdventure, buildPuzzleScreen, puzzleIndexMarkup, puzzleLoreMarkup, startPuzzleStage, buildPuzzlePlay, puzzleBoardMarkup, handlePuzzleBoardClick, finishPuzzleStage, updatePuzzleTimerWidget, startPuzzleTimer, resetPuzzleTimer, stopPuzzleTimer, updatePuzzleTimer, timeoutPuzzleStage, resetPuzzleBoard, showPuzzleHint, lib: __lib0 };
}
