// Update Log — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  UPDATE_LOG,
} from '../updates.js';
import {
  GAME_VERSION,
} from '../version.js';
import * as __lib0 from '../updates.js';

export function install(A) {
// ── update log ───────────────────────────────────────────────────────────
function buildUpdateLog() {
  const wrap = A.$('update-log');
  if (!wrap) return;
  wrap.innerHTML = UPDATE_LOG.map((entry, index) => `
    <article class="update-entry${index === 0 ? ' latest' : ''}">
      <header class="update-head">
        <div class="update-version-row">
          <span class="update-version">v${entry.version}</span>
          <span class="update-tag">${entry.tag}</span>
          ${index === 0 ? '<span class="update-current">TERBARU</span>' : ''}
        </div>
        <span class="update-date">${entry.date}</span>
      </header>
      <h3 class="update-title">${entry.title}</h3>
      <p class="update-summary">${entry.summary}</p>
      <ul class="update-list">
        ${entry.highlights.map((line) => `<li>${line}</li>`).join('')}
      </ul>
      ${entry.fixes?.length ? `
        <div class="update-fixes">
          <span>PERBAIKAN &amp; PENYESUAIAN</span>
          <ul>${entry.fixes.map((line) => `<li>${line}</li>`).join('')}</ul>
        </div>` : ''}
    </article>
  `).join('');
  const badge = A.$('updates-version');
  if (badge) badge.textContent = `VERSI SAAT INI · v${GAME_VERSION}`;
}

function showUpdates() {
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
  A.spectateGame = null;
  A.menuView = 'updates';
  A.clearHeldKeys();
  buildUpdateLog();
  A.syncScreens();
}

  return { buildUpdateLog, showUpdates, lib: __lib0 };
}
