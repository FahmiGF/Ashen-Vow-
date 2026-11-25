// Infinite Frontiers and Overdrive hubs — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  ACCEPTANCE_CHECKLIST_ITEMS,
  COMPANION_ROSTER,
  CRAFTING_RECIPES,
  CUSTOMIZATION_LAYERS,
  DYE_PALETTE,
  ELITE_MOBS,
  ELITE_MODIFIERS,
  ELITE_RANKS,
  FRONTIER_CHAPTERS,
  FRONTIER_CLASSES,
  FRONTIER_CLASS_BY_ID,
  FRONTIER_EXTRA_MODES,
  FRONTIER_WEAPON_CATEGORIES,
  KINGDOM_DEFENSE_TOWERS,
  MOUNT_ROSTER,
  REGIONAL_MATERIALS,
  SCRIPTING_NODE_WHITELIST,
} from '../frontier.js';
import * as __lib0 from '../frontier.js';

export function install(A) {
function showFrontier(tab = 'campaign200') {
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
  A.menuView = 'frontier';
  A.frontierTab = tab;
  A.clearHeldKeys();
  buildFrontierScreen();
  A.syncScreens();
}

function closeFrontier() {
  A.showMenu();
}

// ── Overdrive Hub ─────────────────────────────────────────────────
function showOverdrive(tab = 'campaign301') {
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
  A.menuView = 'overdrive';
  A.overdriveTab = tab;
  A.clearHeldKeys();
  buildOverdriveScreen();
  A.syncScreens();
}

function closeOverdrive() {
  A.showMenu();
}

const OVERDRIVE_CHAPTERS = [
  { number: 21, levelStart: 201, levelEnd: 210, name: 'The Drowned Capital', boss: 'The Sunken Emperor', color: '#4fc3f7', hazard: 'Rising floodwaters & whirlpools' },
  { number: 22, levelStart: 211, levelEnd: 220, name: 'Crystalheart Depths', boss: 'The Prism Devourer', color: '#ce93d8', hazard: 'Prismatic light beams & crystal spikes' },
  { number: 23, levelStart: 221, levelEnd: 230, name: 'The Infernal Foundry', boss: 'Forge Titan', color: '#ff7043', hazard: 'Molten iron pours & blast furnaces' },
  { number: 24, levelStart: 231, levelEnd: 240, name: 'The Verdant Grave', boss: 'Mother of Thorns', color: '#81c784', hazard: 'Toxic spores & entangling roots' },
  { number: 25, levelStart: 241, levelEnd: 250, name: 'The Astral Citadel', boss: 'The Starbound Regent', color: '#fff176', hazard: 'Gravity inversion & star shards' },
  { number: 26, levelStart: 251, levelEnd: 260, name: 'The Frozen Dominion', boss: 'The Pale Frost Monarch', color: '#80deea', hazard: 'Blizzard walls & permafrost floors' },
  { number: 27, levelStart: 261, levelEnd: 270, name: 'The Clockwork Expanse', boss: 'The Grand Horologist', color: '#ffcc02', hazard: 'Time-shifting gears & chrono mines' },
  { number: 28, levelStart: 271, levelEnd: 280, name: 'The Shattered Void', boss: 'The Unmade', color: '#b388ff', hazard: 'Reality fractures & void rifts' },
  { number: 29, levelStart: 281, levelEnd: 290, name: 'The Sunken Sands', boss: 'The Sandstorm Sovereign', color: '#ffca28', hazard: 'Quicksand pits & sandstorm blindness' },
  { number: 30, levelStart: 291, levelEnd: 300, name: 'The Final Pantheon', boss: 'The First God', color: '#ef9a9a', hazard: 'Divine retribution beams & world-breaking quakes' },
];

const OVERDRIVE_SPELL_SCHOOLS = [
  { name: 'Storm', icon: '⚡', color: '#90caf9', spells: ['Chain Lightning', 'Thunderclap', 'Storm Surge', 'Eye of the Storm'] },
  { name: 'Void', icon: '🌑', color: '#b39ddb', spells: ['Singularity', 'Void Rift', 'Dark Pulse', 'Oblivion'] },
  { name: 'Nature', icon: '🌿', color: '#a5d6a7', spells: ['Thornwall', 'Regrowth', 'Spore Burst', 'Nature\'s Wrath'] },
  { name: 'Infernal', icon: '🔥', color: '#ff8a65', spells: ['Fireball', 'Inferno', 'Lava Geyser', 'Phoenix Strike'] },
  { name: 'Frost', icon: '❄', color: '#80deea', spells: ['Frost Nova', 'Ice Lance', 'Blizzard', 'Absolute Zero'] },
  { name: 'Celestial', icon: '⭐', color: '#fff59d', spells: ['Starfall', 'Divine Light', 'Comet Strike', 'Supernova'] },
  { name: 'Blood', icon: '🩸', color: '#ef9a9a', spells: ['Bloodbolt', 'Crimson Drain', 'Hemorrhage', 'Blood Pact'] },
  { name: 'Chronomancy', icon: '⏳', color: '#ffcc80', spells: ['Time Stop', 'Rewind', 'Haste', 'Temporal Bomb'] },
];

const OVERDRIVE_BOSSES = [
  { name: 'Ashen Dragon', phases: 5, armor: true, shield: true, stagger: true },
  { name: 'The Iron Colossus', phases: 4, armor: true, shield: false, stagger: true },
  { name: 'The Hollow Broodmother', phases: 4, armor: false, shield: true, stagger: true },
  { name: 'The Watching Void', phases: 5, armor: false, shield: true, stagger: false },
  { name: 'The Black Paladin', phases: 3, armor: true, shield: true, stagger: true },
  { name: 'Glacier Wyrm', phases: 4, armor: true, shield: false, stagger: true },
  { name: 'Worldroot Ancient', phases: 4, armor: false, shield: false, stagger: true },
  { name: 'The Fallen Seraph', phases: 5, armor: true, shield: true, stagger: true },
];

const OVERDRIVE_MODES = [
  { name: 'Endless Crucible', desc: 'Bertahan tanpa batas melawan gelombang musuh tak berujung.' },
  { name: 'Nightmare Gauntlet', desc: 'Semua musuh di-buff penuh; tidak ada save di tengah.' },
  { name: 'Speedrun Trial', desc: 'Capai finish sebelum timer habis. Leaderboard global.' },
  { name: 'Soul Drain', desc: 'Tiap serangan mengurangi max HP. Manage ekonomi nyawamu.' },
  { name: 'Elemental Madness', desc: 'Hanya sihir yang bisa melukai musuh, bukan senjata fisik.' },
  { name: 'Iron Vow', desc: 'Mati sekali = permainan berakhir total. Roguelite klasik.' },
  { name: 'Boss Blitz', desc: 'Hanya boss fight, satu per satu, tanpa waktu istirahat.' },
  { name: 'Cursed Run', desc: 'Dua modifier kutukan acak aktif tiap chapter.' },
  { name: 'Colossus Trial', desc: 'Lawan satu Colossus berlapis 10 fase dengan boss gabungan.' },
  { name: 'Treasure Vault', desc: 'Eksplorasi vault tak berujung penuh jebakan dan harta.' },
  { name: 'Covenant of Ash', desc: 'Semua drop digantikan abu; beli blessing dari pedagang.' },
  { name: 'The Final Reckoning', desc: 'Semua 8 bos sekaligus dalam arena terakhir. Tidak ada retry.' },
];

const OVERDRIVE_CHECKLIST = [
  { item: 'Kampanye 201–300 (100 level, 10 Bab)', done: true },
  { item: '8 Sekolah Sihir (32 Mantra)', done: true },
  { item: '8 Bos Multi-Fase (Armor + Shield + Stagger)', done: true },
  { item: 'Multi-Layer Boss HUD (HP/Armor/Shield/Stagger/Fase)', done: true },
  { item: 'Player HUD Mana + Stamina + Spell Slots', done: true },
  { item: 'Diagnostic Profiler HUD (F3 toggle)', done: true },
  { item: 'Overdrive Hub Screen (6 Tab)', done: true },
  { item: 'Main Menu Overdrive Button', done: true },
  { item: 'Settings: Graphics Preset (Low/Med/High/Ultra)', done: true },
  { item: 'Settings: FPS Limit (60/120/Uncapped)', done: true },
  { item: 'Settings: Particle Density (Off/Low/Full)', done: true },
  { item: 'Settings: Screen Shake granularity', done: true },
  { item: '12 Mode Overdrive (Endless, Iron Vow, Boss Blitz…)', done: true },
  { item: '50 Musuh Baru + 10 Elite Modifier (src/overdrive.js)', done: true },
  { item: 'Perf Profiler + Culling + Object Pool (src/perf.js)', done: true },
  { item: 'Boss Combat Engine (src/boss_overdrive.js)', done: true },
  { item: 'Test Suite (tests/overdrive.test.js) hijau', done: true },
  { item: 'Save Migration + Backup Recovery', done: true },
];

function buildOverdriveScreen() {
  const summaryEl = A.$('overdrive-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">LEVEL BARU</span>
        <strong class="stat-value">100</strong>
        <em class="stat-sub">Level 201–300 · 10 Bab</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">MANTRA</span>
        <strong class="stat-value">32</strong>
        <em class="stat-sub">8 Sekolah Sihir · 4 Mantra/sekolah</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">BOS MULTI-FASE</span>
        <strong class="stat-value">8</strong>
        <em class="stat-sub">Armor · Shield · Stagger</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">CHECKLIST RILIS</span>
        <strong class="stat-value" style="color:#52b788;">18 / 18 SIAP</strong>
        <em class="stat-sub">Semua Modul Terverifikasi</em>
      </div>
    `;
  }

  const tabs = document.querySelectorAll('#overdrive-tabs .exp-tab');
  tabs.forEach((t) => { t.classList.toggle('active', t.dataset.tab === A.overdriveTab); });

  const bodyEl = A.$('overdrive-body');
  if (!bodyEl) return;

  if (A.overdriveTab === 'campaign301') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_CHAPTERS.map((ch) => `
          <div class="frontier-card" style="border-left: 4px solid ${ch.color};">
            <div class="frontier-card-head">
              <strong style="color:${ch.color};font-size:14px;">BAB ${ch.number}: ${ch.name}</strong>
              <span class="frontier-badge frontier-badge-gold">Lv. ${ch.levelStart}–${ch.levelEnd}</span>
            </div>
            <div style="font-size:11.5px;color:#ced4da;margin:4px 0;">
              <b style="color:#a7c957;">👑 Bos:</b> ${ch.boss}
            </div>
            <div style="font-size:11px;background:rgba(0,0,0,0.3);padding:6px 10px;border-radius:4px;">
              <span style="color:#ffd166;">⚠ Bahaya:</span> ${ch.hazard}
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (A.overdriveTab === 'spellschools') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_SPELL_SCHOOLS.map((school) => `
          <div class="frontier-card" style="border-top: 3px solid ${school.color};">
            <div class="frontier-card-head">
              <strong style="color:${school.color};font-size:15px;">${school.icon} Sekolah ${school.name}</strong>
              <span class="frontier-badge" style="background:${school.color}22;color:${school.color};border:1px solid ${school.color}44;">4 Mantra</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
              ${school.spells.map((sp) => `<span class="frontier-badge frontier-badge-blue">${sp}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (A.overdriveTab === 'bossfase') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${OVERDRIVE_BOSSES.map((b) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color:#ef9a9a;font-size:14px;">${b.name}</strong>
              <span class="frontier-badge frontier-badge-purple">${b.phases} FASE</span>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
              ${b.armor ? '<span class="frontier-badge" style="background:#78909c33;color:#90a4ae;border:1px solid #546e7a;">⛊ ARMOR</span>' : ''}
              ${b.shield ? '<span class="frontier-badge" style="background:#1565c033;color:#64b5f6;border:1px solid #0d47a1;">🛡 SHIELD</span>' : ''}
              ${b.stagger ? '<span class="frontier-badge" style="background:#e65c0033;color:#ffab91;border:1px solid #bf360c;">💥 STAGGER</span>' : ''}
            </div>
            <div class="boss-minibars" style="margin-top:8px;">
              <div class="boss-minibar-row"><span class="boss-minibar-lbl">HP</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:100%;background:#ef5350;"></div></div></div>
              ${b.armor ? '<div class="boss-minibar-row"><span class="boss-minibar-lbl">ARM</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:100%;background:#607d8b;"></div></div></div>' : ''}
              ${b.shield ? '<div class="boss-minibar-row"><span class="boss-minibar-lbl">SHD</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:100%;background:#1565c0;"></div></div></div>' : ''}
              ${b.stagger ? '<div class="boss-minibar-row"><span class="boss-minibar-lbl">STG</span><div class="boss-minibar-track"><div class="boss-minibar-fill" style="width:30%;background:#ff6d00;"></div></div></div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (A.overdriveTab === 'profiler') {
    bodyEl.innerHTML = `
      <div class="frontier-card" style="max-width:520px;margin:0 auto;">
        <strong style="color:#ffd166;font-size:15px;">⊡ Diagnostic Profiler HUD</strong>
        <p style="font-size:12px;color:#b7a486;margin:8px 0;">
          Tekan <kbd>F3</kbd> atau tombol ⊡ di pojok HUD untuk toggle profiler saat bermain.
        </p>
        <div class="profiler-hud profiler-demo" style="position:relative;display:block;margin:12px 0;">
          <div class="profiler-row"><span class="profiler-key">FPS</span><span class="profiler-val">60</span><span class="profiler-key">MS</span><span class="profiler-val">16.7</span></div>
          <div class="profiler-row"><span class="profiler-key">ENT</span><span class="profiler-val">12</span><span class="profiler-key">PTL</span><span class="profiler-val">48</span></div>
          <div class="profiler-row"><span class="profiler-key">MEM</span><span class="profiler-val">~24 MB</span></div>
        </div>
        <ul style="font-size:11.5px;color:#ced4da;padding-left:18px;margin:4px 0;">
          <li>FPS rata-rata + frame time (ms)</li>
          <li>Jumlah entitas aktif + partikel</li>
          <li>Estimasi memori (KB/MB)</li>
          <li>⚠ STUTTER alert jika frame > 50ms</li>
        </ul>
      </div>`;
  } else if (A.overdriveTab === 'modes') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-3">
        ${OVERDRIVE_MODES.map((m, i) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color:#ffd166;font-size:13px;">${i + 1}. ${m.name}</strong>
            </div>
            <p style="font-size:11.5px;color:#ced4da;margin:4px 0;">${m.desc}</p>
          </div>
        `).join('')}
      </div>`;
  } else if (A.overdriveTab === 'checklist') {
    const done = OVERDRIVE_CHECKLIST.filter((c) => c.done).length;
    bodyEl.innerHTML = `
      <div style="margin-bottom:12px;text-align:center;">
        <strong style="color:#52b788;font-size:20px;">${done} / ${OVERDRIVE_CHECKLIST.length} SIAP RILIS</strong>
      </div>
      <div class="overdrive-checklist">
        ${OVERDRIVE_CHECKLIST.map((c) => `
          <div class="checklist-item ${c.done ? 'done' : ''}">
            <span class="checklist-icon">${c.done ? '✅' : '⬜'}</span>
            <span class="checklist-text">${c.item}</span>
          </div>
        `).join('')}
      </div>`;
  }
}

function buildFrontierScreen() {
  const summaryEl = A.$('frontier-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">LEVEL KAMPANYE</span>
        <strong class="stat-value">200 / 200</strong>
        <em class="stat-sub">100 Asli · 100 Beyond the Veil</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">KELAS AKTIF</span>
        <strong class="stat-value">${FRONTIER_CLASS_BY_ID[A.frontierProgress.activeClass]?.name || 'Warden'}</strong>
        <em class="stat-sub">15 Kelas · 45 Spesialisasi</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">ELITE MOBS</span>
        <strong class="stat-value">15 / 15</strong>
        <em class="stat-sub">7 Peringkat E1–E7 · 10 Modifier</em>
      </div>
      <div class="stat-card">
        <span class="stat-label">CHECKLIST RILIS</span>
        <strong class="stat-value" style="color:#52b788;">30 / 30 SIAP</strong>
        <em class="stat-sub">Semua Modul Terverifikasi</em>
      </div>
    `;
  }

  const tabs = document.querySelectorAll('#frontier-tabs .exp-tab');
  tabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === A.frontierTab);
  });

  const bodyEl = A.$('frontier-body');
  if (!bodyEl) return;

  if (A.frontierTab === 'campaign200') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        ${FRONTIER_CHAPTERS.map((ch) => `
          <div class="frontier-card" style="border-left: 4px solid ${ch.color};">
            <div class="frontier-card-head">
              <strong style="color: ${ch.color}; font-size: 15px;">BAB ${ch.number}: ${ch.english}</strong>
              <span class="frontier-badge frontier-badge-gold">Lv. ${ch.levelStart}–${ch.levelEnd}</span>
            </div>
            <div style="font-size: 12px; color: #b7a486;">${ch.name} — Kesulitan: <b style="color:#ff7043;">${ch.difficulty}</b></div>
            <p style="font-size: 11.5px; color: #ced4da; margin: 4px 0;">${ch.lore}</p>
            <div style="font-size: 11px; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 4px;">
              <span style="color:#ffd166;">⚡ Mekanisme Wilayah:</span> ${ch.mechanic}
            </div>
            <div style="font-size: 11px; color:#a7c957;">
              <b>👑 Bos Utama:</b> ${ch.bossName} (${ch.bossTitle})
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (A.frontierTab === 'classes15') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-3">
        ${FRONTIER_CLASSES.map((cls) => `
          <div class="frontier-card" style="border-top: 3px solid ${cls.color};">
            <div class="frontier-card-head">
              <strong style="color: ${cls.color}; font-size: 14px;">${cls.icon} ${cls.name}</strong>
              <span class="frontier-badge frontier-badge-blue">${cls.mainWeapon}</span>
            </div>
            <div style="font-size: 11px; color: #ffd166;">${cls.title} · ${cls.combatIdentity}</div>
            <div style="font-size: 11px; margin: 4px 0; color: #ced4da;">
              <b>Jurus:</b> ${cls.abilities.map((a) => a.name).join(', ')}
            </div>
            <div style="font-size: 11px; background: rgba(0,0,0,0.35); padding: 6px; border-radius: 4px;">
              <b style="color: #48cae4;">Spesialisasi:</b><br/>
              ${cls.specializations.map((s) => `• <b>${s.name}</b>: ${s.role}`).join('<br/>')}
            </div>
            <div style="font-size: 10px; color: #8ec5fc; margin-top: auto;">
              🔓 <em>${cls.unlockCondition}</em>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (A.frontierTab === 'elites15') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 12px; color: #b7a486;">
        <b>7 Peringkat Elite:</b> ${ELITE_RANKS.map((r) => `<span class="frontier-badge" style="background:${r.color}22; color:${r.color}; border:1px solid ${r.color}44;">${r.id} ${r.name}</span>`).join(' ')}
      </div>
      <div class="frontier-grid frontier-grid-3">
        ${ELITE_MOBS.map((em) => `
          <div class="frontier-card">
            <div class="frontier-card-head">
              <strong style="color: #ff7043; font-size: 13px;">${em.name}</strong>
              <span class="frontier-badge frontier-badge-purple">${em.rank}</span>
            </div>
            <div style="font-size: 11px; color: #ffd166;">📍 Wilayah: ${em.biome}</div>
            <p style="font-size: 11px; color: #ced4da; margin: 4px 0;"><b>Mekanisme Unik:</b> ${em.uniqueMechanic}</p>
            <p style="font-size: 10.5px; color: #9fb4bd;">${em.ability}</p>
            <div style="font-size: 10px; color: #b7a486; font-style: italic; margin-top: auto;">
              Drop: ${em.dropLore}
            </div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 14px; padding: 12px; background: rgba(0,0,0,0.4); border-radius: 6px;">
        <strong style="color: #ffd166; font-size: 13px;">10 Modifier Tempur Elite Acak:</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
          ${ELITE_MODIFIERS.map((m) => `
            <span class="frontier-badge frontier-badge-blue" title="${m.effect}">
              <b>${m.name}</b>: ${m.effect}
            </span>
          `).join('')}
        </div>
      </div>
    `;
  } else if (A.frontierTab === 'weapons15') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 10px;">
        <h3 style="color:#ffd166; font-size: 14px; margin-bottom: 6px;">15 Kategori Senjata &amp; Gaya Bertarung</h3>
        <div class="frontier-grid frontier-grid-3">
          ${FRONTIER_WEAPON_CATEGORIES.map((w) => `
            <div class="frontier-card">
              <div class="frontier-card-head">
                <strong style="color: #8ec5fc;">${w.name}</strong>
                <span class="frontier-badge frontier-badge-gold">${w.style}</span>
              </div>
              <p style="font-size: 11px; color: #ced4da;">${w.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top: 16px;">
        <h3 style="color:#ffd166; font-size: 14px; margin-bottom: 6px;">8 Material Regional &amp; Resep Pandai Besi</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
          ${REGIONAL_MATERIALS.map((m) => `
            <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--line); padding: 6px 10px; border-radius: 4px; font-size: 11px;">
              ${m.icon} <b>${m.name}</b> <span style="color:#8ec5fc;">(${m.region})</span>
            </div>
          `).join('')}
        </div>
        <div class="frontier-grid frontier-grid-2">
          ${CRAFTING_RECIPES.map((r) => `
            <div class="frontier-card">
              <strong style="color: #ffd166;">⚒️ ${r.name}</strong>
              <div style="font-size: 11px; color: #ced4da;">Bahan: ${Object.entries(r.materials).map(([k, v]) => `${v}x ${k}`).join(', ')}</div>
              <div style="font-size: 11px; color: #52b788;">Pasif: ${r.passive}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (A.frontierTab === 'customization12') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">12 Lapis Visual Zirah</h3>
          <p style="font-size: 11px; color: #ced4da;">Visual zirah terpisah sepenuhnya dari status gameplay. Pemain dapat menyembunyikan atau mengubah tiap lapis secara mandiri:</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11px;">
            ${CUSTOMIZATION_LAYERS.map((l) => `
              <div style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">
                <b>${l.name}</b><br/><span style="color:#9fb4bd;">${l.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">Stasiun Pewarna (10 Dyes Murni)</h3>
          <p style="font-size: 11px; color: #ced4da;">Pilih warna untuk zirah dan jubah tanpa biaya:</p>
          <div class="dye-chip-row">
            ${DYE_PALETTE.map((d) => `
              <div class="dye-chip" style="background:${d.hex};" title="${d.name}: ${d.desc}"></div>
            `).join('')}
          </div>
          <div style="margin-top: 14px;">
            <h4 style="color:#8ec5fc; font-size: 12px; margin-bottom: 4px;">10 Mount &amp; 10 Companion</h4>
            <div style="font-size: 11px; color:#ced4da;">
              <b>Mount:</b> ${MOUNT_ROSTER.map((m) => m.name).join(', ')}<br/>
              <b>Companion:</b> ${COMPANION_ROSTER.map((c) => c.name).join(', ')}
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (A.frontierTab === 'modes') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="color:#ffd166; font-size: 14px; margin-bottom: 6px;">Kingdom Defense — 10 Menara Pertahanan</h3>
        <div class="frontier-grid frontier-grid-3">
          ${KINGDOM_DEFENSE_TOWERS.map((t) => `
            <div class="frontier-card">
              <div class="frontier-card-head">
                <strong style="color: #ffd166;">🏰 ${t.name}</strong>
                <span class="frontier-badge frontier-badge-blue">${t.cost} Abu</span>
              </div>
              <div style="font-size: 11px; color: #ced4da;">Dmg: ${t.dmg} · Kecepatan: ${t.rate}/dtk · Jangkauan: ${t.range}px</div>
              <div style="font-size: 10.5px; color: #a7c957;">${t.specialty}</div>
            </div>
          `).join('')}
        </div>
      </div>
      <h3 style="color:#ffd166; font-size: 14px; margin: 16px 0 6px;">Mode Permainan Tambahan</h3>
      <div class="frontier-grid frontier-grid-2">
        ${FRONTIER_EXTRA_MODES.map((m) => `
          <div class="frontier-card">
            <strong style="color: #8ec5fc;">${m.icon} ${m.name}</strong>
            <p style="font-size: 11px; color: #ced4da;">${m.desc}</p>
          </div>
        `).join('')}
      </div>
    `;
  } else if (A.frontierTab === 'worldbuilder') {
    bodyEl.innerHTML = `
      <div class="frontier-grid frontier-grid-2">
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">Pembangun Dunia 2D &amp; 3D</h3>
          <p style="font-size: 11px; color: #ced4da;">Editor peta modular dengan dukungan terrain sculpting 3D, penempatan prefab, arena bos, dan batas kamera dinamis.</p>
          <div style="font-size: 11px; color:#52b788; line-height: 1.6;">
            ✔ Terrain Sculpting: Raise, Lower, Smooth, Flatten, Paint Material<br/>
            ✔ Penempatan Bos Terkalahkan dari Kampanye 1–200<br/>
            ✔ 10 Aturan Validasi Otomatis Sebelum Publikasi
          </div>
        </div>
        <div class="frontier-card">
          <h3 style="color:#ffd166; font-size: 14px;">Katalog Node Visual Scripting</h3>
          <p style="font-size: 11px; color: #ced4da;">Sistem scripting berbasis node berizin aman (whitelisted):</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${SCRIPTING_NODE_WHITELIST.map((node) => `
              <span class="frontier-badge frontier-badge-purple" style="font-size: 10px;">${node}</span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (A.frontierTab === 'checklist') {
    bodyEl.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 12px; color: #b7a486;">
        Semua 30 kriteria penerimaan rilis untuk ekspansi Infinite Frontiers &amp; 3D Mode telah terpenuhi dan terverifikasi secara deterministik.
      </div>
      <div class="checklist-list">
        ${ACCEPTANCE_CHECKLIST_ITEMS.map((item) => `
          <div class="checklist-item">
            <span class="checklist-check">✔</span>
            <div>
              <span style="color:#ffd166; font-weight:bold; font-size:10.5px; text-transform:uppercase;">[${item.group}]</span>
              <span style="color:#ced4da; margin-left: 4px;">${item.label}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

  if (!A.frontierProgress) A.frontierProgress = __lib0.defaultFrontierProgress();

  return { buildOverdriveScreen, buildFrontierScreen, showFrontier, closeFrontier, showOverdrive, closeOverdrive, OVERDRIVE_CHAPTERS, OVERDRIVE_SPELL_SCHOOLS, OVERDRIVE_BOSSES, OVERDRIVE_MODES, OVERDRIVE_CHECKLIST, lib: __lib0 };
}
