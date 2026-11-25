// Profile slots screen (Phase 1, v0.38.0): three save profiles with export,
// import and a guarded delete. Loaded on demand like every mode screen; all
// storage goes through main.js's save store (src/save.js).
import { CHARACTERS } from '../core.js';

const DATE = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export function install(A) {
  let pendingDelete = 0;

  function clock(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h} j ${m} m` : `${m} m ${s % 60} d`;
  }

  function slotCard(info) {
    const name = `PROFIL ${info.slot}`;
    const hero = info.characterId ? CHARACTERS[info.characterId]?.name || info.characterId : '—';
    const deleting = pendingDelete === info.slot;
    return `<article class="slot-card${info.active ? ' active' : ''}${info.empty ? ' empty' : ''}" data-slot-card="${info.slot}">
      <header><h3>${name}</h3>${info.active ? '<span class="slot-badge">AKTIF</span>' : ''}</header>
      ${info.empty ? '<p class="slot-empty">Kosong — perjalanan baru dimulai di sini.</p>' : `<dl>
        <div><dt>Penjaga</dt><dd>${A.esc(hero)}</dd></div>
        <div><dt>Terjauh</dt><dd>${A.esc(info.furthest)}</dd></div>
        <div><dt>Ruang selesai</dt><dd>${info.cleared}</dd></div>
        <div><dt>Waktu tercatat</dt><dd>${clock(info.playSeconds)}</dd></div>
        <div><dt>Disimpan</dt><dd>${info.updatedAt ? DATE.format(new Date(info.updatedAt)) : '—'}</dd></div>
      </dl>`}
      <div class="slot-actions">
        ${info.active ? '' : `<button class="btn btn-primary" type="button" data-slot-load="${info.slot}">${info.empty ? 'MULAI DI SINI' : 'MUAT PROFIL'}</button>`}
        ${info.empty ? '' : `<button class="btn btn-ghost" type="button" data-slot-export="${info.slot}">EKSPOR</button>`}
        <button class="btn btn-ghost" type="button" data-slot-import="${info.slot}">IMPOR</button>
        ${info.empty ? '' : `<button class="btn btn-ghost slot-danger" type="button" data-slot-delete="${info.slot}">HAPUS</button>`}
      </div>
      ${deleting ? `<form class="slot-confirm" data-slot-confirm="${info.slot}">
        <label>Ketik <b>${name}</b> untuk menghapus. Cadangan disimpan 24 jam.</label>
        <input type="text" autocomplete="off" spellcheck="false" aria-label="Konfirmasi hapus ${name}" />
        <button class="btn btn-ghost slot-danger" type="submit">HAPUS PERMANEN</button>
        <button class="btn btn-ghost" type="button" data-slot-cancel>BATAL</button>
      </form>` : ''}
    </article>`;
  }

  function buildSlotsScreen() {
    const wrap = A.$('slot-cards');
    if (!wrap) return;
    wrap.innerHTML = A.saveStore.slots().map(slotCard).join('');
    const note = A.$('slot-note');
    if (note) note.textContent = `Profil aktif: ${A.saveStore.activeSlot}. Pengaturan dan suara berlaku untuk semua profil.`;
  }

  function showSlots() {
    A.menuView = 'slots';
    pendingDelete = 0;
    buildSlotsScreen();
    A.syncScreens();
  }

  /** Switch profile. The page reloads so every system boots from the new slot. */
  function switchSlot(slot, { reload = true } = {}) {
    A.saveProgress();
    A.saveStore.flush();
    const next = A.saveStore.setActiveSlot(slot);
    if (reload) setTimeout(() => window.location.reload(), 60);
    return next;
  }

  function exportSlot(slot) {
    A.saveProgress();
    const text = A.saveStore.exportSlot(slot);
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ashen-vow-profil-${slot}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { /* download unavailable; the text is still returned */ }
    A.showToast(`Profil ${slot} diekspor.`, 1800);
    return text;
  }

  function importSlot(slot, text) {
    const result = A.saveStore.importSlot(slot, text, A.saveSanitizers);
    if (!result.ok) {
      const reasons = { 'not-json': 'berkas bukan JSON', 'wrong-format': 'bukan berkas simpanan Ashen Vow', 'newer-version': 'dibuat versi game yang lebih baru', checksum: 'checksum tidak cocok (berkas diubah)', 'no-areas': 'berkas kosong', empty: 'tidak ada data yang valid' };
      A.showToast(`Impor gagal: ${reasons[result.error] || result.error}`, 2600);
      return result;
    }
    A.showToast(`Profil ${slot} diimpor.`, 1800);
    if (slot === A.saveStore.activeSlot) setTimeout(() => window.location.reload(), 60);
    else buildSlotsScreen();
    return result;
  }

  function pickImportFile(slot) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) importSlot(slot, await file.text());
    }, { once: true });
    input.click();
  }

  function deleteSlot(slot, typedName) {
    if (String(typedName || '').trim().toUpperCase() !== `PROFIL ${slot}`) {
      A.showToast(`Ketik PROFIL ${slot} untuk menghapus.`, 2000);
      return { ok: false, error: 'not-confirmed' };
    }
    const wasActive = slot === A.saveStore.activeSlot;
    const result = A.saveStore.deleteSlot(slot);
    pendingDelete = 0;
    A.showToast(`Profil ${slot} dihapus. Cadangan disimpan 24 jam.`, 2400);
    if (wasActive) setTimeout(() => window.location.reload(), 60);
    else buildSlotsScreen();
    return result;
  }

  function undoDeleteSlot() {
    const result = A.saveStore.undoDelete();
    A.showToast(result.ok ? `Profil ${result.slot} dipulihkan.` : 'Tidak ada profil yang bisa dipulihkan.', 2000);
    buildSlotsScreen();
    return result;
  }

  const screen = A.$('slots-screen');
  screen?.addEventListener('click', (event) => {
    const t = event.target.closest('button');
    if (!t) return;
    if (t.dataset.slotLoad) switchSlot(Number(t.dataset.slotLoad));
    else if (t.dataset.slotExport) exportSlot(Number(t.dataset.slotExport));
    else if (t.dataset.slotImport) pickImportFile(Number(t.dataset.slotImport));
    else if (t.dataset.slotDelete) { pendingDelete = Number(t.dataset.slotDelete); buildSlotsScreen(); A.$('slot-cards')?.querySelector('.slot-confirm input')?.focus(); }
    else if ('slotCancel' in t.dataset) { pendingDelete = 0; buildSlotsScreen(); }
    else if (t.id === 'btn-slots-undo') undoDeleteSlot();
    else if (t.id === 'btn-slots-back') A.showMenu();
  });
  screen?.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-slot-confirm]');
    if (!form) return;
    event.preventDefault();
    deleteSlot(Number(form.dataset.slotConfirm), form.querySelector('input')?.value);
  });

  return { showSlots, buildSlotsScreen, switchSlot, exportSlot, importSlot, deleteSlot, undoDeleteSlot };
}
