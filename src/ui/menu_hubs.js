// Main menu hubs (Master Plan 3.0 §8.2, Phase 1 v0.39.0).
//
// The title menu had ~35 entries. It now shows seven hubs; each hub opens a
// panel holding the original entry buttons, which keep their ids and click
// handlers, so every flow (and every smoke script) still reaches them.
// Pure DOM helper: no game state, no storage. main.js passes callbacks.

export const MENU_HUBS = Object.freeze([
  { id: 'continue', label: 'LANJUTKAN', sub: 'Kembali ke mode terakhir', items: [] },
  { id: 'campaign', label: 'KAMPANYE', sub: 'Perjalanan · level · penjaga · peta · indeks',
    items: ['btn-start', 'btn-levels', 'btn-character-menu', 'btn-difficulty-menu', 'btn-map-menu', 'btn-codex-menu'] },
  { id: 'arcs', label: 'ARC & EKSPANSI', sub: 'Echoes · Atlas · Hearthfall · Faewood · arc lanjutan',
    items: ['btn-expansion-menu', 'btn-atlas-menu', 'btn-court-menu', 'btn-fairy-menu', 'btn-fallen-menu', 'btn-crusade-menu', 'btn-astral-menu', 'btn-eclipse-menu', 'btn-frontier-menu', 'btn-overdrive-menu'] },
  { id: 'scary', label: 'SCARY MODE', sub: 'Mode horor · Blackveil 3D · arsip · pohon vigil',
    items: ['btn-scary-menu', 'btn-horror3d-menu'] },
  { id: 'arena', label: 'MODE ARENA', sub: '3D · labirin · ujian · teka-teki · MOBA · benteng · laut',
    items: ['btn-mode3d-menu', 'btn-labyrinth-menu', 'btn-trials-menu', 'btn-puzzle-menu', 'btn-moba-menu', 'btn-wd-menu', 'btn-pirate-menu', 'btn-realms-menu', 'btn-speedrun-menu', 'btn-fishing-menu', 'btn-coop-menu'] },
  { id: 'archive', label: 'ARSIP', sub: 'Profil simpanan · catatan update · trailer · credits',
    items: ['btn-slots-menu', 'btn-updates', 'btn-trailer-menu', 'btn-credits', 'btn-stage-menu', 'btn-admin-menu'] },
  { id: 'settings', label: 'PENGATURAN', sub: 'Settings 2.0', items: ['btn-settings-menu'], direct: true },
]);

/** Ids of the entry buttons a hub currently offers (hidden ones are locked). */
export function visibleItems(hub, doc = document) {
  return hub.items.filter((id) => {
    const el = doc.getElementById(id);
    return el && !el.classList.contains('hidden');
  });
}

/**
 * Restructure `.main-menu` into hubs.
 * @param {{ root: Element, seen: Set<string>, onSeen: (ids: string[]) => void,
 *           lastEntry: () => ({ id: string, label: string } | null),
 *           onEntry: (id: string, label: string) => void }} options
 */
