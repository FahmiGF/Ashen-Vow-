// Ashen Vow — Admin Control Center client.
// Every view talks to /api/admin/*; the server remains authoritative for
// permissions, validation and audit logging. Nothing secret ships here.
const $ = (selector) => document.querySelector(selector);
const state = {
  session: null,
  csrf: '',
  view: 'overview',
  nav: [],
  monitorTimer: 0,
  catalog: null,
  playerQuery: '',
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const date = (value) => (Number(value) > 0 ? new Date(Number(value)).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const ago = (value) => {
  const diff = Date.now() - Number(value || 0);
  if (!Number(value) || diff < 0) return '—';
  if (diff < 60000) return 'baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j lalu`;
  return `${Math.floor(diff / 86400000)}h lalu`;
};
const titleCase = (value) => String(value || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

function toast(message, bad = false) {
  const node = $('#toast');
  node.textContent = message;
  node.style.borderColor = bad ? 'var(--red)' : '';
  node.style.color = bad ? 'var(--red)' : '';
  node.classList.remove('hidden');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.add('hidden'), 3600);
}

async function raw(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (state.csrf && options.method && options.method !== 'GET') headers['X-CSRF-Token'] = state.csrf;
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let data = {};
  try { data = await response.json(); } catch { /* empty */ }
  return { response, data };
}

async function api(path, options = {}) {
  const { response, data } = await raw(path, options);
  if (response.status === 401 && path !== '/api/admin/login') {
    state.session = null;
    showLogin('Sesi berakhir. Silakan masuk kembali.');
    throw new Error('unauthorized');
  }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function showLogin(message = '') {
  clearInterval(state.monitorTimer);
  $('#admin-app').classList.add('hidden');
  $('#admin-login').classList.remove('hidden');
  $('#login-error').textContent = message;
  $('#login-pass').value = '';
}

function showApp(session) {
  state.session = session.user;
  state.csrf = session.csrf;
  state.nav = session.nav || [];
  $('#admin-login').classList.add('hidden');
  $('#admin-app').classList.remove('hidden');
  $('#side-user').innerHTML = `<strong>${esc(state.session.displayName)}</strong><span>${esc(state.session.roleName)}${state.session.mfa ? ' · MFA' : ''}</span>`;
  const nav = $('#admin-nav');
  nav.innerHTML = state.nav.map((entry) => `<button type="button" data-view="${esc(entry.id)}"><span class="ico">${esc(entry.icon)}</span>${esc(entry.label)}</button>`).join('');
  nav.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
  const saved = sessionStorage.getItem('ashen_admin_view');
  navigate(state.nav.some((entry) => entry.id === saved) ? saved : 'overview');
}

async function boot() {
  try {
    const { response, data } = await raw('/api/admin/session');
    if (response.ok && data.user) showApp(data);
    else showLogin();
  } catch {
    showLogin('Server admin tidak dapat dihubungi.');
  }
}

async function authenticate(event) {
  event.preventDefault();
  const button = event.target.querySelector('button[type=submit]');
  button.disabled = true;
  $('#login-error').textContent = '';
  try {
    const { response, data } = await raw('/api/admin/login', {
      method: 'POST',
      body: {
        username: $('#login-user').value,
        password: $('#login-pass').value,
        totp: $('#login-totp').value.replace(/\s/g, ''),
      },
    });
    if (!response.ok) throw new Error(data.error || 'Login gagal.');
    showApp(data);
  } catch (error) {
    $('#login-error').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function logout() {
  try { await raw('/api/admin/logout', { method: 'POST' }); } catch { /* ignore */ }
  state.session = null;
  state.csrf = '';
  showLogin('Anda telah keluar.');
}

function openModal(title, html) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  $('#modal').classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }

function navigate(view) {
  if (!state.nav.some((entry) => entry.id === view)) return;
  state.view = view;
  sessionStorage.setItem('ashen_admin_view', view);
  clearInterval(state.monitorTimer);
  document.querySelectorAll('#admin-nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  const entry = state.nav.find((item) => item.id === view);
  $('#view-title').textContent = entry?.label || 'Overview';
  renderView();
}

async function renderView() {
  const host = $('#admin-view');
  host.innerHTML = '<div class="empty">Memuat data dari server…</div>';
  try {
    const renderer = VIEWS[state.view];
    if (!renderer) throw new Error('Halaman tidak tersedia untuk role ini.');
    await renderer(host);
  } catch (error) {
    if (error.message !== 'unauthorized') host.innerHTML = `<div class="notice bad">${esc(error.message)}</div>`;
  }
}

function metric(label, value, sub = '') {
  return `<div class="kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="sub">${esc(sub)}</div></div>`;
}

function statusTag(status) {
  const kind = status === 'active' || status === 'closed' ? 'ok' : status === 'suspended' || status === 'open' ? 'bad' : 'warn';
  return `<span class="tag ${kind}">${esc(String(status || '—').toUpperCase())}</span>`;
}

function validationCard(validation) {
  const ok = validation?.ok ?? validation?.astral?.ok;
  const errors = validation?.astral?.errors || [];
  return `<div class="card">
    <div class="section-head" style="margin-top:0"><h2>Content validation</h2>${ok ? '<span class="tag ok">VALID</span>' : '<span class="tag bad">NEEDS REVIEW</span>'}</div>
    <p>${ok ? 'Arc VI memenuhi aturan 20 musuh, 4 archetype, dan 1 elite per stage standar.' : `${errors.length} masalah ditemukan.`}</p>
    ${errors.length ? `<div class="code">${esc(errors.slice(0, 30).join('\n'))}</div>` : ''}
  </div>`;
}

// ── views ──────────────────────────────────────────────────────────────────
const VIEWS = {
  async overview(host) {
    const [data, catalog] = await Promise.all([api('/api/admin/overview'), api('/api/admin/catalog')]);
    state.catalog = catalog;
    const server = data.server || {};
    host.innerHTML = `
      ${data.maintenance ? '<div class="notice bad">Maintenance mode aktif. Matchmaking baru ditolak; sesi berjalan dibiarkan selesai.</div>' : ''}
      <div class="grid cols-4">
        ${metric('Registered players', data.registeredPlayers, `${data.playersOnline} online · ${data.suspendedPlayers} suspended`)}
        ${metric('Active sessions', data.activeSessions, `Admin sessions`)}
        ${metric('Open reports', data.openReports, 'Moderation queue')}
        ${metric('Verified rewards', data.rewardClaims, `${data.rejectedClaims} rejected claims`)}
      </div>
      <div class="grid cols-2" style="margin-top:14px">
        <div class="card">
          <div class="section-head" style="margin-top:0"><h2>Game platform</h2><span class="tag ${server.status === 'healthy' ? 'ok' : 'warn'}">${esc((server.status || 'unknown').toUpperCase())}</span></div>
          <div class="monitor-line"><span>Uptime</span><strong>${esc(Math.floor((server.uptimeSeconds || 0) / 60))} minutes</strong></div>
          <div class="monitor-line"><span>Average API latency</span><strong>${esc(server.averageLatencyMs ?? '—')} ms</strong></div>
          <div class="monitor-line"><span>Players in co-op</span><strong>${esc(server.connectedPlayers ?? 0)} / ${esc(server.peakSockets ?? 0)} peak</strong></div>
          <div class="monitor-line"><span>Campaign rooms</span><strong>${esc(catalog.campaign.rooms)} · ${esc(catalog.campaign.astralRooms)} Astral</strong></div>
          <div class="monitor-line"><span>Enemies / bosses</span><strong>${esc(catalog.campaign.enemies)} / ${esc(catalog.campaign.bosses)}</strong></div>
        </div>
        <div class="card">
          <h2>Mode reward verification</h2>
          <div class="bars">
            ${data.modeProgress.map((mode) => {
              const max = Math.max(1, ...data.modeProgress.map((entry) => entry.claims));
              return `<div class="bar"><span>${esc(mode.name)}</span><i style="--w:${Math.round((mode.claims / max) * 100)}%"></i><span>${mode.claims}</span></div>`;
            }).join('')}
          </div>
          <p style="margin-bottom:0">Hadiah eksklusif hanya diberikan lewat claim server yang tervalidasi. Membuka menu mode tidak memberi reward.</p>
        </div>
      </div>
      <div class="section-head"><h2>Recent administrative activity</h2></div>
      <div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Target</th><th>Detail</th></tr></thead><tbody>
        ${(data.recentAudit || []).map((entry) => `<tr><td>${esc(date(entry.at))}</td><td>${esc(entry.actor)}<span class="sub">${esc(entry.role)}</span></td><td class="mono">${esc(entry.action)}</td><td>${esc(entry.target || '—')}</td><td>${esc(entry.details || entry.reason || '')}</td></tr>`).join('') || '<tr><td colspan="5">Belum ada aktivitas.</td></tr>'}
      </tbody></table></div>`;
    const pill = $('#maintenance-pill');
    pill.classList.toggle('hidden', !data.maintenance);
  },

  async players(host) {
    host.innerHTML = `<div class="row" style="margin-bottom:12px"><input id="player-search" placeholder="Cari nama atau player ID…" value="${esc(state.playerQuery)}" /><button id="player-search-btn" class="btn" type="button" style="flex:0 0 auto">CARI</button></div><div id="player-table"></div>`;
    const load = async () => {
      const data = await api(`/api/admin/players?q=${encodeURIComponent(state.playerQuery)}`);
      $('#player-table').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Pemain</th><th>Status</th><th>Unlocked</th><th>Astral</th><th>Mode runs</th><th>Terakhir aktif</th></tr></thead><tbody>
        ${data.players.map((player) => `<tr data-player="${esc(player.id)}" style="cursor:pointer">
          <td>${esc(player.name)}<span class="sub">${esc(player.id)} · ${esc(player.classId)}</span></td>
          <td>${statusTag(player.status)}</td>
          <td>${esc(player.progress?.unlocked || 0)} rooms<span class="sub">${esc(player.progress?.cleared || 0)} cleared</span></td>
          <td>${esc(player.progress?.astralCleared || 0)} / 20<span class="sub">${esc(player.progress?.astralArc || 'belum mulai')}</span></td>
          <td>${esc(player.progress?.realmsRuns || 0)}<span class="sub">${esc(player.progress?.realmsRewards?.length || 0)} verified rewards</span></td>
          <td>${esc(ago(player.lastSeen))}<span class="sub">${esc(date(player.lastSeen))}</span></td>
        </tr>`).join('') || '<tr><td colspan="6">Tidak ada pemain. Pemain muncul setelah client melakukan registrasi.</td></tr>'}
      </tbody></table></div><p class="small muted">${data.total} pemain terdaftar.</p>`;
      $('#player-table').querySelectorAll('tr[data-player]').forEach((row) => row.addEventListener('click', () => playerModal(row.dataset.player)));
    };
    $('#player-search-btn').addEventListener('click', () => { state.playerQuery = $('#player-search').value.trim(); load().catch((error) => toast(error.message, true)); });
    $('#player-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { state.playerQuery = event.target.value.trim(); load(); } });
    await load();
  },

  async campaign(host) {
    const [content, catalog] = await Promise.all([api('/api/admin/content'), api('/api/admin/catalog')]);
    state.catalog = catalog;
    host.innerHTML = `
      ${validationCard(content.validation)}
      <div class="grid cols-3" style="margin-top:14px">
        ${metric('Rooms', catalog.campaign.rooms, 'Legacy + expansions + Arc VI')}
        ${metric('Astral rooms', catalog.campaign.astralRooms, 'Five regions × four stages')}
        ${metric('Boss definitions', catalog.campaign.bosses, 'All arcs')}
      </div>
      <div class="section-head"><h2>Campaign content</h2><button id="validate-content" class="btn small" type="button">RUN VALIDATION</button></div>
      <div class="card"><p>Arc VI terpasang setelah Arc V. Setiap hall standar memiliki tepat 20 musuh: empat archetype dan satu Astral Executioner yang dijamin muncul.</p>
        <div class="table-wrap"><table><thead><tr><th>Region</th><th>Rooms</th><th>Boss</th><th>Gimmick</th></tr></thead><tbody>
          ${[1,2,3,4,5].map((region) => {
            const astral = catalog.campaign.astralRooms;
            return `<tr><td>Region ${region}</td><td>${Math.round(astral / 5)} stages</td><td>${region === 5 ? 'The Architect of Eternity · 4 phases' : 'Region boss'}</td><td>${region === 1 ? 'Gravity distortion, star bridges' : region === 2 ? 'Living cosmic plants' : region === 3 ? 'Cosmic gates, star machinery' : region === 4 ? 'Gravity anomalies' : 'All mechanics combined'}</td></tr>`;
          }).join('')}
        </tbody></table></div>
      </div>
      <div class="section-head"><h2>Content overrides</h2></div>
      <div class="card">
        <div class="notice">Perubahan disimpan sebagai konfigurasi server dan diaudit. Stage override divalidasi sebelum diterima.</div>
        <div class="row"><select id="content-domain"><option value="stage">Stage</option><option value="enemy">Enemy</option><option value="boss">Boss</option><option value="item">Item</option><option value="mode">Mode</option><option value="class">Class</option><option value="arc">Arc</option></select><input id="content-id" placeholder="Content ID" /><button id="content-save" class="btn primary" type="button">SIMPAN OVERRIDE</button></div>
        <textarea id="content-json" placeholder='{"reason":"balance pass","hp":220}'></textarea>
        <div id="override-list" class="small muted" style="margin-top:10px">${Object.keys(content.overrides || {}).length} override tersimpan.</div>
      </div>`;
    $('#validate-content').addEventListener('click', async () => {
      try {
        const data = await api('/api/admin/content/validate', { method: 'POST', body: {} });
        toast(data.ok ? 'Validasi konten lolos.' : `Validasi gagal: ${data.astral.errors.length} masalah.`, !data.ok);
        renderView();
      } catch (error) { toast(error.message, true); }
    });
    $('#content-save').addEventListener('click', async () => {
      let value;
      try { value = JSON.parse($('#content-json').value || '{}'); } catch { toast('JSON tidak valid.', true); return; }
      try {
        await api(`/api/admin/content/${encodeURIComponent($('#content-domain').value)}/${encodeURIComponent($('#content-id').value.trim())}`, { method: 'PUT', body: value });
        toast('Override tersimpan dan dicatat.');
        renderView();
      } catch (error) { toast(error.message, true); }
    });
  },

  async modes(host) {
    const [catalog, overview] = await Promise.all([state.catalog ? Promise.resolve(state.catalog) : api('/api/admin/catalog'), api('/api/admin/overview')]);
    const claims = Object.fromEntries(overview.modeProgress.map((entry) => [entry.id, entry.claims]));
    host.innerHTML = `<div class="notice">Enam mode berjalan independen. Reward eksklusif memerlukan claim yang lolos validasi server; UI lokal tidak dapat memberikannya.</div>
      <div class="grid cols-3">${catalog.modes.map((mode) => `<div class="card"><div class="row" style="justify-content:space-between"><h3>${esc(mode.name)}</h3><span class="tag">${esc(mode.subtitle)}</span></div><p>${esc(mode.objective)}</p><p class="small">${esc(mode.loop)}</p><div class="monitor-line"><span>Verified claims</span><strong>${claims[mode.id] || 0}</strong></div><div class="monitor-line"><span>Exclusive reward</span><strong>${esc(mode.rewardName)}</strong></div></div>`).join('')}</div>`;
  },

  async classes(host) { await catalogTable(host, 'classes', 'Classes', 'Keseimbangan stat dasar dan ketersediaan kelas.'); },
  async enemies(host) { await catalogTable(host, 'enemies', 'Enemies', 'Stat, archetype, elite dan spawn configuration.'); },
  async bosses(host) { await catalogTable(host, 'bosses', 'Bosses', 'Fase, transisi, dan reward table.'); },

  async economy(host) {
    const economy = await api('/api/admin/economy');
    host.innerHTML = `<div class="notice">Perubahan ekonomi memerlukan izin <span class="mono">economy.write</span>, alasan, dan dicatat dalam audit log.</div>
      <div class="card"><div class="field"><label>Economy configuration (JSON)</label><textarea id="economy-json">${esc(JSON.stringify(economy, null, 2))}</textarea></div>
      <div class="field"><label>Alasan perubahan</label><input id="economy-reason" placeholder="Contoh: penyesuaian harga Busur Abu" /></div>
      <button id="economy-save" class="btn primary" type="button">SIMPAN PERUBAHAN</button></div>
      <div class="grid cols-3" style="margin-top:14px">${metric('Currencies', economy.currencies?.length || 0)}${metric('Items', economy.items?.length || 0)}${metric('Drop tables', economy.dropTables?.length || 0)}</div>`;
    $('#economy-save').addEventListener('click', async () => {
      let value; try { value = JSON.parse($('#economy-json').value); } catch { toast('JSON tidak valid.', true); return; }
      const reason = $('#economy-reason').value.trim();
      if (!reason) { toast('Alasan perubahan wajib diisi.', true); return; }
      try { await api('/api/admin/economy', { method: 'PUT', body: { ...value, reason } }); toast('Ekonomi diperbarui.'); renderView(); }
      catch (error) { toast(error.message, true); }
    });
  },

  async events(host) {
    const data = await api('/api/admin/events');
    host.innerHTML = `<div class="grid cols-2">
      <div class="card"><h2>Live events</h2><div id="event-list">${(data.events || []).map((event) => `<div class="role-card"><header><h3>${esc(event.name)}</h3>${statusTag(event.status)}</header><p>${esc(event.desc || 'Tanpa deskripsi.')}</p><p class="small">${esc(date(event.startAt))} → ${esc(date(event.endAt))}</p><div class="row">${event.status !== 'ended' ? `<button class="btn small" data-event="${esc(event.id)}" data-action="${event.status === 'paused' ? 'resume' : 'pause'}">${event.status === 'paused' ? 'RESUME' : 'PAUSE'}</button><button class="btn small danger" data-event="${esc(event.id)}" data-action="end">END</button>` : '<span class="tag">ARCHIVED</span>'}</div></div>`).join('') || '<div class="empty">Belum ada event.</div>'}</div></div>
      <div class="card"><h2>Create event</h2>
        <div class="field"><label>Nama</label><input id="event-name" maxlength="80" /></div>
        <div class="field"><label>Deskripsi</label><textarea id="event-desc" style="min-height:70px"></textarea></div>
        <div class="row"><div class="field"><label>Mulai</label><input id="event-start" type="datetime-local" /></div><div class="field"><label>Selesai</label><input id="event-end" type="datetime-local" /></div></div>
        <div class="field"><label>Rewards (pisahkan koma)</label><input id="event-rewards" placeholder="skin_halloween, ash_boost" /></div>
        <div class="field"><label>Status</label><select id="event-status"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option></select></div>
        <button id="event-create" class="btn primary" type="button">BUAT EVENT</button>
      </div></div>`;
    $('#event-create').addEventListener('click', async () => {
      const start = $('#event-start').value ? new Date($('#event-start').value).getTime() : Date.now();
      const end = $('#event-end').value ? new Date($('#event-end').value).getTime() : start + 86400000;
      try {
        await api('/api/admin/events', { method: 'POST', body: { name: $('#event-name').value, desc: $('#event-desc').value, startAt: start, endAt: end, status: $('#event-status').value, rewards: $('#event-rewards').value.split(',').map((entry) => entry.trim()).filter(Boolean) } });
        toast('Event dibuat dan dijadwalkan.'); renderView();
      } catch (error) { toast(error.message, true); }
    });
    host.querySelectorAll('button[data-event]').forEach((button) => button.addEventListener('click', async () => {
      try { await api(`/api/admin/events/${encodeURIComponent(button.dataset.event)}/${button.dataset.action}`, { method: 'POST', body: {} }); toast(`Event ${button.dataset.action}.`); renderView(); }
      catch (error) { toast(error.message, true); }
    }));
  },

  async stage(host) {
    const catalog = state.catalog || await api('/api/admin/catalog');
    host.innerHTML = `<div class="notice">Stage Access di dashboard membuka sesi testing terisolasi. HACK di game tidak pernah menulis progress kampanye, achievement, inventory, boss completion, atau checkpoint.</div>
      <div class="card"><h2>Authorized stage session</h2><div class="row"><input id="stage-id" type="number" min="0" max="${catalog.campaign.rooms - 1}" placeholder="Stage room ID (0–${catalog.campaign.rooms - 1})" /><select id="stage-mode"><option value="sneak">Sneak Peek</option><option value="hack">HACK Stage</option></select><button id="stage-open" class="btn primary" type="button">OPEN SESSION</button></div>
      <p class="small">Arc VI IDs: 505–524. Arc V: 485–504. Arc I: 0–7. Mode testing tersedia dari Stage Access di dalam game.</p></div>
      <div class="grid cols-4" style="margin-top:14px">${metric('Rooms', catalog.campaign.rooms)}${metric('Astral', catalog.campaign.astralRooms)}${metric('Enemies', catalog.campaign.enemies)}${metric('Bosses', catalog.campaign.bosses)}</div>`;
    $('#stage-open').addEventListener('click', async () => {
      const stageId = Number($('#stage-id').value);
      if (!Number.isInteger(stageId) || stageId < 0 || stageId >= catalog.campaign.rooms) { toast('Stage ID tidak valid.', true); return; }
      try {
        const data = await api('/api/admin/stage-sessions', { method: 'POST', body: { stageId, mode: $('#stage-mode').value } });
        toast(`Sesi ${data.session.id} dicatat.`);
        window.open(`/?stage=${stageId}&hack=1`, '_blank', 'noopener');
      } catch (error) { toast(error.message, true); }
    });
  },

  async reports(host) {
    const data = await api('/api/admin/reports');
    host.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Laporan</th><th>Pemain</th><th>Status</th><th>Dibuat</th><th></th></tr></thead><tbody>
      ${(data.reports || []).map((report) => `<tr><td>${esc(report.reason)}<span class="sub">${esc(report.id)}</span></td><td>${esc(report.playerId)}<span class="sub">oleh ${esc(report.by || 'system')}</span></td><td>${statusTag(report.status)}</td><td>${esc(date(report.at))}</td><td><div class="row"><button class="btn small" data-report="${esc(report.id)}" data-status="reviewing">REVIEW</button><button class="btn small" data-report="${esc(report.id)}" data-status="closed">CLOSE</button></div></td></tr>`).join('') || '<tr><td colspan="5">Tidak ada laporan.</td></tr>'}
    </tbody></table></div>`;
    host.querySelectorAll('button[data-report]').forEach((button) => button.addEventListener('click', async () => {
      try { await api(`/api/admin/reports/${encodeURIComponent(button.dataset.report)}`, { method: 'PUT', body: { status: button.dataset.status, resolution: 'Reviewed from control center' } }); toast('Laporan diperbarui.'); renderView(); }
      catch (error) { toast(error.message, true); }
    }));
  },

  async announcements(host) {
    const status = await api('/api/platform/status');
    host.innerHTML = `<div class="card"><h2>Platform announcement</h2><p>Pesan ini tampil pada status platform dan dapat dibaca client.</p><div class="field"><label>Pengumuman aktif</label><input value="${esc(status.announcement || 'Tidak ada pengumuman aktif.')}" disabled /></div><div class="field"><label>Pesan baru</label><textarea id="announcement-text" maxlength="500"></textarea></div><button id="announcement-send" class="btn primary" type="button">PUBLISH</button></div>`;
    $('#announcement-send').addEventListener('click', async () => {
      try { await api('/api/admin/announcements', { method: 'POST', body: { message: $('#announcement-text').value } }); toast('Pengumuman diterbitkan.'); renderView(); }
      catch (error) { toast(error.message, true); }
    });
  },

  async analytics(host) {
    const [overview, catalog] = await Promise.all([api('/api/admin/overview'), api('/api/admin/catalog')]);
    const max = Math.max(1, ...overview.modeProgress.map((entry) => entry.claims));
    const active = overview.playersOnline;
    host.innerHTML = `<div class="grid cols-4">${metric('Players online', active, '5 minute window')}${metric('Registered', overview.registeredPlayers)}${metric('Verified claims', overview.rewardClaims)}${metric('Live events', overview.liveEvents)}</div>
      <div class="grid cols-2" style="margin-top:14px"><div class="card"><h2>Mode completion claims</h2><div class="bars">${overview.modeProgress.map((mode) => `<div class="bar"><span>${esc(mode.name)}</span><i style="--w:${Math.round((mode.claims / max) * 100)}%"></i><span>${mode.claims}</span></div>`).join('')}</div></div>
      <div class="card"><h2>Content surface</h2><div class="monitor-line"><span>Campaign rooms</span><strong>${catalog.campaign.rooms}</strong></div><div class="monitor-line"><span>Astral rooms</span><strong>${catalog.campaign.astralRooms}</strong></div><div class="monitor-line"><span>Game modes</span><strong>${catalog.modes.length}</strong></div><div class="monitor-line"><span>Classes</span><strong>${catalog.classes.length}</strong></div><div class="monitor-line"><span>Enemy definitions</span><strong>${catalog.campaign.enemies}</strong></div><div class="monitor-line"><span>Boss definitions</span><strong>${catalog.campaign.bosses}</strong></div></div></div>`;
  },

  async monitor(host) {
    const draw = async () => {
      const data = await api('/api/admin/monitor');
      host.innerHTML = `<div class="grid cols-4">${metric('Server', data.status || 'unknown', `Node ${data.node || ''}`)}${metric('Uptime', `${Math.floor((data.uptimeSeconds || 0) / 60)}m`, `Port ${data.port}`)}${metric('Latency', `${data.averageLatencyMs ?? 0} ms`, `Error rate ${data.errorRate ?? 0}%`)}${metric('Memory', `${data.memoryMb ?? 0} MB`, 'RSS')}</div>
        <div class="grid cols-2" style="margin-top:14px"><div class="card"><h2>Live health</h2>
          <div class="monitor-line"><span>API availability</span><strong>${data.status === 'healthy' ? 'Operational' : 'Degraded'}</strong></div>
          <div class="monitor-line"><span>WebSocket relay</span><strong>${data.activeCoopRooms} rooms · ${data.connectedPlayers} players</strong></div>
          <div class="monitor-line"><span>Requests</span><strong>${data.requests}</strong></div>
          <div class="monitor-line"><span>Errors</span><strong>${data.errors}</strong></div>
          <div class="monitor-line"><span>Admin sessions</span><strong>${data.sessions}</strong></div>
          <div class="monitor-line"><span>Maintenance</span><strong>${data.maintenance ? 'ON' : 'OFF'}</strong></div>
          <div class="monitor-line"><span>Measured at</span><strong>${esc(date(data.at))}</strong></div>
        </div><div class="card"><h2>Monitoring notes</h2><p>Metrik diambil langsung dari proses server: request counter, latency, RSS memory, WebSocket room registry dan session store. Database eksternal tidak dipakai; seluruh state admin dipersistensikan secara atomik ke <span class="mono">data/admin-state.json</span>.</p><div class="notice">Status “healthy” hanya menyatakan proses dan API merespons. Tidak ada angka placeholder.</div></div></div>`;
    };
    await draw();
    state.monitorTimer = setInterval(() => draw().catch(() => clearInterval(state.monitorTimer)), 10000);
  },

  async audit(host) {
    host.innerHTML = `<div class="row" style="margin-bottom:12px"><input id="audit-search" placeholder="Cari aktor, aksi, target…" /><button id="audit-search-btn" class="btn" type="button" style="flex:0 0 auto">CARI</button></div><div id="audit-table"></div>`;
    const load = async (q = '') => {
      const data = await api(`/api/admin/audit?q=${encodeURIComponent(q)}`);
      const entries = data.entries || [];
      $('#audit-table').innerHTML = `<div class="table-wrap"><table><thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Target</th><th>Detail</th><th>IP</th></tr></thead><tbody>${entries.map((entry) => `<tr><td>${esc(date(entry.at))}</td><td>${esc(entry.actor)}<span class="sub">${esc(entry.role)}</span></td><td class="mono">${esc(entry.action)}</td><td>${esc(entry.target || '—')}</td><td>${esc(entry.details || '')}${entry.reason ? `<span class="sub">${esc(entry.reason)}</span>` : ''}</td><td class="mono">${esc(entry.ip || '—')}</td></tr>`).join('') || '<tr><td colspan="6">Tidak ada entri.</td></tr>'}</tbody></table></div>`;
    };
    $('#audit-search-btn').addEventListener('click', () => load($('#audit-search').value.trim()).catch((error) => toast(error.message, true)));
    await load();
  },

  async settings(host) {
    const [data, catalog] = await Promise.all([api('/api/admin/settings'), api('/api/admin/catalog')]);
    state.catalog = catalog;
    const settings = data.settings;
    host.innerHTML = `<div class="grid cols-2">
      <div class="card"><h2>Platform settings</h2>
        <div class="field"><label class="check"><input id="set-maintenance" type="checkbox" ${settings.maintenance ? 'checked' : ''} /> Maintenance mode</label></div>
        <div class="field"><label>Maintenance message</label><textarea id="set-message" style="min-height:70px">${esc(settings.maintenanceMessage)}</textarea></div>
        <div class="field"><label class="check"><input id="set-registration" type="checkbox" ${settings.registrationOpen ? 'checked' : ''} /> Player registration open</label></div>
        <div class="field"><label class="check"><input id="set-matchmaking" type="checkbox" ${settings.matchmakingOpen ? 'checked' : ''} /> Matchmaking / co-op relay open</label></div>
        <div class="field"><label class="check"><input id="set-events" type="checkbox" ${settings.eventSubmissions ? 'checked' : ''} /> Event submissions</label></div>
        <div class="field"><label>Max concurrent sessions</label><input id="set-max" type="number" min="10" value="${esc(settings.maxSessions)}" /></div>
        <div class="field"><label>Alasan perubahan</label><input id="set-reason" placeholder="Wajib untuk audit" /></div>
        <button id="settings-save" class="btn primary" type="button">SIMPAN SETTINGS</button>
      </div>
      <div class="card"><h2>Roles & permissions</h2><p>Super Admin selalu memiliki seluruh izin. Role lain dapat disesuaikan; setiap perubahan dicatat.</p><div id="role-list">${Object.entries(data.roles).map(([id, role]) => `<div class="role-card" data-role="${esc(id)}"><header><h3>${esc(role.name)}</h3><span class="tag">${esc(role.permissions.length)} permissions</span></header><p class="small">${esc(role.desc)}</p><div class="checks">${data.permissions.map((permission) => `<label class="check"><input type="checkbox" data-perm="${esc(permission)}" ${role.permissions.includes(permission) ? 'checked' : ''} ${id === 'super_admin' ? 'disabled' : ''} /> ${esc(permission)}</label>`).join('')}</div>${id !== 'super_admin' ? `<button class="btn small" type="button" data-save-role="${esc(id)}">SIMPAN ROLE</button>` : '<span class="tag ok">FULL ACCESS</span>'}</div>`).join('')}</div></div>
    </div>`;
    $('#settings-save').addEventListener('click', async () => {
      const reason = $('#set-reason').value.trim();
      if (!reason) { toast('Alasan perubahan wajib diisi.', true); return; }
      try {
        await api('/api/admin/settings', { method: 'PUT', body: {
          maintenance: $('#set-maintenance').checked,
          maintenanceMessage: $('#set-message').value,
          registrationOpen: $('#set-registration').checked,
          matchmakingOpen: $('#set-matchmaking').checked,
          eventSubmissions: $('#set-events').checked,
          maxSessions: Number($('#set-max').value),
          reason,
        } });
        toast('Settings platform disimpan.'); renderView();
      } catch (error) { toast(error.message, true); }
    });
    host.querySelectorAll('button[data-save-role]').forEach((button) => button.addEventListener('click', async () => {
      const card = button.closest('[data-role]');
      const permissions = [...card.querySelectorAll('input[data-perm]:checked')].map((input) => input.dataset.perm);
      try { await api(`/api/admin/roles/${encodeURIComponent(button.dataset.saveRole)}`, { method: 'PUT', body: { permissions, reason: 'Permission editor update' } }); toast('Izin role disimpan.'); renderView(); }
      catch (error) { toast(error.message, true); }
    }));
  },
};

async function catalogTable(host, domain, title, description) {
  const catalog = state.catalog || await api('/api/admin/catalog');
  state.catalog = catalog;
  const rows = catalog[domain] || [];
  const columns = domain === 'classes'
    ? ['id', 'name', 'title', 'hp', 'damage', 'speed']
    : domain === 'enemies'
      ? ['id', 'name', 'hp', 'dmg', 'behavior', 'where']
      : ['id', 'name', 'phases', 'hp'];
  host.innerHTML = `<div class="notice">${esc(description)} Perubahan disimpan sebagai override server; tidak ada akses langsung ke database client.</div>
    <div class="row" style="margin-bottom:12px"><input id="catalog-search" placeholder="Cari ${esc(title.toLowerCase())}…" /><button id="catalog-edit" class="btn small" type="button" style="flex:0 0 auto">EDIT OVERRIDE JSON</button></div>
    <div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th>${esc(titleCase(column))}</th>`).join('')}<th></th></tr></thead><tbody id="catalog-rows">
      ${rows.slice(0, 250).map((row) => `<tr data-search="${esc(JSON.stringify(row).toLowerCase())}">${columns.map((column) => `<td>${esc(row[column] ?? '—')}${column === 'id' ? `<span class="sub">${esc(domain)}</span>` : ''}</td>`).join('')}<td><button class="btn small" type="button" data-select="${esc(row.id)}">SELECT</button></td></tr>`).join('') || `<tr><td colspan="${columns.length + 1}">Tidak ada data.</td></tr>`}
    </tbody></table></div><p class="small muted">${rows.length} definisi terbaca dari build saat ini.</p>`;
  const search = $('#catalog-search');
  search.addEventListener('input', () => {
    const query = search.value.toLowerCase();
    document.querySelectorAll('#catalog-rows tr[data-search]').forEach((row) => { row.style.display = !query || row.dataset.search.includes(query) ? '' : 'none'; });
  });
  let selected = rows[0]?.id || '';
  host.querySelectorAll('button[data-select]').forEach((button) => button.addEventListener('click', () => {
    selected = button.dataset.select;
    $('#catalog-edit').dataset.selected = selected;
    toast(`${selected} dipilih.`);
  }));
  $('#catalog-edit').addEventListener('click', () => {
    selected = $('#catalog-edit').dataset.selected || selected;
    openModal(`Override ${title} — ${selected}`, `<div class="field"><label>JSON override</label><textarea id="catalog-json" style="min-height:180px">${esc(JSON.stringify({ reason: 'balance review' }, null, 2))}</textarea></div><button id="catalog-save" class="btn primary" type="button">SIMPAN</button>`);
    $('#catalog-save').addEventListener('click', async () => {
      let value; try { value = JSON.parse($('#catalog-json').value); } catch { toast('JSON tidak valid.', true); return; }
      try { await api(`/api/admin/content/${domain}/${encodeURIComponent(selected)}`, { method: 'PUT', body: value }); toast('Override tersimpan.'); closeModal(); }
      catch (error) { toast(error.message, true); }
    });
  });
}

async function playerModal(id) {
  const data = await api(`/api/admin/players?q=${encodeURIComponent(id)}`);
  const player = data.players.find((entry) => entry.id === id) || data.players[0];
  if (!player) { toast('Pemain tidak ditemukan.', true); return; }
  openModal(player.name, `
    <div class="row" style="justify-content:space-between"><span>${statusTag(player.status)}</span><span class="mono">${esc(player.id)}</span></div>
    <div class="grid cols-2" style="margin-top:14px">
      <div class="card"><h3>Account</h3><div class="monitor-line"><span>Class</span><strong>${esc(player.classId)}</strong></div><div class="monitor-line"><span>Created</span><strong>${esc(date(player.createdAt))}</strong></div><div class="monitor-line"><span>Last activity</span><strong>${esc(date(player.lastSeen))}</strong></div><div class="monitor-line"><span>Progress</span><strong>${esc(player.progress?.cleared || 0)} rooms cleared</strong></div><div class="monitor-line"><span>Astral</span><strong>${esc(player.progress?.astralCleared || 0)} / 20</strong></div><div class="monitor-line"><span>Mode runs</span><strong>${esc(player.progress?.realmsRuns || 0)}</strong></div></div>
      <div class="card"><h3>Moderation</h3><div class="code">${esc((player.moderation || []).map((entry) => `${date(entry.at)} · ${entry.action} · ${entry.reason}`).join('\n') || 'Tidak ada riwayat moderasi.')}</div>
      <div class="field"><label>Catatan internal</label><textarea id="player-note" style="min-height:60px">${esc(player.notes || '')}</textarea></div>
      <div class="field"><label>Alasan tindakan</label><input id="player-reason" placeholder="Wajib untuk suspend" /></div>
      <div class="row"><button id="player-save-note" class="btn small" type="button">SIMPAN CATATAN</button><button id="player-suspend" class="btn small danger" type="button">SUSPEND</button><button id="player-restore" class="btn small" type="button">RESTORE</button><button id="player-report" class="btn small" type="button">BUAT LAPORAN</button></div>
      </div>
    </div>`);
  const action = async (suffix, body) => {
    try { await api(`/api/admin/players/${encodeURIComponent(player.id)}/${suffix}`, { method: 'POST', body }); toast('Tindakan tersimpan dan diaudit.'); closeModal(); renderView(); }
    catch (error) { toast(error.message, true); }
  };
  $('#player-save-note').addEventListener('click', () => action('note', { note: $('#player-note').value }));
  $('#player-suspend').addEventListener('click', () => action('suspend', { reason: $('#player-reason').value }));
  $('#player-restore').addEventListener('click', () => action('restore', { reason: $('#player-reason').value }));
  $('#player-report').addEventListener('click', () => action('report', { reason: $('#player-reason').value || 'Manual report from admin' }));
}

// ── wiring ─────────────────────────────────────────────────────────────────
$('#login-form').addEventListener('submit', authenticate);
$('#btn-logout').addEventListener('click', logout);
$('#btn-refresh').addEventListener('click', renderView);
$('#modal-close').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (event) => { if (event.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
boot();
