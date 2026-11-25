// Riftwar â€” MOBA 5v5 — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  MOBA_DIFFICULTIES,
  MOBA_EPIC_BOSSES,
  MOBA_EPIC_BY_ID,
  MOBA_HEROES,
  MOBA_HERO_BY_ID,
  MOBA_JUNGLE_MOBS,
  MOBA_LANES,
  MOBA_MAPS,
  MOBA_MAP_BY_ID,
  MOBA_MINION_TYPES,
  MOBA_ROLES,
  createMobaMatch,
  mobaHeroStats,
  mobaScreenToWorld,
  mobaSnapshot,
  mobaSummary,
  recordMobaMatch,
  renderMoba,
  sanitizeMobaProgress,
  updateMobaMatch,
} from '../moba.js';
import {
  formatPuzzleTime,
} from '../puzzle.js';
import * as __lib0 from '../moba.js';

export function install(A) {
// ── Riftwar: hub, battlefield and result handling ───────────────────────
function mobaState() {
  return A.progressBlock('moba', sanitizeMobaProgress);
}

function showMoba() {
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
  A.menuView = 'moba';
  A.clearHeldKeys();
  buildMobaScreen();
  A.syncScreens();
}

function mobaHeroCard(hero) {
  const selected = hero.id === A.mobaHeroId;
  return `<button class="moba-hero-card${selected ? ' active' : ''}" type="button" data-moba-hero="${hero.id}" style="--hero:${hero.color}" aria-pressed="${selected}">
    <span class="mh-glyph">${hero.glyph}</span>
    <span class="mh-name">${A.esc(hero.name)}</span>
    <span class="mh-meta"><span>${MOBA_ROLES[hero.role]?.name || hero.role}</span><span>L1</span></span>
    <span class="mh-origin">${hero.source === 'core' ? 'KAMPANYE' : 'FRONTIER'} · ${A.esc(hero.className)}</span>
  </button>`;
}

function buildMobaScreen() {
  const state = mobaState();
  const summary = mobaSummary(state);
  const content = A.$('moba-summary');
  if (content) {
    content.innerHTML = `
      <div class="moba-stat"><span>PERTEMPURAN</span><strong>${summary.matches}</strong></div>
      <div class="moba-stat"><span>KEMENANGAN</span><strong>${summary.wins}</strong></div>
      <div class="moba-stat"><span>WIN RATE</span><strong>${summary.winRate}%</strong></div>
      <div class="moba-stat"><span>HERO DIMAINKAN</span><strong>${summary.heroesPlayed}/${summary.heroes}</strong></div>
      <div class="moba-stat"><span>REKOR TERCEPAT</span><strong>${summary.bestTime ? formatPuzzleTime(summary.bestTime) : '—'}</strong></div>`;
  }
  if (!MOBA_HERO_BY_ID[A.mobaHeroId]) A.mobaHeroId = MOBA_HEROES[0].id;
  if (!MOBA_MAP_BY_ID[A.mobaMapId]) A.mobaMapId = MOBA_MAPS[0].id;
  if (!MOBA_LANES.includes(A.mobaLane)) A.mobaLane = 'mid';
  if (!MOBA_DIFFICULTIES.some((entry) => entry.id === A.mobaDifficulty)) A.mobaDifficulty = 'knight';
  const roles = A.$('moba-role-filter');
  if (roles) {
    roles.innerHTML = ['all', ...Object.keys(MOBA_ROLES)].map((role) => `<button class="${A.mobaRoleFilter === role ? 'active' : ''}" type="button" data-moba-role="${role}">${role === 'all' ? 'SEMUA' : MOBA_ROLES[role].name.toUpperCase()}</button>`).join('');
  }
  const roster = A.$('moba-roster');
  if (roster) {
    const filtered = MOBA_HEROES.filter((hero) => A.mobaRoleFilter === 'all' || hero.role === A.mobaRoleFilter);
    roster.innerHTML = filtered.map(mobaHeroCard).join('');
  }
  const count = A.$('moba-hero-count');
  if (count) count.textContent = `${MOBA_HEROES.length} HERO · ${MOBA_ROLES[MOBA_HERO_BY_ID[A.mobaHeroId]?.role]?.name || 'SEMUA'}`;
  const maps = A.$('moba-maps');
  if (maps) {
    maps.innerHTML = MOBA_MAPS.map((map) => `<button class="moba-map-card${map.id === A.mobaMapId ? ' active' : ''}" type="button" data-moba-map="${map.id}">
      <strong>${A.esc(map.name)}</strong><em>${A.esc(map.subtitle)}</em><span>${A.esc(map.lore)}</span>
      <span>${map.epics.length} BOS EPIK · ${map.camps.length} JUNGLE CAMP</span>
    </button>`).join('');
  }
  const lanes = A.$('moba-lanes');
  if (lanes) lanes.innerHTML = MOBA_LANES.map((lane) => `<button class="${lane === A.mobaLane ? 'active' : ''}" type="button" data-moba-lane="${lane}">${lane.toUpperCase()}</button>`).join('');
  const difficulties = A.$('moba-difficulties');
  if (difficulties) difficulties.innerHTML = MOBA_DIFFICULTIES.map((entry) => `<button class="${entry.id === A.mobaDifficulty ? 'active' : ''}" type="button" data-moba-difficulty="${entry.id}" title="${A.esc(entry.desc)}">${entry.name.toUpperCase()}</button>`).join('');
  const codex = A.$('moba-codex');
  if (codex) {
    const map = MOBA_MAP_BY_ID[A.mobaMapId];
    codex.innerHTML = `
      <article><h4>MINION &amp; MENARA</h4><p>${MOBA_MINION_TYPES.length} tipe minion · ${map.towers.filter((tower) => tower.tier !== 'guard').length} menara lane + ${map.towers.filter((tower) => tower.tier === 'guard').length} penjaga nexus. Gelombang berjalan di tiga jalur.</p></article>
      <article><h4>JUNGLE &amp; BOS</h4><p>${MOBA_JUNGLE_MOBS.length} mob jungle · ${MOBA_EPIC_BOSSES.length} bos epik. Bunuh bos untuk memberi seluruh tim buff damage.</p></article>
      <article><h4>${A.esc(map.name)}</h4><p>${map.epics.map((pit) => A.esc(MOBA_EPIC_BY_ID[pit.boss]?.name || pit.boss)).join(' · ')}. ${A.esc(map.lore)}</p></article>`;
  }
  const button = A.$('btn-moba-start');
  if (button) button.innerHTML = `<span>MULAI PERTEMPURAN</span><em>${A.esc(MOBA_HERO_BY_ID[A.mobaHeroId]?.name)} · ${A.esc(MOBA_MAP_BY_ID[A.mobaMapId]?.name)} · ${A.mobaLane.toUpperCase()}</em>`;
}

function startMobaBattle() {
  if (!MOBA_HERO_BY_ID[A.mobaHeroId]) A.mobaHeroId = MOBA_HEROES[0].id;
  if (!MOBA_MAP_BY_ID[A.mobaMapId]) A.mobaMapId = MOBA_MAPS[0].id;
  A.mobaMatch = createMobaMatch({
    heroId: A.mobaHeroId,
    mapId: A.mobaMapId,
    lane: A.mobaLane,
    difficulty: A.mobaDifficulty,
    seed: (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0,
  });
  A.mobaActive = true;
  A.mobaPaused = false;
  A.mobaResult = null;
  A.mobaRecorded = false;
  A.mobaUiTimer = 0;
  A.mobaAim = { x: A.mobaMatch.player.x, y: A.mobaMatch.player.y };
  A.mobaInput.moveX = 0;
  A.mobaInput.moveY = 0;
  A.mobaInput.moveTarget = null;
  A.mobaInput.castSlot = -1;
  A.mobaInput.recall = false;
  A.mobaHeld.clear();
  A.started = false;
  A.paused = false;
  A.shopOpen = false;
  A.mapOpen = false;
  A.codexOpen = false;
  A.inventoryOpen = false;
  A.settingsOpen = false;
  A.menuView = 'mobaBattle';
  A.accumulator = 0;
  A.lastTime = performance.now();
  A.$('moba-result')?.classList.add('hidden');
  A.$('moba-pause')?.classList.add('hidden');
  updateMobaHud(true);
  A.syncScreens();
}

function syncMobaAxes() {
  const left = A.mobaHeld.has('ArrowLeft') || A.mobaHeld.has('KeyA');
  const right = A.mobaHeld.has('ArrowRight') || A.mobaHeld.has('KeyD');
  const up = A.mobaHeld.has('ArrowUp');
  const down = A.mobaHeld.has('ArrowDown');
  A.mobaInput.moveX = (right ? 1 : 0) - (left ? 1 : 0);
  A.mobaInput.moveY = (down ? 1 : 0) - (up ? 1 : 0);
  if (A.mobaInput.moveX || A.mobaInput.moveY) A.mobaInput.moveTarget = null;
}

function toggleMobaPause(next = !A.mobaPaused) {
  if (!A.mobaActive || !A.mobaMatch) return;
  A.mobaPaused = !!next;
  A.mobaHeld.clear();
  A.mobaInput.moveX = 0;
  A.mobaInput.moveY = 0;
  A.lastTime = performance.now();
  A.syncScreens();
  updateMobaHud(true);
}

function leaveMoba() {
  A.mobaActive = false;
  A.mobaPaused = false;
  A.mobaMatch = null;
  A.mobaResult = null;
  A.mobaRecorded = false;
  A.mobaHeld.clear();
  showMoba();
}

function completeMobaMatch() {
  if (!A.mobaMatch || A.mobaMatch.phase !== 'ended' || A.mobaRecorded) return;
  A.mobaRecorded = true;
  const win = A.mobaMatch.winner === 'blue';
  const p = A.mobaMatch.player;
  const saved = recordMobaMatch(mobaState(), {
    win,
    heroId: A.mobaMatch.heroId,
    mapId: A.mobaMatch.mapId,
    lane: A.mobaMatch.playerLane,
    duration: A.mobaMatch.time,
    kills: p?.kills || 0,
    deaths: p?.deaths || 0,
    assists: p?.assists || 0,
  });
  A.progress.moba = saved.progress;
  A.saveProgress();
  A.mobaResult = {
    ...saved,
    win,
    mapName: A.mobaMatch.map.name,
    heroName: p?.name || 'Penjaga',
    snapshot: mobaSnapshot(A.mobaMatch),
    heroes: mobaHeroStats(A.mobaMatch),
    score: { blue: A.mobaMatch.teams.blue.kills, red: A.mobaMatch.teams.red.kills },
  };
  renderMobaResult();
  updateMobaHud(true);
}

function renderMobaResult() {
  const overlay = A.$('moba-result');
  if (!overlay || !A.mobaResult) return;
  const r = A.mobaResult;
  const blue = r.heroes.filter((hero) => hero.team === 'blue').sort((a, b) => b.kills - a.kills);
  const red = r.heroes.filter((hero) => hero.team === 'red').sort((a, b) => b.kills - a.kills);
  overlay.innerHTML = `<div class="moba-modal-card moba-result-card ${r.win ? 'victory' : 'defeat'}">
    <p class="eyebrow">RIFTWAR · ${A.esc(r.mapName)} · ${formatPuzzleTime(r.snapshot.time)}</p>
    <h3 class="moba-result-title">${r.win ? 'NEXUS MUSUH JATUH' : 'NEXUS KITA TERBELAH'}</h3>
    <p>${r.win ? `${A.esc(r.heroName)} memimpin Penjaga Sumpah menutup celah.` : `${A.esc(r.heroName)} bertahan sampai nexus terakhir, tetapi pasukan Rift menang.`}</p>
    <div class="moba-result-stats">
      <div><span>KILL</span><b>${r.snapshot.player?.kills || 0}</b></div>
      <div><span>DEATH</span><b>${r.snapshot.player?.deaths || 0}</b></div>
      <div><span>ASSIST</span><b>${r.snapshot.player?.assists || 0}</b></div>
      <div><span>SKOR</span><b>${r.score.blue} : ${r.score.red}</b></div>
    </div>
    <div class="moba-team-table">${blue.map((hero) => `<div><b>${A.esc(hero.name)}</b><span>${hero.kills}/${hero.deaths}/${hero.assists}</span><span>L${hero.level}</span></div>`).join('')}</div>
    <div class="moba-team-table">${red.map((hero) => `<div><b>${A.esc(hero.name)}</b><span>${hero.kills}/${hero.deaths}/${hero.assists}</span><span>L${hero.level}</span></div>`).join('')}</div>
    <div class="moba-result-actions">
      <button class="btn btn-primary" type="button" data-moba-action="rematch">COBA LAGI</button>
      <button class="btn btn-ghost" type="button" data-moba-action="leave">KEMBALI KE HUB</button>
    </div>
  </div>`;
  overlay.classList.remove('hidden');
}

function updateMobaHud(force = false) {
  if (!A.mobaMatch) return;
  if (A.mobaMatch.phase === 'ended' && !A.mobaRecorded) completeMobaMatch();
  if (!force && A.mobaUiTimer < 1 / 15) return;
  A.mobaUiTimer = 0;
  const p = A.mobaMatch.player;
  const setText = (id, value) => { const node = A.$(id); if (node) node.textContent = value; };
  setText('moba-map-name', A.mobaMatch.map.name.toUpperCase());
  setText('moba-clock', formatPuzzleTime(A.mobaMatch.time));
  setText('moba-wave', `GELOMBANG ${A.mobaMatch.wave}`);
  setText('moba-blue-score', A.mobaMatch.teams.blue.kills);
  setText('moba-red-score', A.mobaMatch.teams.red.kills);
  if (p) {
    setText('moba-player-name', p.name);
    setText('moba-player-glyph', p.glyph);
    setText('moba-player-role', MOBA_ROLES[p.role]?.name || p.role);
    setText('moba-player-level', `L${p.level}`);
    setText('moba-player-gold', `◈ ${p.gold}`);
    setText('moba-player-hp-text', `${Math.ceil(p.hp)} / ${p.maxHp}`);
    setText('moba-player-mana-text', `${Math.ceil(p.mana)} / ${p.maxMana}`);
    setText('moba-player-kda', `${p.kills} / ${p.deaths} / ${p.assists}`);
    const hp = A.$('moba-player-hp'); if (hp) hp.style.width = `${Math.max(0, p.hp / p.maxHp) * 100}%`;
    const mana = A.$('moba-player-mana'); if (mana) mana.style.width = `${Math.max(0, p.mana / p.maxMana) * 100}%`;
    const respawn = A.$('moba-respawn');
    if (respawn) {
      respawn.classList.toggle('hidden', !p.dead);
      respawn.textContent = p.dead ? `RESPAWN ${Math.max(0, p.respawnTimer || 0).toFixed(1)}` : '';
    }
    const abilities = A.$('moba-abilities');
    if (abilities) {
      abilities.innerHTML = p.abilities.map((ability, index) => `<button class="moba-ability${p.cooldowns[index] > 0 ? ' cooling' : ''}" type="button" data-moba-cast="${index}">
        <span class="ma-key">${ability.slot}</span><span class="ma-name">${A.esc(ability.name)}</span><span class="ma-cost">${ability.mana} MP</span><span class="ma-cd">${p.cooldowns[index] > 0 ? `${p.cooldowns[index].toFixed(1)}s` : 'SIAP'}</span>
      </button>`).join('');
    }
  }
  const teamHtml = (team) => mobaHeroStats(A.mobaMatch).filter((hero) => hero.team === team).map((hero) => `<div class="mt-row${hero.dead ? ' dead' : ''}"><b>${A.esc(hero.name)}</b><i>L${hero.level}</i><span>${hero.kills}/${hero.deaths}</span></div>`).join('');
  const blue = A.$('moba-team-blue'); if (blue) blue.innerHTML = teamHtml('blue');
  const red = A.$('moba-team-red'); if (red) red.innerHTML = teamHtml('red');
  const feed = A.$('moba-feed');
  if (feed) {
    const events = A.mobaMatch.texts.slice(-4).reverse();
    feed.innerHTML = events.map((event) => `<span style="color:${event.color}">${A.esc(event.text)}</span>`).join('');
  }
  const pause = A.$('moba-pause');
  if (pause) pause.classList.toggle('hidden', !A.mobaPaused);
}

function mobaPointerWorld(event) {
  const canvas = A.$('moba-canvas');
  if (!canvas || !A.mobaMatch) return null;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * canvas.width;
  const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * canvas.height;
  return mobaScreenToWorld(A.mobaMatch, x, y, canvas.width, canvas.height);
}

function mobaFrame(raw, now) {
  if (A.mobaMatch && !A.mobaPaused && A.mobaMatch.phase === 'playing') {
    updateMobaMatch(A.mobaMatch, Math.min(raw, 0.05), A.mobaInput);
    A.mobaInput.castSlot = -1;
  }
  const canvas = A.$('moba-canvas');
  const ctx = canvas?.getContext('2d');
  if (canvas && ctx) renderMoba(ctx, A.mobaMatch, { width: canvas.width, height: canvas.height, time: now / 1000 });
  if (A.mobaMatch?.phase === 'ended') completeMobaMatch();
  A.mobaUiTimer += raw;
  updateMobaHud();
}

  return { mobaState, showMoba, mobaHeroCard, buildMobaScreen, startMobaBattle, syncMobaAxes, toggleMobaPause, leaveMoba, completeMobaMatch, renderMobaResult, updateMobaHud, mobaPointerWorld, mobaFrame, lib: __lib0 };
}
