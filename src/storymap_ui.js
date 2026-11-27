// Lazy-loaded controller for PETA KISAH (storyline map).
import {
  STORY_ARCS,
  STORY_CURRENT_ID,
  adjacentStoryArc,
  sanitizeStoryArcId,
  storyArcFor,
  storyKindLabel,
  storyMapSummary,
  storyStatusLabel,
} from './storymap.js';

export function createStoryMapController(ctx) {
  const {
    $,
    esc,
    getMenuView,
    setMenuView,
    setStarted,
    setPaused,
    clearShellOverlays,
    clearHeldKeys,
    syncScreens,
    showMenu,
  } = ctx;

  let storyArcId = STORY_CURRENT_ID;
  let domBound = false;

  function storyMetaCell(label, value) {
    return `<div class="storymap-meta-cell"><span>${esc(label)}</span><strong>${esc(String(value))}</strong></div>`;
  }

  function renderStoryArc() {
    const detail = $('storymap-detail');
    if (!detail) return;
    const arc = storyArcFor(storyArcId) || STORY_ARCS[0];
    const index = STORY_ARCS.findIndex((entry) => entry.id === arc.id);
    const prev = adjacentStoryArc(arc.id, -1);
    const next = adjacentStoryArc(arc.id, 1);
    detail.style.setProperty('--arc-color', arc.color);

    detail.innerHTML = `
      <header class="storymap-arc-head">
        <div>
          <p class="storymap-arc-num">${esc(arc.numeral)}<i>${esc(storyKindLabel(arc))}</i></p>
          <h3>${esc(arc.title)}</h3>
          <p class="storymap-arc-sub">${esc(arc.subtitle)}</p>
        </div>
        <span class="storymap-badge${arc.kind === 'locked' ? ' locked' : ''}">${esc(storyStatusLabel(arc))}</span>
      </header>
      <div class="storymap-meta">
        ${storyMetaCell('RILIS', arc.era)}
        ${storyMetaCell('CAKUPAN', arc.scope)}
        ${storyMetaCell('BAB', arc.chapters || '—')}
        ${storyMetaCell('BOSS', arc.bosses || '—')}
      </div>
      <p class="storymap-summary-text">${esc(arc.summary)}</p>
      <h4 class="storymap-heading">ALUR CERITA</h4>
      <ol class="storymap-beats">
        ${arc.beats.map((beat) => `<li>${esc(beat)}</li>`).join('')}
      </ol>
      <h4 class="storymap-heading">TOKOH &amp; PENJAGA</h4>
      <div class="storymap-cast">
        ${arc.cast.map((name) => `<span>${esc(name)}</span>`).join('')}
      </div>
      <p class="storymap-note">${esc(arc.note)}</p>
      <nav class="storymap-nav" aria-label="Pindah arc">
        <button class="btn btn-ghost btn-small" type="button" data-story-step="-1"${prev ? '' : ' disabled'}>
          ${prev ? `← ${esc(prev.numeral)}` : '← AWAL'}
        </button>
        <span>${index + 1} / ${STORY_ARCS.length}</span>
        <button class="btn btn-ghost btn-small" type="button" data-story-step="1"${next ? '' : ' disabled'}>
          ${next ? `${esc(next.numeral)} →` : 'AKHIR →'}
        </button>
      </nav>
    `;
  }

  function buildStoryMap() {
    const summary = storyMapSummary();
    const summaryEl = $('storymap-summary');
    if (summaryEl) {
      summaryEl.innerHTML = [
        ['SAGA', summary.total],
        ['RILIS', summary.shipped],
        ['ARC UTAMA', summary.main],
        ['BOSS', summary.bosses],
        ['TERKINI', summary.currentArc?.numeral || '—'],
      ].map(([label, value]) => storyMetaCell(label, value)).join('');
    }

    const rail = $('storymap-rail');
    if (rail) {
      rail.innerHTML = STORY_ARCS.map((arc) => `
        <button class="storymap-chip${arc.id === storyArcId ? ' active' : ''}${arc.kind === 'locked' ? ' locked' : ''}"
          type="button" data-story-arc="${esc(arc.id)}" style="--arc-color:${arc.color}">
          <span class="storymap-chip-num">${esc(arc.numeral)}</span>
          <span class="storymap-chip-title">${esc(arc.title)}</span>
          <span class="storymap-chip-meta">${esc(storyKindLabel(arc))} · ${esc(storyStatusLabel(arc))}</span>
        </button>
      `).join('');
    }

    renderStoryArc();
  }

  function selectStoryArc(id) {
    storyArcId = sanitizeStoryArcId(id);
    const rail = $('storymap-rail');
    rail?.querySelectorAll('[data-story-arc]').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.storyArc === storyArcId);
    });
    renderStoryArc();
    $('storymap-detail')?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  function open(arcId) {
    clearShellOverlays();
    setStarted(false);
    setPaused(false);
    setMenuView('storymap');
    storyArcId = sanitizeStoryArcId(arcId || storyArcId || STORY_CURRENT_ID);
    clearHeldKeys();
    buildStoryMap();
    syncScreens();
    return true;
  }

  function close() {
    showMenu();
  }

  function bindDom() {
    if (domBound) return;
    domBound = true;
    $('storymap-rail')?.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-story-arc]');
      if (chip) selectStoryArc(chip.dataset.storyArc);
    });
    $('storymap-detail')?.addEventListener('click', (event) => {
      const step = event.target.closest('[data-story-step]');
      if (!step) return;
      const target = adjacentStoryArc(storyArcId, Number(step.dataset.storyStep));
      if (target) selectStoryArc(target.id);
    });
  }

  function snapshot() {
    const arc = storyArcFor(storyArcId) || STORY_ARCS[0];
    return {
      loaded: true,
      open: getMenuView() === 'storymap',
      selected: storyArcId,
      summary: storyMapSummary(),
      arcs: STORY_ARCS.map((entry) => ({ ...entry, status: storyStatusLabel(entry), kindLabel: storyKindLabel(entry) })),
      arc: { ...arc, status: storyStatusLabel(arc), kindLabel: storyKindLabel(arc) },
    };
  }

  return {
    bindDom,
    open,
    close,
    selectStoryArc,
    snapshot,
  };
}
