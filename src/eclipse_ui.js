// Ashen Vow — Eclipse of the Forgotten Gods UI
// Campaign hub, Godfall Ascension, guilds/raids, Awakening, Combat Codex,
// graphics settings and the Project Clean Realm release board.
import {
  ECLIPSE_NAME, ECLIPSE_LOCAL_NAME, ECLIPSE_PITCH, ECLIPSE_BIOMES, ECLIPSE_BOSSES,
  ECLIPSE_BOSS_BY_ID, ECLIPSE_SECRET_BOSS, ECLIPSE_FRAGMENTS,
  ECLIPSE_ENEMY_INFO, ECLIPSE_ROOMS, ECLIPSE_ROOM_BY_ID, ECLIPSE_STANDARD_LEVEL_COUNT,
  ECLIPSE_LEVELS_PER_BIOME, ECLIPSE_SECRET_ROOM_ID,
  eclipseSummary, eclipseRoomUnlocked, unlockEclipse, sanitizeEclipseProgress,
  defaultEclipseProgress, recordEclipseRoom, recordEclipseBoss,
  GODFALL_REWARDS, GODFALL_BOSSES, GODFALL_MODIFIERS, GODFALL_FLOOR_COUNT,
  godfallSummary, godfallFloorInfo, sanitizeGodfallProgress, defaultGodfallProgress,
  GUILD_RANKS, GUILD_WEEKLY, RAID_ENCOUNTERS, RAID_BY_ID,
  createGuild, joinGuild, setGuildRank, guildChat, guildLeaderboard,
  sanitizeGuildState, defaultGuildState, guildSummary,
  ECLIPSE_CLASSES, AWAKENING_PASSIVES, awakeningFor, awakeningBonus,
  canAwaken, awakenClass, sanitizeAwakeningProgress, defaultAwakeningProgress, setAwakeningPassive,
  ECLIPSE_WEAPONS, ELEMENTAL_REACTIONS, calculateDamage, WEAPON_MASTERY_XP, BOSS_WEAKNESSES,
  GRAPHICS_PRESETS, GRAPHICS_OPTIONS, suggestGraphics, PerformanceSampler,
} from './eclipse.js';
import { releaseChecklist, BUG_REGISTRY, validateEclipseContent, validateBossPhases } from './qa.js';

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pct = (value, total) => `${Math.max(0, Math.min(100, total ? (value / total) * 100 : 0))}%`;
const list = (items, render) => items.map(render).join('');

function bar(value, total, label = '') {
  return `<div class="eclipse-meter"><span style="width:${pct(value, total)}"></span><em>${esc(label || `${value}/${total}`)}</em></div>`;
}

