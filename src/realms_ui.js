// Ashen Vow — Infinite Realms UI
// Mode hub, deterministic mode runs, Stage Access with read-only Sneak Peek,
// isolated HACK testing toolbar, and the Arc VI campaign hub.
//
// The simulation itself lives in realms.js/astral.js and stays DOM-free. This
// file is the browser shell and never awards exclusive rewards locally: claims
// are sent to the server and only a verified response enters progress.realms.
import { AshenGame } from './core.js';
import { Renderer } from './render.js';
import {
  ASTRAL_LOCAL_NAME,
  ASTRAL_NAME,
  ASTRAL_PITCH,
  ASTRAL_REGIONS,
  ASTRAL_ROOM_BY_ID,
  ASTRAL_BOSS_BY_ID,
  astralRoomUnlocked,
  astralSummary,
} from './astral.js';
import {
  REALM_MODES,
  REALM_MODE_BY_ID,
  REALM_DIFFICULTIES,
  REALM_DIFFICULTY_BY_ID,
  REALM_REWARDS,
  createRealmRun,
  updateRealmRun,
  realmAction,
  realmEligibility,
  realmClaimPayload,
  recordRealmRun,
  sanitizeRealmsProgress,
  defaultRealmsProgress,
  realmsSummary,
  stageAccessCatalog,
  stageAccessStats,
  stageInfo,
  hackSessionConfig,
} from './realms.js';
import { renderRealm } from './realms_render.js';

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pct = (value, total) => `${Math.max(0, Math.min(100, total ? (value / total) * 100 : 0))}%`;
const PLAYER_TOKEN_KEY = 'ashen-vow-player-token';

function list(items, render) { return items.map(render).join(''); }

export class RealmsUI {
  constructor(options = {}) {
    this.options = options;
    this.getProgress = options.getProgress || (() => ({}));
    this.save = options.saveProgress || (() => {});
    this.toast = options.toast || ((message) => console.log(message));
    this.character = options.character || (() => ({ characterId: 'sera' }));
    this.apiBase = options.apiBase || '';
    this.run = null;
    this.runFrame = 0;
    this.lastRunAt = 0;
    this.running = false;
    this.keys = new Set();
    this.serverRun = null;
    this.finished = false;
    this.claimState = 'idle';
    this.hack = { core: false, active: false };
    this.stageArcId = 'arc6';
    this.stageSelected = 505; // First stage of Starfall Passage
    this.stageDifficulty = 'normal';
    this.stageClassId = this.character()?.characterId || 'sera';
    this.previewFrame = 0;
    this.previewGame = null;
    this.previewRenderer = null;
    this.previewCamera = 0;
    this.collisionFrame = 0;
    this.perfAt = 0;
    this.perfFps = 0;
    this.perfFrames = 0;
    this.player = { id: null, token: null };
    this._onKeyDown = (event) => this.onKeyDown(event);
    this._onKeyUp = (event) => this.onKeyUp(event);
    this._onResize = () => this.fitRunCanvas();
    this.bind();
    this.ensurePlayer().then(() => this.syncPlayer()).catch(() => {});
  }

  // ── progress + account ───────────────────────────────────────────────────
  p() {
    const progress = this.getProgress() || {};
    if (!progress.realms) progress.realms = defaultRealmsProgress();
    else progress.realms = sanitizeRealmsProgress(progress.realms);
    return progress;
  }

  realms() { return this.p().realms; }