export function installMenuHubs({ root, seen, onSeen, lastEntry, onEntry }) {
  if (!root || root.dataset.hubs === 'on') return null;
  const doc = root.ownerDocument;
  root.dataset.hubs = 'on';
  const bar = doc.createElement('div');
  bar.className = 'menu-hubs';
  bar.setAttribute('role', 'menu');
  const panels = doc.createElement('div');
  panels.className = 'menu-hub-panels';
  let openHub = null;
  let lastFocus = null;

  const label = (el) => el?.querySelector('span')?.textContent.trim() || el?.textContent.trim() || '';

  for (const hub of MENU_HUBS) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = `btn ${hub.id === 'continue' ? 'btn-primary' : 'btn-ghost'} menu-btn menu-hub-btn`;
    button.dataset.hub = hub.id;
    button.innerHTML = `<span>${hub.label}</span><em>${hub.sub}</em><i class="menu-hub-new hidden" aria-label="baru">BARU</i>`;
    bar.appendChild(button);
    if (!hub.items.length || hub.direct) continue;
    const panel = doc.createElement('div');
    panel.className = 'menu-hub-panel hidden';
    panel.dataset.hubPanel = hub.id;
    panel.innerHTML = `<p class="eyebrow menu-hub-title">${hub.label}</p>`;
    for (const id of hub.items) {
      const el = doc.getElementById(id);
      if (el) panel.appendChild(el);
    }
    const back = doc.createElement('button');
    back.type = 'button';
    back.className = 'link-btn menu-hub-back';
    back.dataset.hubBack = hub.id;
    back.textContent = '← SEMUA MENU';
    panel.appendChild(back);
    panels.appendChild(panel);
  }
  // Direct hubs keep their original button off-screen but clickable.
  for (const hub of MENU_HUBS.filter((h) => h.direct)) {
    for (const id of hub.items) {
      const el = doc.getElementById(id);
      if (el) { el.classList.add('menu-hub-direct'); panels.appendChild(el); }
    }
  }
  root.prepend(panels);
  root.prepend(bar);

  function refresh() {
    const last = lastEntry();
    const cont = bar.querySelector('[data-hub="continue"]');
    if (cont) {
      cont.classList.toggle('hidden', !last || !doc.getElementById(last.id));
      const em = cont.querySelector('em');
      if (em) em.textContent = last ? last.label : '';
    }
    for (const hub of MENU_HUBS) {
      const pip = bar.querySelector(`[data-hub="${hub.id}"] .menu-hub-new`);
      if (!pip) continue;
      const fresh = visibleItems(hub, doc).some((id) => !seen.has(id));
      pip.classList.toggle('hidden', !fresh || Boolean(hub.direct));
    }
  }

  function open(id) {
    const hub = MENU_HUBS.find((h) => h.id === id);
    if (!hub) return false;
    if (hub.id === 'continue') {
      const last = lastEntry();
      const el = last && doc.getElementById(last.id);
      if (el) el.click();
      return Boolean(el);
    }
    if (hub.direct) { doc.getElementById(hub.items[0])?.click(); return true; }
    openHub = id;
    bar.classList.add('hidden');
    for (const panel of panels.querySelectorAll('[data-hub-panel]')) panel.classList.toggle('hidden', panel.dataset.hubPanel !== id);
    const items = visibleItems(hub, doc);
    onSeen(items);
    for (const item of items) seen.add(item);
    refresh();
    const first = panels.querySelector(`[data-hub-panel="${id}"] .menu-btn:not(.hidden)`);
    first?.focus({ preventScroll: true });
    return true;
  }

  function close() {
    openHub = null;
    for (const panel of panels.querySelectorAll('[data-hub-panel]')) panel.classList.add('hidden');
    bar.classList.remove('hidden');
    refresh();
    (lastFocus && bar.contains(lastFocus) ? lastFocus : bar.querySelector('.menu-hub-btn:not(.hidden)'))?.focus({ preventScroll: true });
  }

  bar.addEventListener('click', (event) => {
    const b = event.target.closest('[data-hub]');
    if (!b) return;
    lastFocus = b;
    open(b.dataset.hub);
  });
  panels.addEventListener('click', (event) => {
    if (event.target.closest('[data-hub-back]')) { close(); return; }
    const entry = event.target.closest('.menu-btn');
    if (entry?.id && entry.id !== 'btn-start') onEntry(entry.id, label(entry));
  }, true);

  refresh();
  return {
    open,
    close,
    refresh,
    get openHub() { return openHub; },
    hubs: () => MENU_HUBS.map((hub) => ({ id: hub.id, label: hub.label, items: visibleItems(hub, doc), hidden: bar.querySelector(`[data-hub="${hub.id}"]`)?.classList.contains('hidden') || false })),
  };
}