function stat(label, value) {
  return `<div class="eclipse-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

export class EclipseUI {
  constructor(options = {}) {
    this.options = options;
    this.getProgress = options.getProgress || (() => ({}));
    this.save = options.saveProgress || (() => {});
    this.toast = options.toast || ((message) => console.log(message));
    this.settings = options.getSettings || (() => ({}));
    this.tab = 'campaign';
    this.selectedBiome = 0;
    this.selectedFloor = 1;
    this.raids = {};
    this.practice = false;
    this.perf = new PerformanceSampler({ capacity: 180 });
    this.lastPerfAt = 0;
    this._onKeyDown = (event) => {
      if (event.key === 'Escape' && !$('#eclipse-screen')?.classList.contains('hidden')) {
        event.preventDefault();
        options.onMenu?.();
      }
    };
    this.bind();
  }

  bind() {
    $('#btn-eclipse-menu')?.addEventListener('click', () => this.show());
    $('#eclipse-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-eclipse-tab]');
      if (button) this.show(button.dataset.eclipseTab);
    });
    $('#eclipse-body')?.addEventListener('click', (event) => this.onAction(event));
    $('#eclipse-body')?.addEventListener('change', (event) => this.onChange(event));
    $('#eclipse-body')?.addEventListener('submit', (event) => {
      if (!event.target.closest('[data-action="guild-chat-form"]')) return;
      event.preventDefault();
      this.chatGuild($('#guild-chat-input')?.value);
    });
    $('#eclipse-back')?.addEventListener('click', () => this.options.onMenu?.());
    $('#eclipse-screen')?.addEventListener('click', (event) => {
      if (event.target.id === 'eclipse-screen') this.options.onMenu?.();
    });
    document.addEventListener('keydown', this._onKeyDown);
  }

  hideAll() {
    $('#eclipse-screen')?.classList.add('hidden');
  }

  p() {
    const progress = this.getProgress() || {};
    progress.eclipse = sanitizeEclipseProgress(progress.eclipse);
    progress.godfall = sanitizeGodfallProgress(progress.godfall);
    progress.guild = sanitizeGuildState(progress.guild);
    progress.awakening = sanitizeAwakeningProgress(progress.awakening, this.classIds());
    return progress;
  }

  classIds() {
    return this.options.classIds?.() || Object.keys(ECLIPSE_CLASSES);
  }

  show(tab = this.tab) {
    this.tab = ['campaign', 'godfall', 'guilds', 'awakening', 'combat', 'settings', 'qa'].includes(tab) ? tab : 'campaign';
    const progress = this.p();
    progress.eclipse = unlockEclipse(progress.eclipse);
    this.save(progress);
    $('#eclipse-screen')?.classList.remove('hidden');
    this.render();
    this.options.onOpen?.();
  }

  render() {
    const screen = $('#eclipse-screen');
    if (!screen) return;
    const p = this.p();
    const summary = eclipseSummary(p.eclipse);
    $('#eclipse-fragments') && ($('#eclipse-fragments').innerHTML = `
      <span class="eclipse-fragments-label">PECAHAN ${summary.fragments}/6</span>
      <div class="eclipse-fragment-dots">${list(ECLIPSE_FRAGMENTS, (fragment) => `<i class="${summary.fragments >= Number(fragment.id.split('_')[1]) ? 'lit' : ''}" title="${esc(fragment.name)}"></i>`)}</div>
    `);
    for (const button of document.querySelectorAll('[data-eclipse-tab]')) {
      button.classList.toggle('active', button.dataset.eclipseTab === this.tab);
    }
    const body = $('#eclipse-body');
    if (!body) return;
    if (this.tab === 'campaign') body.innerHTML = this.campaignHtml(p);
    else if (this.tab === 'godfall') body.innerHTML = this.godfallHtml(p);
    else if (this.tab === 'guilds') body.innerHTML = this.guildsHtml(p);
    else if (this.tab === 'awakening') body.innerHTML = this.awakeningHtml(p);
    else if (this.tab === 'combat') body.innerHTML = this.combatHtml();
    else if (this.tab === 'settings') body.innerHTML = this.settingsHtml();
    else body.innerHTML = this.qaHtml();
  }

  // ── campaign ─────────────────────────────────────────────────────────────
  campaignHtml(progress) {
    const state = progress.eclipse;
    const summary = eclipseSummary(state);
    const secret = ECLIPSE_SECRET_BOSS;
    return `
      <div class="eclipse-hero">
        <div>
          <span class="eclipse-kicker">ARC VIII · MAIN CAMPAIGN</span>
          <h3>${esc(ECLIPSE_LOCAL_NAME)}</h3>
          <p>${esc(ECLIPSE_PITCH)}</p>
        </div>
        <div class="eclipse-hero-stats">
          ${stat('STAGE', `${summary.roomsCleared}/30`)}
          ${stat('BOSS', `${summary.bossesCleared}/7`)}
          ${stat('PECAHAN', `${summary.fragments}/6`)}
          ${stat('TITLE', state.title ? 'GODLESS' : '—')}
        </div>
      </div>
      <div class="eclipse-progress-bar">${bar(summary.roomsCleared, 30, `${summary.progress}% FORGOTTEN PANTHEON`)}</div>
      <div class="eclipse-biome-grid">
        ${list(ECLIPSE_BIOMES, (biome) => this.biomeHtml(biome, state))}
      </div>
      <section class="eclipse-secret ${summary.secretUnlocked ? 'unlocked' : ''}">
        <div class="eclipse-secret-mark">✒</div>
        <div>
          <span class="eclipse-kicker">SECRET ENDGAME</span>
          <h4>${esc(secret.localName)}</h4>
          <p>${summary.secretUnlocked ? 'Enam pecahan telah dibaca. Halaman terakhir terbuka.' : 'Kumpulkan enam pecahan dari enam penjaga untuk membuka The First Author.'}</p>
        </div>
        <div class="eclipse-secret-actions">
          ${summary.secretUnlocked
            ? `<button class="btn btn-primary btn-sm" data-action="play-eclipse" data-room="${ECLIPSE_SECRET_ROOM_ID}">HADAPI PENULIS</button>`
            : `<span class="eclipse-lock">${summary.fragments}/6 PECAHAN</span>`}
        </div>
      </section>
    `;
  }

  biomeHtml(biome, state) {
    const boss = ECLIPSE_BOSS_BY_ID[biome.boss.id];
    const levels = ECLIPSE_ROOMS.filter((room) => room.eclipseStandard && room.eclipseBiomeId === biome.id);
    const cleared = levels.filter((room) => state.rooms[(room.eclipseBiome - 1) * ECLIPSE_LEVELS_PER_BIOME + room.eclipseSlot]).length;
    const bossCleared = !!state.bosses[boss.id];
    return `
      <article class="eclipse-biome-card" style="--accent:${biome.color}">
        <header>
          <span class="eclipse-biome-glyph">${biome.glyph}</span>
          <div><h4>${esc(biome.localName)}</h4><em>${esc(biome.name)}</em></div>
          <span class="eclipse-biome-count">${cleared}/5</span>
        </header>
        <p>${esc(biome.gimmick)}</p>
        <div class="eclipse-level-list">
          ${list(levels, (room) => {
            const unlocked = eclipseRoomUnlocked(state, room.id);
            return `<button class="eclipse-level ${unlocked ? '' : 'locked'}" ${unlocked ? `data-action="play-eclipse" data-room="${room.id}"` : 'disabled'}>
              <span>${room.eclipseSlot + 1}</span><strong>${esc((room.name.split(' — ')[0]))}</strong><em>${unlocked ? 'MAINKAN' : 'TERKUNCI'}</em>
            </button>`;
          })}
          <button class="eclipse-level boss ${eclipseRoomUnlocked(state, biome.bossRoom) ? '' : 'locked'}" ${eclipseRoomUnlocked(state, biome.bossRoom) ? `data-action="play-eclipse" data-room="${biome.bossRoom}"` : 'disabled'}>
            <span>☠</span><strong>${esc(boss.localName)}</strong><em>${bossCleared ? 'TERKALAHKAN' : 'BOSS'}</em>
          </button>
        </div>
        <footer><span>${esc(biome.levels[0])} → ${esc(biome.levels[4])}</span><span>${bossCleared ? 'PECAHAN DITEMUKAN' : 'PECAHAN TERSEGEL'}</span></footer>
      </article>
    `;
  }

  // ── godfall ─────────────────────────────────────────────────────────────
  godfallHtml(progress) {
    const summary = godfallSummary(progress.godfall);
    const floor = godfallFloorInfo(this.selectedFloor);
    return `
      <div class="eclipse-hero">
        <div>
          <span class="eclipse-kicker">ENDGAME · 100 FLOORS</span>
          <h3>GODFALL ASCENSION</h3>
          <p>Naik melalui seratus lantai. Setiap lima lantai menambah tekanan; setiap sepuluh lantai menjaga gerbang.</p>
        </div>
        <div class="eclipse-hero-stats">
          ${stat('CLEARED', `${summary.clearedCount}/100`)}
          ${stat('BEST FLOOR', summary.bestFloor)}
          ${stat('CHECKPOINT', summary.checkpoint || '—')}
          ${stat('MILESTONES', `${summary.rewards.length}/6`)}
        </div>
      </div>
      <div class="eclipse-godfall-layout">
        <section class="eclipse-floor-browser">
          <div class="eclipse-section-head"><h4>FLOOR SELECT</h4><span>${summary.progress}% ASCENDED</span></div>
          <div class="eclipse-floor-grid">
            ${list(Array.from({ length: GODFALL_FLOOR_COUNT }, (_, i) => i + 1), (n) => {
              const cleared = summary.cleared[n - 1];
              const unlocked = n === 1 || summary.cleared[n - 2] || cleared;
              return `<button class="eclipse-floor ${cleared ? 'cleared' : ''} ${n % 10 === 0 ? 'boss' : ''} ${n === this.selectedFloor ? 'selected' : ''}" data-action="select-floor" data-floor="${n}" ${unlocked ? '' : 'disabled'}>
                <span>${n}</span><em>${n % 10 === 0 ? 'BOSS' : n % 5 === 0 ? 'ELITE' : cleared ? 'CLEAR' : 'FLOOR'}</em>
              </button>`;
            })}
          </div>
        </section>
        <aside class="eclipse-floor-detail">
          <span class="eclipse-kicker">FLOOR ${floor.floor}</span>
          <h4>${esc(floor.type.toUpperCase())}</h4>
          <p>${esc(floor.modifier.desc)}</p>
          <div class="eclipse-detail-rows">
            <span>Musuh <strong>${floor.enemies}</strong></span>
            <span>Boss <strong>${floor.boss ? esc(floor.boss.name) : '—'}</strong></span>
            <span>Checkpoint <strong>${floor.checkpoint ? 'ADA' : 'TIDAK'}</strong></span>
            <span>Reward <strong>${floor.reward ? esc(floor.reward.name) : '—'}</strong></span>
          </div>
          <label class="eclipse-check"><input id="godfall-practice" type="checkbox" ${this.practice ? 'checked' : ''} /> Practice mode (tanpa reward)</label>
          <button class="btn btn-primary" data-action="play-godfall" data-floor="${floor.floor}" ${floor.floor === 1 || summary.cleared[floor.floor - 2] || summary.cleared[floor.floor - 1] ? '' : 'disabled'}>MULAI LANTAI ${floor.floor}</button>
          <div class="eclipse-milestones">
            ${list(GODFALL_REWARDS, (reward) => `<div class="${summary.rewards.includes(reward.id) ? 'earned' : ''}"><span>${reward.floor}</span><em>${esc(reward.name)}</em></div>`)}
          </div>
        </aside>
      </div>
    `;
  }

  // ── guilds ──────────────────────────────────────────────────────────────
  guildsHtml(progress) {
    const state = sanitizeGuildState(progress.guild);
    const summary = guildSummary(state);
    if (!state.guild) {
      return `
        <div class="eclipse-hero"><div><span class="eclipse-kicker">MULTIPLAYER · GUILDS & RAIDS</span><h3>GUILD OF THE FORGOTTEN</h3><p>Berdiri bersama melewati gerhana. Guild membuka chat, weekly challenges, leaderboard, dan raid kooperatif.</p></div></div>
        <div class="eclipse-guild-onboard">
          <section><h4>DIRIKAN GUILD</h4><input id="guild-name" maxlength="32" placeholder="Nama guild" /><input id="guild-emblem" maxlength="8" placeholder="⚔" value="⚔" /><button class="btn btn-primary" data-action="create-guild">DIRIKAN</button></section>
          <section><h4>GABUNG GUILD</h4><p>Guild contoh: Forgotten Pantheon.</p><button class="btn btn-ghost" data-action="join-guild">GABUNG FORGOTTEN PANTHEON</button></section>
        </div>
      `;
    }
    const guild = state.guild;
    return `
      <div class="eclipse-hero">
        <div><span class="eclipse-kicker">GUILD HALL</span><h3>${guild.emblem} ${esc(guild.name)}</h3><p>${esc(guild.description || 'Tidak ada deskripsi.')}</p></div>
        <div class="eclipse-hero-stats">${stat('LEVEL', guild.level)}${stat('MEMBER', guild.members.length)}${stat('XP', guild.xp)}${stat('RANK', GUILD_RANKS.find((r) => r.id === guild.rank)?.name || guild.rank)}</div>
      </div>
      <div class="eclipse-guild-grid">
        <section class="eclipse-panel">
          <div class="eclipse-section-head"><h4>MEMBER & RANK</h4><span>${guild.members.length}/50</span></div>
          ${list(guild.members, (member) => `<div class="eclipse-member"><span>${esc(member.name)}</span><select data-action="guild-rank" data-member="${esc(member.id)}">${list(GUILD_RANKS, (rank) => `<option value="${rank.id}" ${rank.id === member.rank ? 'selected' : ''}>${esc(rank.name)}</option>`)}</select></div>`)}
          <div class="eclipse-weekly">${list(summary.weekly, (entry) => `<div><span>${esc(entry.name)}</span>${bar(entry.value, entry.target, `${entry.value}/${entry.target}`)}</div>`)}</div>
        </section>
        <section class="eclipse-panel">
          <div class="eclipse-section-head"><h4>GUILD CHAT</h4><span>${summary.activity.length} pesan</span></div>
          <div class="eclipse-chat">${summary.activity.length ? list(summary.activity.slice(-10), (entry) => `<p><strong>${esc(entry.name || 'GUILD')}</strong> ${esc(entry.text || entry.type)}</p>`) : '<p class="muted">Belum ada aktivitas.</p>'}</div>
          <form class="eclipse-chat-form" data-action="guild-chat-form"><input id="guild-chat-input" maxlength="240" placeholder="Tulis pesan guild..." /><button class="btn btn-sm" type="submit">KIRIM</button></form>
        </section>
      </div>
      <section class="eclipse-panel raids">
        <div class="eclipse-section-head"><h4>COOPERATIVE RAIDS</h4><span>4 pemain · solo practice tersedia</span></div>
        <div class="eclipse-raid-grid">${list(RAID_ENCOUNTERS, (raid) => {
          const record = state.raids[raid.id] || { clears: 0, practiceClears: 0, bestPhase: 0 };
          return `<article class="eclipse-raid" style="--accent:#e2bd75"><span class="eclipse-kicker">${raid.phases} PHASES</span><h4>${esc(raid.name)}</h4><p>${esc(raid.desc)}</p><em>${record.clears} clears · best phase ${record.bestPhase || '—'}</em><div><button class="btn btn-sm btn-primary" data-action="start-raid" data-raid="${raid.id}" data-practice="0">RAID</button><button class="btn btn-sm btn-ghost" data-action="start-raid" data-raid="${raid.id}" data-practice="1">PRACTICE</button></div></article>`;
        })}</div>
      </section>
    `;
  }

  // ── awakening ───────────────────────────────────────────────────────────
  awakeningHtml(progress) {
    const state = sanitizeAwakeningProgress(progress.awakening, this.classIds());
    const classes = this.classIds().map((id) => {
      const meta = this.options.classMeta?.(id) || ECLIPSE_CLASSES[id] || { name: id, glyph: '✦', title: 'Forgotten class' };
      const awakening = awakeningFor(id);
      const mastery = state.mastery[id] || 0;
      const awakened = !!state.awakened[id];
      const eligible = canAwaken(state, id);
      const bonus = awakeningBonus(state, id);
      return `<article class="eclipse-awaken-card ${awakened ? 'awakened' : ''}">
        <header><span>${meta.glyph || '✦'}</span><div><h4>${esc(meta.name)}</h4><em>${esc(meta.title || '')}</em></div></header>
        <div class="eclipse-awaken-title">${esc(awakening.name)}</div>
        <p>${esc(awakening.quest)}</p>
        ${bar(mastery, 100, `${mastery}/100 MASTERY`)}
        ${awakened
          ? `<div class="eclipse-passive"><strong>${esc(bonus.passive?.name || 'Awakened')}</strong><span>${esc(bonus.passive?.desc || 'Passive active.')}</span></div><div class="eclipse-passive-actions">${list(AWAKENING_PASSIVES, (passive) => `<button class="eclipse-chip ${state.activePassive[id] === passive.id ? 'active' : ''}" data-action="set-passive" data-class="${id}" data-passive="${passive.id}">${esc(passive.name)}</button>`)}</div>`
          : `<button class="btn btn-sm ${eligible ? 'btn-primary' : ''}" data-action="awaken" data-class="${id}" ${eligible ? '' : 'disabled'}>${eligible ? 'BANGKITKAN' : 'BUTUH 100 MASTERY'}</button>`}
      </article>`;
    }).join('');
    return `
      <div class="eclipse-hero"><div><span class="eclipse-kicker">PROGRESSION · CHARACTER AWAKENING</span><h3>THE SECOND VOW</h3><p>Mastery membuka wujud alternatif, efek skill baru, satu ability unik, dan pilihan passive. Kelas asli tetap sepenuhnya dapat dimainkan.</p></div></div>
      <div class="eclipse-awaken-grid">${classes}</div>
      <section class="eclipse-panel"><div class="eclipse-section-head"><h4>PASSIVE ARCHIVE</h4><span>6 pilihan</span></div><div class="eclipse-passive-archive">${list(AWAKENING_PASSIVES, (passive) => `<div><strong>${esc(passive.name)}</strong><span>${esc(passive.desc)}</span></div>`)}</div></section>
    `;
  }

  // ── combat codex ────────────────────────────────────────────────────────
  combatHtml() {
    return `
      <div class="eclipse-hero"><div><span class="eclipse-kicker">COMBAT EVOLUTION 2.0</span><h3>ONE DAMAGE PIPELINE. EVERY HIT ACCOUNTED FOR.</h3><p>Damage source, target validity, invulnerability, dodge, resistance, criticals, status and elemental modifiers resolve in one deterministic function.</p></div><div class="eclipse-hero-stats">${stat('PERFECT DODGE', '≤160 ms')}${stat('COUNTER', '1.2 s')}${stat('BREAK', '100')}${stat('REACTIONS', ELEMENTAL_REACTIONS.length)}</div></div>
      <div class="eclipse-combat-grid">
        <section class="eclipse-panel"><div class="eclipse-section-head"><h4>ELEMENTAL REACTIONS</h4><span>controlled VFX</span></div>${list(ELEMENTAL_REACTIONS, (reaction) => `<div class="eclipse-reaction"><span>${reaction.a.toUpperCase()} + ${reaction.b.toUpperCase()}</span><strong>${esc(reaction.name)}</strong><em>${esc(reaction.desc)}</em></div>`)}</section>
        <section class="eclipse-panel"><div class="eclipse-section-head"><h4>SEVEN NEW WEAPONS</h4><span>mastery 1–5</span></div><div class="eclipse-weapon-grid">${list(ECLIPSE_WEAPONS, (weapon) => `<div class="eclipse-weapon"><span>${weapon.glyph}</span><strong>${esc(weapon.name)}</strong><em>${esc(weapon.style)} · ${esc(weapon.desc)}</em><div class="eclipse-mastery">${list(WEAPON_MASTERY_XP.slice(1), (xp, i) => `<i title="Rank ${i + 2}: ${xp} XP"></i>`)}</div></div>`)}</div></section>
      </div>
      <section class="eclipse-panel"><div class="eclipse-section-head"><h4>BOSS WEAKNESS LEDGER</h4><span>reward pattern learning</span></div><div class="eclipse-weakness-grid">${list(Object.entries(BOSS_WEAKNESSES), ([id, weakness]) => `<div><strong>${esc(ECLIPSE_BOSS_BY_ID[id]?.name || id)}</strong><span>${esc(weakness.element.toUpperCase())} · ${esc(weakness.window)} · +${Math.round(weakness.bonus * 100)}%</span></div>`)}</div></section>
      <section class="eclipse-panel"><div class="eclipse-section-head"><h4>FIVE ECLIPSE CLASSES</h4><span>unique abilities</span></div><div class="eclipse-class-grid">${list(Object.values(ECLIPSE_CLASSES), (meta) => `<div><span>${meta.glyph}</span><strong>${esc(meta.name)}</strong><em>${esc(meta.ability.name)} — ${esc(meta.ability.desc)}</em></div>`)}</div></section>
    `;
  }

  // ── graphics + performance ──────────────────────────────────────────────
  settingsHtml() {
    const settings = this.settings() || {};
    const gameplay = settings.gameplay || {};
    const preset = gameplay.graphicsPreset || 'high';
    const performance = this.options.performance?.() || { average: 0, p95: 0, p99: 0, peakMemoryMb: 0, fps: 0 };
    const suggested = suggestGraphics(performance);
    return `
      <div class="eclipse-hero"><div><span class="eclipse-kicker">PROJECT SMOOTHFALL</span><h3>GRAPHICS & PERFORMANCE</h3><p>Resolusi, bayangan, partikel, VFX, animasi, dan frame cap. Rekomendasi otomatis memakai frame time terukur, bukan rata-rata FPS saja.</p></div>
        <div class="eclipse-hero-stats">${stat('AVG', `${performance.average || 0} ms`)}${stat('P95', `${performance.p95 || 0} ms`)}${stat('P99', `${performance.p99 || 0} ms`)}${stat('MEMORY', `${performance.peakMemoryMb || 0} MB`)}</div>
      </div>
      <div class="eclipse-settings-grid">
        <section class="eclipse-panel"><div class="eclipse-section-head"><h4>PRESET</h4><span>recommended: ${suggested.toUpperCase()}</span></div>
          <div class="eclipse-preset-row">${list(Object.entries(GRAPHICS_PRESETS), ([id, entry]) => `<button class="eclipse-preset ${preset === id ? 'active' : ''}" data-action="graphics-preset" data-preset="${id}"><strong>${esc(entry.label)}</strong><em>${entry.frameCap || '∞'} FPS · ${Math.round(entry.resolutionScale * 100)}%</em></button>`)}</div>
          <button class="btn btn-sm btn-ghost" data-action="apply-recommended">PAKAI REKOMENDASI (${suggested.toUpperCase()})</button>
        </section>
        <section class="eclipse-panel"><div class="eclipse-section-head"><h4>ADVANCED</h4><span>langsung disimpan</span></div>
          ${list([
            ['shadowQuality', 'Shadow quality'], ['particleDensity', 'Particle density'], ['lightingQuality', 'Lighting'],
            ['textureQuality', 'Textures'], ['antiAliasing', 'Anti-aliasing'], ['vfxQuality', 'VFX'],
            ['animationQuality', 'Animation'], ['resolutionScale', 'Resolution scale'], ['frameCap', 'Frame cap'],
            ['backgroundEffects', 'Background effects'], ['renderDistance', 'Render distance'],
          ], ([key, label]) => `<label class="eclipse-setting-row"><span>${label}</span><select data-action="graphics-change" data-key="${key}">${list(GRAPHICS_OPTIONS[key], (value) => `<option value="${esc(value)}" ${String(gameplay[key]) === String(value) || (key === 'graphicsPreset' && String(preset) === String(value)) ? 'selected' : ''}>${esc(value === false ? 'Off' : value === true ? 'On' : `${value}${key === 'particleDensity' ? '×' : key === 'resolutionScale' ? '%' : key === 'frameCap' ? ' FPS' : ''}`)}</option>`)}</select></label>`)}
        </section>
      </div>
      <section class="eclipse-panel"><div class="eclipse-section-head"><h4>FRAME BUDGET</h4><span>60 FPS · 16.67 ms</span></div><div class="eclipse-budget">${[['Average', performance.average, 16.67], ['P95', performance.p95, 20], ['P99', performance.p99, 33.33]].map(([label, value, target]) => `<div><span>${label}</span><strong class="${Number(value) > target ? 'bad' : 'good'}">${value || 0} ms</strong><em>target ≤ ${target} ms</em></div>`).join('')}</div><p class="muted">Catatan: target ini adalah anggaran, bukan jaminan untuk semua perangkat. Pengukuran low/medium/high hardware tetap merupakan release gate terpisah.</p></section>
    `;
  }

  qaHtml() {
    const content = validateEclipseContent();
    const phases = validateBossPhases();
    const release = releaseChecklist();
    return `
      <div class="eclipse-hero"><div><span class="eclipse-kicker">PROJECT CLEAN REALM</span><h3>RELEASE GATE ${release.verified}/${release.total}</h3><p>${release.ready ? 'Seluruh gate terverifikasi.' : `${release.blockers.length} gate belum dapat dinyatakan lulus tanpa pengujian tambahan.`}</p></div><div class="eclipse-hero-stats">${stat('CONTENT', content.ok ? 'PASS' : 'FAIL')}${stat('BOSS PHASES', phases.ok ? 'PASS' : 'FAIL')}${stat('ROOMS', content.totalRooms)}${stat('RUNTIME', String(this.options.runtimeErrors?.()?.count || 0))}</div></div>
      <div class="eclipse-qa-grid">
        <section class="eclipse-panel"><div class="eclipse-section-head"><h4>UPDATE VIII CHECKLIST</h4><span>${release.verified}/${release.total}</span></div><div class="eclipse-checklist">${list(release.items, (item) => `<div class="${item.done ? 'done' : 'blocked'}"><span>${item.done ? '✓' : '!'}</span><strong>${esc(item.label)}</strong><em>${esc(item.evidence)}</em></div>`)}</div></section>
        <section class="eclipse-panel"><div class="eclipse-section-head"><h4>BUG REGISTRY</h4><span>${BUG_REGISTRY.length} issue</span></div><div class="eclipse-bugs">${list(BUG_REGISTRY, (bug) => `<div class="sev-${bug.severity.toLowerCase()}"><span>${bug.id}</span><strong>${esc(bug.title)}</strong><em>${bug.severity} · ${bug.status} · ${esc(bug.regression)}</em></div>`)}</div></section>
      </div>
    `;
  }

  // ── events ──────────────────────────────────────────────────────────────
  onChange(event) {
    const target = event.target;
    if (target.id === 'godfall-practice') {
      this.practice = !!target.checked;
      return;
    }
    if (target.dataset.action === 'graphics-change') {
      const key = target.dataset.key;
      const value = GRAPHICS_OPTIONS[key]?.find((option) => String(option) === target.value);
      this.applyGraphics({ graphicsPreset: 'custom', [key]: value === undefined ? target.value : value });
      return;
    }
    if (target.dataset.action === 'guild-rank') {
      this.changeGuildRank(target.dataset.member, target.value);
    }
  }

  onAction(event) {
    if (event.target.closest('[data-action="guild-chat-form"]')) {
      event.preventDefault();
      const input = $('#guild-chat-input');
      this.chatGuild(input?.value);
      return;
    }
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'play-eclipse') {
      this.options.onPlayEclipse?.(Number(target.dataset.room));
    } else if (action === 'select-floor') {
      this.selectedFloor = clamp(Number(target.dataset.floor) || 1, 1, GODFALL_FLOOR_COUNT);
      this.render();
    } else if (action === 'play-godfall') {
      const practice = !!$('#godfall-practice')?.checked;
      this.options.onPlayGodfall?.(Number(target.dataset.floor) || this.selectedFloor, { practice });
    } else if (action === 'create-guild') {
      this.createGuild();
    } else if (action === 'join-guild') {
      this.joinGuild();
    } else if (action === 'start-raid') {
      const raidId = target.dataset.raid;
      this.options.onStartRaid?.(raidId, { practice: target.dataset.practice === '1' });
    } else if (action === 'awaken') {
      const classId = target.dataset.class;
      const progress = this.p();
      const result = awakenClass(progress.awakening, classId);
      if (result.ok) {
        progress.awakening = result.state;
        this.save();
        this.toast(`${result.awakening.name} terbangun.`, 2400);
        this.render();
      }
    } else if (action === 'set-passive') {
      const progress = this.p();
      const result = setAwakeningPassive(progress.awakening, target.dataset.class, target.dataset.passive);
      if (result.ok) { progress.awakening = result.state; this.save(); this.render(); }
    } else if (action === 'graphics-preset') {
      this.applyGraphics({ graphicsPreset: target.dataset.preset });
    } else if (action === 'apply-recommended') {
      const performance = this.options.performance?.() || {};
      this.applyGraphics({ graphicsPreset: suggestGraphics(performance) });
    }
  }

  createGuild() {
    const progress = this.p();
    const name = $('#guild-name')?.value || '';
    const emblem = $('#guild-emblem')?.value || '⚔';
    const result = createGuild(progress.guild, { name, emblem, leader: this.options.playerName?.() || 'Warden' });
    if (!result.ok) { this.toast(result.error === 'name_too_short' ? 'Nama guild minimal 3 karakter.' : 'Guild tidak dapat didirikan.', 1800); return; }
    progress.guild = result.state;
    this.save();
    this.render();
    this.toast(`${result.guild.name} didirikan.`, 2200);
  }

  joinGuild() {
    const progress = this.p();
    const result = joinGuild(progress.guild, { name: this.options.playerName?.() || 'Warden' });
    if (!result.ok) return;
    progress.guild = result.state;
    this.save();
    this.render();
    this.toast('Bergabung dengan Forgotten Pantheon.', 2000);
  }

  chatGuild(text) {
    const progress = this.p();
    const result = guildChat(progress.guild, { name: this.options.playerName?.() || 'Warden', text });
    if (!result.ok) return;
    progress.guild = result.state;
    this.save();
    this.render();
  }

  changeGuildRank(memberId, rank) {
    const progress = this.p();
    const result = setGuildRank(progress.guild, memberId, rank);
    if (result.ok) { progress.guild = result.state; this.save(); this.render(); }
  }

  applyGraphics(patch) {
    const settings = this.settings() || {};
    const gameplay = { ...(settings.gameplay || {}), ...patch };
    if (patch.graphicsPreset && patch.graphicsPreset !== 'custom') {
      const preset = GRAPHICS_PRESETS[patch.graphicsPreset];
      Object.assign(gameplay, {
        graphicsPreset: patch.graphicsPreset,
        frameCap: preset.frameCap,
        shadowQuality: preset.shadowQuality,
        particleDensity: preset.particleDensity <= 0.35 ? 'off' : preset.particleDensity < 1 ? 'low' : 'full',
        lightingQuality: preset.lightingQuality,
        textureQuality: preset.textureQuality,
        antiAliasing: preset.antiAliasing,
        vfxQuality: preset.vfxQuality,
        animationQuality: preset.animationQuality,
        backgroundEffects: preset.backgroundEffects,
        renderDistance: preset.renderDistance,
        resolutionScale: preset.resolutionScale,
      });
    }
    this.options.onApplySettings?.({ gameplay });
    this.render();
  }
}

// Exposed so browser smoke can drive the same values as the UI.
export const ECLIPSE_UI_TABS = ['campaign', 'godfall', 'guilds', 'awakening', 'combat', 'settings', 'qa'];