  async request(path, options = {}) {
    const headers = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.player.token) headers.Authorization = `Bearer ${this.player.token}`;
    const response = await fetch(`${this.apiBase}${path}`, {
      ...options,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    let data = {};
    try { data = await response.json(); } catch { /* ignore */ }
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  async ensurePlayer() {
    if (this.player.token) return this.player;
    try {
      this.player.token = localStorage.getItem(PLAYER_TOKEN_KEY);
      this.player.id = localStorage.getItem(`${PLAYER_TOKEN_KEY}-id`);
      if (this.player.token) return this.player;
    } catch { /* storage blocked */ }
    try {
      const data = await this.request('/api/players/register', {
        method: 'POST',
        body: { name: this.options.playerName?.() || 'Penjaga', classId: this.character()?.characterId || 'sera' },
      });
      this.player.id = data.id;
      this.player.token = data.token;
      try {
        localStorage.setItem(PLAYER_TOKEN_KEY, data.token);
        localStorage.setItem(`${PLAYER_TOKEN_KEY}-id`, data.id);
      } catch { /* storage blocked */ }
    } catch { /* offline is a supported state */ }
    return this.player;
  }

  async syncPlayer() {
    if (!this.player.token) return;
    const progress = this.p();
    try {
      await this.request('/api/players/sync', {
        method: 'POST',
        body: {
          name: this.options.playerName?.() || 'Penjaga',
          classId: this.character()?.characterId || 'sera',
          progress: {
            version: progress.version,
            unlocked: progress.unlocked,
            cleared: progress.cleared,
            astral: progress.astral,
            realms: progress.realms,
            expansion: progress.expansion,
          },
        },
      });
    } catch { /* sync is best effort */ }
  }

  // ── shared UI ─────────────────────────────────────────────────────────────
  hideAll() {
    for (const id of ['realms-screen', 'realms-run-screen', 'stage-access-screen', 'astral-screen']) $(`#${id}`)?.classList.add('hidden');
    this.closeModal();
    this.hideHackTools();
    this.stopRun();
    this.closePreview();
    this.stopCollision();
    this.hackMode = false;
    this.hackCore = false;
  }

  showScreen(id) {
    for (const screen of ['realms-screen', 'realms-run-screen', 'stage-access-screen', 'astral-screen']) {
      $(`#${screen}`)?.classList.toggle('hidden', screen !== id);
    }
    if (id !== 'realms-run-screen') this.stopRun();
    if (id !== 'stage-access-screen') this.closePreview();
    document.querySelector('#game-frame')?.classList.toggle('hack-env', false);
  }

  header(eyebrow, title, sub, actions = '') {
    return `<header class="realms-head"><div><p class="eyebrow">${esc(eyebrow)}</p><h2 class="screen-title">${title}</h2><p class="screen-sub">${sub}</p></div><div class="realms-head-actions">${actions}</div></header>`;
  }

  bind() {
    $('#btn-realms-menu')?.addEventListener('click', () => this.showRealms());
    $('#btn-stage-menu')?.addEventListener('click', () => this.showStageAccess());
    $('#btn-astral-menu')?.addEventListener('click', () => this.showAstral());
    $('#btn-realms-back')?.addEventListener('click', () => this.back());
    $('#btn-stage-back')?.addEventListener('click', () => this.back());
    $('#btn-astral-back')?.addEventListener('click', () => this.back());
    $('#btn-realms-run-exit')?.addEventListener('click', () => this.leaveRun());
    $('#btn-realms-again')?.addEventListener('click', () => this.restartRun());
    $('#btn-realms-exit')?.addEventListener('click', () => this.leaveRun());
    $('#btn-stage-peek-close')?.addEventListener('click', () => this.closePreview());
    $('#btn-stage-peek-close-2')?.addEventListener('click', () => this.closePreview());
    $('#realms-body')?.addEventListener('click', (event) => this.onRealmsClick(event));
    $('#realms-run-screen')?.addEventListener('click', (event) => this.onRunClick(event));
    $('#stage-access-screen')?.addEventListener('click', (event) => this.onStageClick(event));
    $('#astral-body')?.addEventListener('click', (event) => this.onAstralClick(event));
    $('#hack-toolbar')?.addEventListener('click', (event) => this.onHackClick(event));
    window.addEventListener('resize', this._onResize);
  }

  back() {
    this.hideAll();
    this.options.onMenu?.();
  }

  // ── Infinite Realms hub ──────────────────────────────────────────────────
  showRealms() {
    this.networkMode = false;
    this.hideAll();
    this.showScreen('realms-screen');
    this.options.onOpenMenu?.('realms');
    this.buildRealms();
  }

  buildRealms() {
    const host = $('#realms-body');
    if (!host) return;
    const state = this.realms();
    const summary = realmsSummary(state);
    const best = (modeId) => state.modes[modeId] || {};
    host.innerHTML = `
      ${this.header('INFINITE REALMS · v0.17.0', 'ENAM DUNIA, ENAM ATURAN', 'Setiap mode punya loop, progres, dan hadiah eksklusif sendiri. Hadiah hanya masuk setelah server memvalidasi hasil run.', `<button class="btn btn-ghost btn-compact" type="button" data-realms-action="coop">MULTIPLAYER CO-OP</button>`)}
      <div class="realms-summary">
        <div><span>MODE DIMAINKAN</span><b>${summary.modesPlayed}/${summary.modesTotal}</b></div>
        <div><span>TOTAL RUN</span><b>${summary.totalRuns}</b></div>
        <div><span>KEMENANGAN</span><b>${summary.wins}</b></div>
        <div><span>HADIAH TERVERIFIKASI</span><b>${summary.rewards}/${summary.rewardsTotal}</b></div>
      </div>
      <div class="realms-mode-grid">
        ${list(REALM_MODES, (mode) => `
          <article class="realms-mode-card" style="--mode:${mode.color};--accent:${mode.accent}">
            <div class="realms-mode-glyph">${mode.glyph}</div>
            <span class="realms-mode-kicker">${esc(mode.subtitle)}</span>
            <h3>${esc(mode.name)}</h3>
            <p>${esc(mode.tagline)}</p>
            <div class="realms-mode-meta"><span>${best(mode.id).runs || 0} RUN</span><span>BEST ${best(mode.id).bestScore || 0}</span><span>${best(mode.id).wins || 0} WIN</span></div>
            <div class="realms-mode-actions"><button class="btn btn-primary btn-small" type="button" data-realms-mode="${mode.id}">MASUK</button><span class="tag ${state.rewards.includes(mode.rewardId) ? 'ok' : ''}">${state.rewards.includes(mode.rewardId) ? 'REWARD CLAIMED' : esc(mode.rewardName)}</span></div>
          </article>`)}
      </div>
      <div class="realms-lower">
        <div class="realms-panel">
          <h3>EXCLUSIVE REWARD TRACKS</h3>
          <div class="realms-rewards">${list(REALM_REWARDS, (reward) => {
            const claimed = state.rewards.includes(reward.id);
            return `<div class="realms-reward ${claimed ? 'claimed' : ''}"><span>${claimed ? '✓' : '◇'}</span><div><b>${esc(reward.name)}</b><small>${esc(REALM_MODE_BY_ID[reward.modeId].name)}</small></div><em>${claimed ? 'TERVERIFIKASI' : 'BELUM'}</em></div>`;
          })}</div>
        </div>
        <div class="realms-panel">
          <h3>SERVER-VALIDATED REWARDS</h3>
          <p>Run mendaftarkan seed dan identitas ke server. Setelah selesai, payload hasil dikirim untuk validasi: mode, skor minimum, wave/relik/kunci/anchor, durasi, dan satu-klaim-per-run. Jika server tidak dapat memverifikasi, progres run tetap dicatat tetapi hadiah eksklusif <b>tidak</b> diberikan.</p>
          <p class="micro">Untuk co-op, gunakan layar MULTIPLAYER yang sudah ada. Relay WebSocket zero-dependency berjalan di <span class="mono">/ws</span>; set <span class="mono">HOST=0.0.0.0</span> untuk LAN atau taruh di balik HTTPS untuk internet.</p>
        </div>
      </div>`;
  }

  detailMode(modeId) {
    const mode = REALM_MODE_BY_ID[modeId];
    if (!mode) return;
    const state = this.realms();
    const records = state.modes[modeId];
    this.openModal(`${mode.name} — ${mode.subtitle}`, `
      <p>${esc(mode.desc)}</p>
      <div class="realms-detail-grid">
        <div><span>LOOP</span><b>${esc(mode.loop)}</b></div>
        <div><span>OBJECTIVE</span><b>${esc(mode.objective)}</b></div>
        <div><span>REWARD</span><b>${esc(mode.rewardName)}</b></div>
        <div><span>BEST SCORE</span><b>${records.bestScore || 0}</b></div>
      </div>
      <div class="realms-difficulty">${list(REALM_DIFFICULTIES, (diff) => `<button type="button" class="realms-diff ${diff.id === this.runDifficulty ? 'active' : ''}" data-pick-diff="${diff.id}"><b>${esc(diff.name)}</b><span>HP ×${diff.hp} · reward ×${diff.reward}</span></button>`)}</div>
      <p class="micro">Kontrol: ${esc(mode.controls)}</p>
      <button class="btn btn-primary wide" type="button" data-begin-mode="${mode.id}">MULAI ${esc(mode.name.toUpperCase())}</button>`);
    $('#modal')?.classList.remove('hidden');
    this.runDifficulty = this.runDifficulty || 'normal';
    this.modalEvents();
    this.detailModeId = modeId;
  }

  modalEvents() {
    $('#modal-close')?.addEventListener('click', () => this.closeModal(), { once: true });
    $('#modal')?.addEventListener('click', (event) => { if (event.target.id === 'modal') this.closeModal(); }, { once: true });
    document.querySelectorAll('[data-pick-diff]').forEach((button) => button.addEventListener('click', () => {
      this.runDifficulty = button.dataset.pickDiff;
      document.querySelectorAll('[data-pick-diff]').forEach((entry) => entry.classList.toggle('active', entry === button));
    }));
    document.querySelector('[data-begin-mode]')?.addEventListener('click', () => {
      const id = document.querySelector('[data-begin-mode]').dataset.beginMode;
      this.closeModal();
      this.startModeRun(id, { difficulty: this.runDifficulty || 'normal' });
    });
  }

  openModal(title, body) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = body;
    $('#modal').classList.remove('hidden');
  }

  closeModal() { $('#modal')?.classList.add('hidden'); }

  onRealmsClick(event) {
    const mode = event.target.closest('[data-realms-mode]');
    if (mode) { this.detailMode(mode.dataset.realmsMode); return; }
    if (event.target.closest('[data-realms-action="coop"]')) this.options.onCoop?.();
  }

  // ── mode run ──────────────────────────────────────────────────────────────
  startModeRun(modeId, options = {}) {
    const mode = REALM_MODE_BY_ID[modeId];
    if (!mode) return;
    this.stopRun();
    this.finished = false;
    this.claimState = options.hack ? 'hack' : 'registering';
    this.serverRun = null;
    this.runDifficulty = options.difficulty || this.runDifficulty || 'normal';
    this.run = createRealmRun(modeId, {
      seed: options.seed || (Date.now() & 0x7fffffff),
      difficulty: this.runDifficulty,
      classId: options.classId || this.character()?.characterId || 'sera',
      party: Math.max(1, options.party || 1),
    });
    this.hackMode = !!options.hack;
    this.showScreen('realms-run-screen');
    this.options.onOpenMenu?.('realmsRun');
    this.fitRunCanvas();
    this.renderRunHud();
    this.lastRunAt = performance.now();
    this.running = true;
    this.runFrame = requestAnimationFrame((time) => this.loop(time));
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    if (this.hackMode) this.showHackTools();
    else this.registerRun();
  }

  async registerRun() {
    try {
      const data = await this.request('/api/realms/start', {
        method: 'POST',
        body: {
          modeId: this.run.modeId,
          seed: this.run.seed,
          difficulty: this.run.difficulty,
          classId: this.run.classId,
        },
      });
      this.serverRun = data.runId;
      this.claimState = 'registered';
    } catch {
      this.claimState = 'offline';
    }
    this.renderRunHud();
  }

  fitRunCanvas() {
    const canvas = $('#realms-canvas');
    if (!canvas) return;
    canvas.width = 960;
    canvas.height = 540;
  }

  loop(time) {
    if (!this.running || !this.run) return;
    const dt = clamp((time - this.lastRunAt) / 1000, 0, 0.08);
    this.lastRunAt = time;
    const input = {
      left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
      right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
      up: this.keys.has('KeyW') || this.keys.has('ArrowUp'),
      down: this.keys.has('KeyS') || this.keys.has('ArrowDown'),
      dash: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      jump: this.keys.has('Space'),
    };
    updateRealmRun(this.run, dt, input);
    const canvas = $('#realms-canvas');
    if (canvas) renderRealm(canvas.getContext('2d'), this.run, { width: 960, height: 540, time });
    this.renderRunHud();
    if (this.run.phase === 'ended' && !this.finished) this.finishRun();
    this.runFrame = requestAnimationFrame((next) => this.loop(next));
  }

  renderRunHud() {
    if (!this.run) return;
    const run = this.run;
    const hp = run.player?.hp ?? run.castle?.hp ?? 0;
    const maxHp = run.player?.maxHp ?? run.castle?.maxHp ?? 1;
    const objectives = (run.objectives?.length ? run.objectives : (this.run?.phase === 'ended' ? [] : []));
    const label = run.modeName.toUpperCase();
    const hud = $('#realms-run-hud');
    if (hud) {
      hud.innerHTML = `
        <div class="realms-run-title"><span>${esc(label)}</span><b>${esc(label)}</b><em>${esc(run.difficulty.toUpperCase())} · ${Math.round(run.time)}s</em></div>
        <div class="realms-run-bars">
          <div class="realms-hp"><span style="width:${pct(hp, maxHp)}"></span><b>${Math.round(hp)} / ${Math.round(maxHp)}</b></div>
          ${run.castle ? `<div class="realms-hp castle"><span style="width:${pct(run.castle.hp, run.castle.maxHp)}"></span><b>FORTRESS ${Math.round(run.castle.hp)}</b></div>` : ''}
        </div>
        <div class="realms-run-score"><span>SCORE</span><b>${run.score}</b><em>${this.claimState === 'verified' ? 'REWARD VERIFIED' : this.claimState === 'rejected' ? 'REWARD REJECTED' : this.claimState === 'hack' ? 'HACK · NO REWARDS' : 'SERVER CHECK'}</em></div>`;
    }
    const controls = $('#realms-controls');
    if (controls && !run.phase?.includes('ended')) controls.innerHTML = this.controlsFor(run);
    const meter = $('#realms-objectives');
    if (meter) {
      meter.innerHTML = list(run.objectives || [], (objective) => `<div class="${objective.done ? 'done' : ''}"><span>${esc(objective.label)}</span><b>${objective.value}/${objective.target}</b></div>`);
    }
    const end = $('#realms-end');
    if (end && run.phase === 'ended') {
      const win = run.result === 'victory';
      end.classList.remove('hidden');
      end.innerHTML = `<div class="realms-end-card">
        <p class="eyebrow">${win ? 'REALM CLEARED' : 'RUN ENDED'}</p>
        <h2>${win ? 'KEMENANGAN' : 'KEGAGALAN'}</h2>
        <div class="realms-end-stats"><div><span>SKOR</span><b>${run.score}</b></div><div><span>WAKTU</span><b>${run.time.toFixed(1)}s</b></div><div><span>MODE</span><b>${esc(run.modeName)}</b></div></div>
        <p class="realms-claim ${this.claimState === 'verified' ? 'ok' : this.claimState === 'rejected' ? 'bad' : ''}">${this.claimMessage()}</p>
        <div class="row"><button id="btn-realms-again" class="btn btn-primary" type="button">ULANGI</button><button id="btn-realms-exit" class="btn btn-ghost" type="button">KEMBALI</button></div>
      </div>`;
      $('#btn-realms-again')?.addEventListener('click', () => this.restartRun());
      $('#btn-realms-exit')?.addEventListener('click', () => this.leaveRun());
    } else if (end) end.classList.add('hidden');
    if (run.phase === 'upgrade' && controls) controls.innerHTML = this.upgradeChoices(run);
  }

  claimMessage() {
    if (this.claimState === 'verified') return 'Server memverifikasi hasil. Hadiah eksklusif ditambahkan ke progres.';
    if (this.claimState === 'rejected') return 'Server menolak klaim: threshold atau validitas run tidak terpenuhi. Tidak ada hadiah eksklusif.';
    if (this.claimState === 'offline') return 'Server tidak tersedia. Progres statistik dicatat lokal, tetapi hadiah eksklusif tidak diberikan.';
    if (this.claimState === 'hack') return 'Sesi HACK terisolasi — tidak ada hadiah, achievement, quest, atau progres kampanye yang berubah.';
    if (this.claimState === 'pending') return 'Menunggu validasi server…';
    return 'Hadiah eksklusif hanya diberikan setelah verifikasi server.';
  }

  controlsFor(run) {
    const base = `<button class="btn btn-ghost btn-small" type="button" data-run-action="exit">KELUAR RUN</button>`;
    if (run.modeId === 'relic_expedition') {
      return `<div class="realms-choice-grid">${list(run.choices || [], (choice, index) => `<button class="realms-choice" type="button" data-run-choose="${index}"><b>${choice.glyph} ${esc(choice.name)}</b><span>${esc(choice.desc)}</span></button>`)}</div><div class="row"><button class="btn btn-primary btn-small" type="button" data-run-action="extract">EKSTRAKSI SEKARANG</button>${base}</div>`;
    }
    if (run.modeId === 'last_bastion') {
      return `<div class="realms-bastion-controls"><div class="row">${[0, 1, 2].map((lane) => `<button class="btn btn-ghost btn-small ${run.lane === lane ? 'active' : ''}" type="button" data-run-lane="${lane}">LANE ${lane + 1}</button>`).join('')}</div><div class="row"><button class="btn btn-small" type="button" data-run-action="build" data-build="bulwark">BULWARK · 55</button><button class="btn btn-small" type="button" data-run-action="build" data-build="flame">FLAME · 80</button><button class="btn btn-small" type="button" data-run-action="build" data-build="frost">FROST · 70</button></div><div class="row"><button class="btn btn-small" type="button" data-run-action="upgrade">UPGRADE TOWER</button><button class="btn btn-small" type="button" data-run-action="deploy">DEPLOY HERO · 90</button><button class="btn btn-primary btn-small" type="button" data-run-action="ability">SIGNAL FLARE</button></div><p class="micro">Gold ${run.gold} · gelombang ${run.wave}/${run.waveTotal} · ${run.waveState}</p>${base}</div>`;
    }
    if (run.modeId === 'echo_maze') {
      return `<div class="realms-maze-controls"><div class="realms-dpad"><button data-run-move="0,-1">↑</button><button data-run-move="-1,0">←</button><button data-run-move="0,1">↓</button><button data-run-move="1,0">→</button></div><button class="btn btn-primary btn-small" type="button" data-run-action="interact">INTERAKSI · E</button><p class="micro">Kunci ${run.keys}/3 · langkah ${run.steps} · dinding bergeser tiap ${run.shiftAt} langkah</p>${base}</div>`;
    }
    if (run.modeId === 'shadow_duel') {
      return `<div class="realms-duel-controls"><div class="row"><button class="btn btn-primary btn-small" type="button" data-run-action="attack">1 · SERANG</button><button class="btn btn-small" type="button" data-run-action="heavy">2 · HEAVY</button><button class="btn btn-small" type="button" data-run-action="guard">3 · GUARD</button><button class="btn btn-small" type="button" data-run-action="counter">4 · COUNTER</button><button class="btn btn-small" type="button" data-run-action="feint">5 · FEINT</button></div><p class="micro">RONDE ${run.round}/${run.maxRounds} · STAMINA ${run.player.stamina} · TELEGRAPH ${run.telegraph.toUpperCase()}</p>${base}</div>`;
    }
    if (run.modeId === 'chrono_fracture') {
      return `<div class="realms-chrono-controls"><div class="row"><button class="btn btn-primary btn-small" type="button" data-run-action="activate">AKTIFKAN ANCHOR · E</button><button class="btn btn-small" type="button" data-run-action="pulse">PULSE · SPACE</button><button class="btn btn-small" type="button" data-run-action="reverse">BALIK WAKTU · R</button></div><p class="micro">${run.activated}/5 anchor · loop ${run.maxLoops - run.loops + 1}/${run.maxLoops} · ${run.timeLeft.toFixed(1)}s</p>${base}</div>`;
    }
    return `<div class="row"><button class="btn btn-ghost btn-small" type="button" data-run-action="exit">TINGGALKAN ARENA</button><span class="micro">A/D gerak · W/S naik-turun · SHIFT dash · serang otomatis</span></div>`;
  }

  upgradeChoices(run) {
    return `<div class="realms-upgrade"><p class="eyebrow">GELOMBANG ${run.wave} SELESAI</p><h3>PILIH UPGRADE SEMENTARA</h3><div class="realms-choice-grid">${list(run.upgradeChoices, (choice, index) => `<button class="realms-choice" type="button" data-run-upgrade="${index}"><b>${esc(choice.name)}</b><span>${esc(choice.desc)}</span></button>`)}</div><button class="btn btn-ghost btn-small" type="button" data-run-action="skip-upgrade">LEWATI</button></div>`;
  }

  onRunClick(event) {
    const exit = event.target.closest('[data-run-action="exit"]');
    if (exit) { this.leaveRun(); return; }
    const chooser = event.target.closest('[data-run-choose]');
    if (chooser) { realmAction(this.run, 'choose', { index: Number(chooser.dataset.runChoose) }); this.renderRunHud(); return; }
    const upgrade = event.target.closest('[data-run-upgrade]');
    if (upgrade) { realmAction(this.run, 'upgrade', { index: Number(upgrade.dataset.runUpgrade) }); this.renderRunHud(); return; }
    const lane = event.target.closest('[data-run-lane]');
    if (lane) { realmAction(this.run, 'lane', { lane: Number(lane.dataset.runLane) }); this.renderRunHud(); return; }
    const move = event.target.closest('[data-run-move]');
    if (move) { const [dx, dy] = move.dataset.runMove.split(',').map(Number); realmAction(this.run, 'move', { dx, dy }); this.renderRunHud(); return; }
    const action = event.target.closest('[data-run-action]');
    if (!action) return;
    const name = action.dataset.runAction;
    if (name === 'build') realmAction(this.run, 'build', { type: action.dataset.build, lane: this.run.lane });
    else if (name === 'skip-upgrade') realmAction(this.run, 'skip-upgrade');
    else realmAction(this.run, name);
    this.renderRunHud();
  }

  onKeyDown(event) {
    if (!this.run || this.run.phase === 'ended') return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    this.keys.add(event.code);
    if (this.run.modeId === 'echo_maze' && event.repeat === false) {
      const map = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
      if (map[event.code]) { realmAction(this.run, 'move', { dx: map[event.code][0], dy: map[event.code][1] }); this.renderRunHud(); }
      if (event.code === 'KeyE') { realmAction(this.run, 'interact'); this.renderRunHud(); }
    } else if (this.run.modeId === 'chrono_fracture') {
      if (event.code === 'KeyE' && !event.repeat) realmAction(this.run, 'activate');
      if (event.code === 'KeyR' && !event.repeat) realmAction(this.run, 'reverse');
    } else if (this.run.modeId === 'shadow_duel' && !event.repeat) {
      const action = { Digit1: 'attack', Digit2: 'heavy', Digit3: 'guard', Digit4: 'counter', Digit5: 'feint' }[event.code];
      if (action) { realmAction(this.run, action); this.renderRunHud(); }
    } else if (this.run.modeId === 'relic_expedition' && !event.repeat) {
      if (['Digit1', 'Digit2', 'Digit3'].includes(event.code)) { realmAction(this.run, 'choose', { index: Number(event.code.slice(-1)) - 1 }); this.renderRunHud(); }
      if (event.code === 'KeyX') { realmAction(this.run, 'extract'); this.renderRunHud(); }
    }
  }

  onKeyUp(event) { this.keys.delete(event.code); }

  stopRun() {
    this.running = false;
    if (this.runFrame) cancelAnimationFrame(this.runFrame);
    this.runFrame = 0;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  restartRun() {
    if (!this.run) return;
    const mode = this.run.modeId;
    const difficulty = this.run.difficulty;
    if (this.hackMode) this.startModeRun(mode, { difficulty, hack: true });
    else this.startModeRun(mode, { difficulty });
  }

  leaveRun() {
    const wasHack = this.hackMode;
    this.stopRun();
    this.run = null;
    this.hideAll();
    if (wasHack) { this.showStageAccess(); return; }
    this.showRealms();
  }

  async finishRun() {
    this.finished = true;
    const run = this.run;
    if (this.hackMode) { this.claimState = 'hack'; this.renderRunHud(); return; }
    this.claimState = 'pending';
    this.renderRunHud();
    let verified = false;
    let serverMessage = '';
    try {
      if (!this.serverRun && this.claimState !== 'offline') {
        // Wait briefly for the registration request if the player won very fast.
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      if (!this.serverRun) throw new Error('Server run belum terdaftar.');
      const payload = realmClaimPayload(run);
      const result = await this.request('/api/realms/claim', { method: 'POST', body: { ...payload, runId: this.serverRun } });
      verified = !!result.verified;
      serverMessage = result.reward?.name || '';
    } catch (error) {
      serverMessage = error.message;
    }
    const progress = this.p();
    const outcome = recordRealmRun(progress.realms, run, { verified });
    progress.realms = outcome.progress;
    this.save();
    if (verified) {
      this.claimState = 'verified';
      this.toast(`Reward terverifikasi: ${serverMessage || outcome.reward?.name || 'mode reward'}.`, 2600);
    } else {
      this.claimState = 'rejected';
      if (/offline|Failed|fetch|Server|HTTP/i.test(serverMessage) && !this.serverRun) this.claimState = 'offline';
    }
    this.renderRunHud();
    this.syncPlayer();
  }

  // ── Stage Access ──────────────────────────────────────────────────────────
  showStageAccess(arcId = this.stageArcId) {
    this.hideAll();
    this.stageArcId = arcId;
    this.showScreen('stage-access-screen');
    this.options.onOpenMenu?.('stage');
    this.buildStageAccess();
  }

  buildStageAccess() {
    const catalog = stageAccessCatalog();
    const stats = stageAccessStats(this.getProgress());
    const selected = stageInfo(this.stageSelected);
    const modes = REALM_MODES;
    $('#stage-left').innerHTML = `
      <h3>CAMPAIGN</h3>
      ${list(catalog.filter((arc) => arc.id.startsWith('arc')), (arc) => `<button type="button" class="stage-arc ${arc.id === this.stageArcId ? 'active' : ''}" data-stage-arc="${arc.id}"><span>${esc(arc.label)}</span><b>${esc(arc.name)}</b><em>${arc.stages.length} STAGE</em></button>`)}
      <h3>SIDE CONTENT</h3>
      ${list(catalog.filter((arc) => !arc.id.startsWith('arc')), (arc) => `<button type="button" class="stage-arc ${arc.id === this.stageArcId ? 'active' : ''}" data-stage-arc="${arc.id}"><span>${esc(arc.label)}</span><b>${esc(arc.name)}</b><em>${arc.stages.length} STAGE</em></button>`)}
      <h3>OTHER MODES</h3>
      <button type="button" class="stage-arc ${this.stageArcId === 'modes' ? 'active' : ''}" data-stage-arc="modes"><span>MODES</span><b>Infinite Realms</b><em>6 MODE</em></button>
      <div class="stage-statline"><span>${stats.totalRooms} ROOMS</span><span>${stats.campaignArcs} ARC</span><span>HACK ISOLATED</span></div>`;
    if (!selected) this.stageSelected = this.stageArcId === 'arc6' ? 505 : 0;
    const current = stageInfo(this.stageSelected) || stageInfo(this.stageArcId === 'modes' ? 'riftfall' : 0);
    $('#stage-center').innerHTML = this.stageArcId === 'modes'
      ? `<div class="stage-browser-head"><h3>INFINITE REALMS</h3><span>6 MODE</span></div><div class="stage-cards mode-cards">${list(modes, (mode) => `<button type="button" class="stage-card ${this.stageSelected === mode.id ? 'active' : ''}" data-stage-select="${mode.id}"><span class="stage-card-index">${mode.glyph}</span><b>${esc(mode.name)}</b><em>${esc(mode.subtitle)}</em><small>${esc(mode.objective)}</small></button>`)}</div>`
      : `<div class="stage-browser-head"><h3>${esc(current?.arcName || 'STAGE BROWSER')}</h3><span>${stageArcStages(this.stageArcId).length} STAGE</span></div><div class="stage-cards">${list(stageArcStages(this.stageArcId), (stage) => `<button type="button" class="stage-card ${this.stageSelected === stage.id ? 'active' : ''} ${stage.kind === 'boss' ? 'boss' : ''}" data-stage-select="${stage.id}"><span class="stage-card-index">${String(stage.id).padStart(3, '0')}</span><b>${esc(stage.name)}</b><em>${stage.kind === 'boss' ? 'BOSS ENCOUNTER' : 'STANDARD STAGE'}</em><small>${stage.enemyCount} enemies${stage.elite ? ' · ELITE' : ''}</small></button>`)}</div>`;
    $('#stage-right').innerHTML = this.stageDetails(current);
    this.bindStageDetails(current);
  }

  stageDetails(info) {
    if (!info) return '<p class="micro">Pilih stage.</p>';
    return `<div class="stage-detail">
      <p class="eyebrow">${esc(info.arcLabel)} · ${esc(info.arcName)}</p>
      <h2>${esc(info.name)}</h2>
      <p class="stage-sub">${esc(info.subtitle || '')}</p>
      <p>${esc(info.description)}</p>
      <div class="stage-facts">
        <div><span>TYPE</span><b>${info.kind === 'boss' ? 'BOSS' : info.kind === 'mode' ? 'MODE' : 'STANDARD'}</b></div>
        <div><span>ENEMIES</span><b>${info.enemyCount}</b></div>
        <div><span>ARCHETYPES</span><b>${info.archetypes}</b></div>
        <div><span>ELITE</span><b>${info.elite ? esc(info.elite.name) : '—'}</b></div>
        <div><span>RECOMMENDED</span><b>${esc(info.recommendedClass)} · ${esc(info.recommendedDifficulty)}</b></div>
      </div>
      ${info.boss ? `<div class="stage-boss"><span>BOSS</span><b>${esc(info.boss.name)}</b><em>${info.boss.phases} FASE · ${esc(info.boss.title)}</em><p>${esc(info.boss.desc)}</p></div>` : ''}
      <h3>ENEMY ROSTER</h3>
      <div class="stage-enemies">${list(info.enemies.slice(0, 8), (enemy) => `<span class="${enemy.elite ? 'elite' : ''}">${esc(enemy.name)}${enemy.elite ? ' · ELITE' : ''}</span>`)}${info.enemies.length > 8 ? `<span>+${info.enemies.length - 8} lainnya</span>` : ''}</div>
      <h3>REWARDS</h3>
      <div class="stage-rewards">${list(info.rewards, (reward) => `<span>${esc(reward)}</span>`)}</div>
      <h3>MODIFIERS</h3>
      <div class="stage-modifiers">${list(info.modifiers.length ? info.modifiers : ['Tidak ada modifier khusus.'], (modifier) => `<span>${esc(modifier)}</span>`)}</div>
      <div class="stage-controls"><label>DIFFICULTY<select id="stage-difficulty">${list(REALM_DIFFICULTIES, (diff) => `<option value="${diff.id}" ${diff.id === this.stageDifficulty ? 'selected' : ''}>${esc(diff.name)}</option>`)}</select></label><label>CLASS<select id="stage-class">${['sera','lyna','kael','karn','ignis','varek','neris','astra','bram','maera'].map((id) => `<option value="${id}" ${id === this.stageClassId ? 'selected' : ''}>${id.toUpperCase()}</option>`).join('')}</select></label></div>
      <div class="row"><button id="btn-stage-peek" class="btn btn-ghost" type="button">SNEAK PEEK</button><button id="btn-stage-hack" class="btn btn-primary" type="button">HACK STAGE</button></div>
      <p class="micro">HACK memuat stage dengan state terisolasi. Tidak ada quest, achievement, inventory, boss completion, checkpoint, atau reward normal yang berubah.</p>
    </div>`;
  }

  bindStageDetails(info) {
    $('#stage-difficulty')?.addEventListener('change', (event) => { this.stageDifficulty = event.target.value; });
    $('#stage-class')?.addEventListener('change', (event) => { this.stageClassId = event.target.value; });
    $('#btn-stage-peek')?.addEventListener('click', () => this.openPreview(info));
    $('#btn-stage-hack')?.addEventListener('click', () => this.startHack(info));
  }

  onStageClick(event) {
    const arc = event.target.closest('[data-stage-arc]');
    if (arc) {
      this.stageArcId = arc.dataset.stageArc;
      this.stageSelected = this.stageArcId === 'modes' ? 'riftfall' : (stageArcStages(this.stageArcId)[0]?.id ?? 0);
      this.buildStageAccess();
      return;
    }
    const select = event.target.closest('[data-stage-select]');
    if (select) {
      const raw = select.dataset.stageSelect;
      this.stageSelected = Number.isNaN(Number(raw)) ? raw : Number(raw);
      this.buildStageAccess();
    }
  }

  startHack(info) {
    if (!info) return;
    const config = hackSessionConfig(info.id, { difficulty: this.stageDifficulty, classId: this.stageClassId });
    if (!config) { this.toast('Stage tidak dikenal.', 1800); return; }
    if (info.kind === 'mode') {
      this.showScreen('realms-run-screen');
      this.startModeRun(info.id, { difficulty: this.stageDifficulty, classId: this.stageClassId, hack: true });
      return;
    }
    this.hideAll();
    this.hackCore = true;
    this.showHackTools();
    this.options.onHackStage?.(config);
  }

  finishHack() {
    this.hideHackTools();
    this.hackCore = false;
    this.stopCollision();
    this.options.onExitHack?.();
    this.showStageAccess();
  }

  // ── Sneak Peek ────────────────────────────────────────────────────────────
  openPreview(info) {
    if (!info) return;
    this.closePreview();
    const overlay = $('#stage-peek');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    $('#stage-peek-name').textContent = info.name;
    $('#stage-peek-sub').textContent = `${info.arcLabel} · ${info.arcName} · READ-ONLY`;
    const canvas = $('#stage-peek-canvas');
    canvas.width = 960; canvas.height = 400;
    this.previewCamera = 0;
    this.previewInfo = info;
    if (info.kind === 'mode') {
      this.previewRun = createRealmRun(info.id, { seed: 7, difficulty: 'normal' });
    } else {
      this.previewGame = new AshenGame();
      this.previewGame.enterRoom(info.id);
      if (this.previewGame.boss) {
        this.previewGame.boss.intro = 0;
        this.previewGame.boss.cooldown = 999;
        this.previewGame.boss.hp = this.previewGame.boss.maxHp;
        this.previewGame.boss.state = this.previewGame.boss.flying ? 'hover' : 'chase';
      }
      this.previewRenderer = new Renderer(canvas);
    }
    let last = performance.now();
    const loop = (time) => {
      if (overlay.classList.contains('hidden')) return;
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const ctx = canvas.getContext('2d');
      if (this.previewRun) {
        updateRealmRun(this.previewRun, dt * 0.35, { right: true });
        renderRealm(ctx, this.previewRun, { width: 960, height: 400, time });
      } else if (this.previewGame) {
        this.previewGame.time += dt * 0.2;
        if (this.previewGame.boss) this.previewGame.boss.intro = 0;
        const max = 1400 - 960;
        this.previewCamera = clamp(this.previewCamera + Math.sin(this.previewGame.time * 0.12) * 8 * dt, 0, max);
        this.previewRenderer.render(this.previewGame, { spectate: true, cameraX: this.previewCamera });
      }
      this.previewFrame = requestAnimationFrame(loop);
    };
    this.previewFrame = requestAnimationFrame(loop);
    $('#stage-peek-hint').textContent = info.kind === 'mode'
      ? info.description
      : `${info.hint || info.description} · ${info.enemyCount} musuh · ${info.elite ? `elite ${info.elite.name}` : 'tanpa elite'}${info.boss ? ` · boss ${info.boss.name}` : ''}`;
    $('#btn-stage-peek-hack')?.addEventListener('click', () => { this.closePreview(); this.startHack(info); }, { once: true });
  }

  closePreview() {
    if (this.previewFrame) cancelAnimationFrame(this.previewFrame);
    this.previewFrame = 0;
    this.previewGame = null;
    this.previewRenderer = null;
    this.previewRun = null;
    $('#stage-peek')?.classList.add('hidden');
  }

  // ── HACK testing toolbar ──────────────────────────────────────────────────
  showHackTools() {
    const bar = $('#hack-toolbar');
    if (!bar) return;
    bar.classList.remove('hidden');
    bar.innerHTML = `
      <span class="hack-label">HACK · ISOLATED</span>
      <button type="button" data-hack="restart">RESTART STAGE</button>
      <button type="button" data-hack="enemies">RESET ENEMIES</button>
      <button type="button" data-hack="phase">BOSS PHASE</button>
      <button type="button" data-hack="teleport">TELEPORT</button>
      <button type="button" data-hack="environment">ENVIRONMENT</button>
      <button type="button" data-hack="collision" class="${this.collisionOn ? 'active' : ''}">COLLISION VIEW</button>
      <button type="button" data-hack="performance">PERFORMANCE</button>
      <button type="button" data-hack="exit" class="danger">EXIT TEST</button>
      <span id="hack-perf" class="hack-perf hidden"></span>
      <canvas id="hack-collision" class="hack-collision hidden"></canvas>`;
  }

  hideHackTools() {
    $('#hack-toolbar')?.classList.add('hidden');
    this.stopCollision();
  }

  onHackClick(event) {
    const button = event.target.closest('[data-hack]');
    if (!button) return;
    const action = button.dataset.hack;
    if (action === 'exit') {
      if (this.hackMode) { this.hackMode = false; this.stopRun(); this.run = null; this.showStageAccess(); }
      else this.finishHack();
      return;
    }
    if (action === 'performance') {
      this.perfOn = !this.perfOn;
      $('#hack-perf')?.classList.toggle('hidden', !this.perfOn);
      if (this.perfOn) this.perfLoop();
      return;
    }
    if (action === 'collision') {
      this.collisionOn = !this.collisionOn;
      button.classList.toggle('active', this.collisionOn);
      this.collisionOn ? this.startCollision() : this.stopCollision();
      return;
    }
    if (action === 'environment') {
      this.hackEnv = ((this.hackEnv || 0) + 1) % 4;
      const frame = $('#game-frame');
      frame?.classList.remove('hack-env-rain', 'hack-env-frost', 'hack-env-void');
      if (this.hackEnv === 1) frame?.classList.add('hack-env-rain');
      if (this.hackEnv === 2) frame?.classList.add('hack-env-frost');
      if (this.hackEnv === 3) frame?.classList.add('hack-env-void');
      $('#hack-toolbar')?.classList.toggle('hack-env-note', this.hackEnv > 0);
      this.toast(['Environment: ash', 'Environment: rift rain', 'Environment: frost', 'Environment: void'][this.hackEnv], 1200);
      return;
    }
    this.options.onHackTool?.(action);
  }

  perfLoop() {
    if (!this.perfOn) return;
    const now = performance.now();
    this.perfFrames += 1;
    if (!this.perfAt) this.perfAt = now;
    if (now - this.perfAt >= 500) {
      this.perfFps = Math.round((this.perfFrames * 1000) / (now - this.perfAt));
      this.perfFrames = 0;
      this.perfAt = now;
      const node = $('#hack-perf');
      if (node) node.textContent = `${this.perfFps} FPS · ${(performance.memory?.usedJSHeapSize / 1048576 || 0).toFixed(0)} MB`;
    }
    requestAnimationFrame(() => this.perfLoop());
  }

  startCollision() {
    const canvas = $('#hack-collision');
    if (!canvas) return;
    canvas.classList.remove('hidden');
    const draw = () => {
      if (!this.collisionOn) return;
      const game = this.options.getGame?.();
      const main = $('#game');
      if (!game || !main) { this.collisionFrame = requestAnimationFrame(draw); return; }
      canvas.width = main.clientWidth;
      canvas.height = main.clientHeight;
      const sx = canvas.width / 960;
      const sy = canvas.height / 540;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const camera = this.options.getCameraX?.() || 0;
      const box = (x, y, w, h, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect((x - camera) * sx, y * sy, w * sx, h * sy);
      };
      for (const platform of game.room?.platforms || []) box(platform.x, platform.y, platform.w, platform.h, '#e8c46a');
      for (const enemy of game.enemies || []) box(enemy.x, enemy.y, enemy.w, enemy.h, '#e88a7a');
      if (game.boss) box(game.boss.x, game.boss.y, game.boss.w, game.boss.h, '#ff6a6a');
      box(game.player.x, game.player.y, game.player.w, game.player.h, '#8ee8c0');
      this.collisionFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  stopCollision() {
    this.collisionOn = false;
    if (this.collisionFrame) cancelAnimationFrame(this.collisionFrame);
    this.collisionFrame = 0;
    $('#hack-collision')?.classList.add('hidden');
  }

  // ── Astral Dominion ───────────────────────────────────────────────────────
  showAstral() {
    this.hideAll();
    this.showScreen('astral-screen');
    this.options.onOpenMenu?.('astral');
    this.buildAstral();
  }

  buildAstral() {
    const progress = this.p();
    const state = progress.astral || {};
    const summary = astralSummary(state);
    $('#astral-body').innerHTML = `
      ${this.header(`ARC VI · ${ASTRAL_NAME.toUpperCase()}`, 'THE ASTRAL DOMINION', `${esc(ASTRAL_PITCH)} Di balik lima wilayah, <b>The Unwritten Expanse</b> tetap terkunci.`, `<button class="btn btn-ghost btn-compact" type="button" data-astral-action="stage">STAGE ACCESS</button>`)}
      <div class="realms-summary">        <div><span>RUANG</span><b>${summary.roomsCleared ?? 0}/20</b></div><div><span>BOSS</span><b>${summary.bossesCleared ?? 0}/5</b></div><div><span>REGION</span><b>${summary.regionsCleared ?? 0}/5</b></div><div><span>JALAN</span><b>${summary.progress ?? 0}%</b></div></div>
      <div class="astral-regions">${list(ASTRAL_REGIONS, (region) => {
        const rooms = [0, 1, 2, 3].map((slot) => ASTRAL_ROOM_BY_ID[region.roomStart + slot]).filter(Boolean);
        const boss = ASTRAL_BOSS_BY_ID[region.boss];
        const unlocked = rooms.some((room) => astralRoomUnlocked(state, room.id));
        return `<section class="astral-region ${unlocked ? '' : 'locked'}" style="--region:${region.color}">
          <header><span>${region.glyph}</span><div><p class="eyebrow">REGION ${region.index + 1}</p><h3>${esc(region.localName)}</h3><em>${esc(region.name)} · ${esc(region.subtitle)}</em></div><strong>${rooms.filter((room) => state.cleared?.[room.id - 505]).length}/4</strong></header>
          <p>${esc(region.gimmick)}</p>
          <div class="astral-boss"><span>BOSS</span><b>${esc(boss.name)}</b><em>${boss.maxPhases} FASE · ${esc(boss.title)}</em></div>
          <div class="astral-rooms">${rooms.map((room) => `<button type="button" class="astral-room ${room.astralBoss ? 'boss' : ''}" data-astral-room="${room.id}"><span>${String(room.id).padStart(3, '0')}</span><b>${esc(room.name)}</b><em>${room.astralBoss ? 'BOSS' : 'STAGE'} · 20 ENEMIES</em></button>`).join('')}</div>
          <div class="row"><button class="btn btn-ghost btn-small" type="button" data-astral-peek="${region.roomStart}">SNEAK PEEK</button><button class="btn btn-primary btn-small" type="button" data-astral-play="${region.roomStart}" ${unlocked ? '' : 'disabled'}>MASUK REGION</button></div>
        </section>`;
      })}</div>
      <div class="astral-locked"><span>◈</span><div><p class="eyebrow">NEXT MYSTERY</p><h3>THE UNWRITTEN EXPANSE</h3><p>Wilayah ini belum tertulis. Selesaikan The Architect of Eternity untuk melihat retakan pertama.</p></div><span class="tag">LOCKED</span></div>`;
  }

  onAstralClick(event) {
    if (event.target.closest('[data-astral-action="stage"]')) { this.showStageAccess('arc6'); return; }
    const peek = event.target.closest('[data-astral-peek]');
    if (peek) {
      this.showStageAccess('arc6');
      this.stageSelected = Number(peek.dataset.astralPeek);
      this.buildStageAccess();
      const info = stageInfo(this.stageSelected);
      if (info) this.openPreview(info);
      return;
    }
    const play = event.target.closest('[data-astral-play]');
    if (play && !play.disabled) {
      const roomId = Number(play.dataset.astralPlay);
      this.options.onPlayAstral?.(roomId);
    }
  }
}

function stageArcStages(arcId) {
  const catalog = stageAccessCatalog();
  return catalog.find((entry) => entry.id === arcId)?.stages || [];
}
