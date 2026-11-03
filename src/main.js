// Ashen Vow v0.0.5 — browser shell: fixed-timestep loop, input, HUD, overlays.
import { AshenGame, ROOMS, VIEW_W } from './core.js';
import { Renderer } from './render.js';
import { SoundKit } from './audio.js';

const $ = (id) => document.getElementById(id);
const FIXED = 1 / 120;

const canvas = $('game');
const renderer = new Renderer(canvas);
const audio = new SoundKit();
const game = new AshenGame();

let started = false;
let paused = false;
let attempts = 0;
let lastGameState = game.state;
let bannerTimer = 0;
let toastTimer = 0;
let accumulator = 0;
let lastTime = performance.now();

const keys = Object.create(null);
const touchInput = Object.create(null);
const touchEnabled =
  window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

const ICONS = { iron: '⛊', ember: '✹', wind: '≋' };
const BLESSING_NAMES = {
  iron: 'Vow of Iron',
  ember: 'Vow of Embers',
  wind: 'Vow of Wind',
};

// ── bootstrap ────────────────────────────────────────────────────────────
function startRun() {
  audio.init();
  attempts += 1;
  game.reset();
  started = true;
  paused = false;
  lastGameState = 'playing';
  accumulator = 0;
  lastTime = performance.now();
  showBanner(game.room.name, game.room.subtitle);
  syncScreens();
  updateHud();
}

function retryRun() {
  startRun();
}

function togglePause(force) {
  if (!started) return;
  if (game.state !== 'playing') return;
  paused = typeof force === 'boolean' ? force : !paused;
  if (paused) clearHeldKeys();
  syncScreens();
}

function clearHeldKeys() {
  for (const k of Object.keys(keys)) keys[k] = false;
  for (const k of Object.keys(touchInput)) touchInput[k] = false;
  document.querySelectorAll('.tbtn.on').forEach((b) => b.classList.remove('on'));
}

function toggleMute() {
  audio.init();
  const muted = audio.toggleMuted();
  const btn = $('sound-btn');
  btn.classList.toggle('muted', muted);
  btn.setAttribute('aria-pressed', String(muted));
  btn.textContent = muted ? '∅' : '♪';
}

// ── input ────────────────────────────────────────────────────────────────
const KEY_ACTIONS = {
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'jump',
  KeyW: 'jump',
  ArrowUp: 'jump',
  KeyJ: 'attack',
  KeyZ: 'attack',
  KeyK: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyE: 'heal',
  KeyQ: 'heal',
};

window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }

  if (e.code === 'KeyM') {
    toggleMute();
    return;
  }

  if (!started) {
    if (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ') startRun();
    return;
  }

  if (e.code === 'Escape') {
    if (paused) togglePause(false);
    else togglePause(true);
    return;
  }

  if (paused) return;

  if (game.state === 'blessing') {
    if (e.code === 'Digit1' || e.code === 'Numpad1') chooseBlessing(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2') chooseBlessing(1);
    if (e.code === 'Digit3' || e.code === 'Numpad3') chooseBlessing(2);
    return;
  }

  if (e.code === 'KeyR' || (e.code === 'Enter' && game.state !== 'playing')) {
    if (game.state === 'dead' || game.state === 'victory') {
      retryRun();
      return;
    }
  }

  const action = KEY_ACTIONS[e.code];
  if (action && game.state === 'playing') {
    keys[action] = true;
  }
});

window.addEventListener('keyup', (e) => {
  const action = KEY_ACTIONS[e.code];
  if (action) keys[action] = false;
});

window.addEventListener('blur', () => {
  clearHeldKeys();
});

// touch buttons
document.querySelectorAll('.tbtn').forEach((btn) => {
  const action = btn.dataset.action;
  const press = (e) => {
    e.preventDefault();
    if (!started || paused || game.state !== 'playing') return;
    audio.init();
    touchInput[action] = true;
    btn.classList.add('on');
  };
  const release = (e) => {
    if (e) e.preventDefault();
    touchInput[action] = false;
    btn.classList.remove('on');
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
});

function inputSnapshot() {
  const input = {};
  for (const action of ['left', 'right', 'jump', 'attack', 'dash', 'heal']) {
    input[action] = !!(keys[action] || touchInput[action]);
  }
  return input;
}

// ── UI wiring ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click', startRun);
$('btn-retry').addEventListener('click', retryRun);
$('btn-again').addEventListener('click', retryRun);
$('btn-resume').addEventListener('click', () => togglePause(false));
$('sound-btn').addEventListener('click', toggleMute);

// resume audio on any gesture (mobile Safari)
window.addEventListener(
  'pointerdown',
  () => {
    if (started) audio.init();
  },
  { once: true },
);

function buildBlessings() {
  const wrap = $('blessing-cards');
  wrap.innerHTML = '';
  if (!game.blessingChoices) return;
  game.blessingChoices.forEach((choice, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'blessing-card';
    card.dataset.id = choice.id;
    card.innerHTML = `
      <span class="hotkey">${i + 1}</span>
      <span class="icon" aria-hidden="true">${ICONS[choice.id] || '✦'}</span>
      <span class="b-name">${choice.name}</span>
      <p class="b-desc">${choice.desc}</p>
    `;
    card.addEventListener('click', () => chooseBlessing(i));
    wrap.appendChild(card);
  });
}

function chooseBlessing(index) {
  if (game.state !== 'blessing') return;
  if (game.chooseBlessing(index)) {
    paused = false;
    syncScreens();
  }
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function statsHtml(items) {
  return items
    .map(
      ([value, label]) =>
        `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`,
    )
    .join('');
}

function fillDeathStats() {
  const room = ROOMS[game.roomIndex];
  $('death-sub').textContent = `Kau gugur di ${room.name}. Sumpah belum tuntas — bangkit dan coba lagi.`;
  $('death-stats').innerHTML = statsHtml([
    [formatTime(game.time), 'Waktu'],
    [game.kills, 'Terbunuh'],
    [game.blessings.length, 'Berkah'],
    [attempts, 'Percobaan'],
  ]);
}

function fillVictoryStats() {
  $('victory-stats').innerHTML = statsHtml([
    [formatTime(game.time), 'Total Waktu'],
    [game.kills, 'Terbunuh'],
    [game.blessings.length, 'Berkah'],
    [attempts, 'Percobaan'],
  ]);
  const names = game.blessings.map((id) => BLESSING_NAMES[id] || id);
  $('victory-blessings').textContent = names.length
    ? `Berkah yang kau bawa: ${names.join(' · ')}.`
    : 'Kau menolak semua berkah. Sumpah tetap tuntas.';
}

function showBanner(name, subtitle) {
  $('banner-name').textContent = name || '';
  $('banner-sub').textContent = (subtitle || '').toUpperCase();
  const el = $('banner');
  el.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function showToast(text, ms = 1900) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

function syncScreens() {
  const s = game.state;
  $('title-screen').classList.toggle('hidden', started);
  $('pause-screen').classList.toggle('hidden', !(started && paused));
  $('blessing-screen').classList.toggle('hidden', !(started && !paused && s === 'blessing'));
  $('dead-screen').classList.toggle('hidden', !(started && s === 'dead'));
  $('victory-screen').classList.toggle('hidden', !(started && s === 'victory'));

  const hudVisible = started && !paused && (s === 'playing' || s === 'blessing');
  $('hud').classList.toggle('hidden', !hudVisible);
  $('touch').classList.toggle(
    'hidden',
    !(touchEnabled && started && !paused && s === 'playing'),
  );

  if (s !== lastGameState) {
    if (s === 'blessing') buildBlessings();
    if (s === 'dead') fillDeathStats();
    if (s === 'victory') fillVictoryStats();
    lastGameState = s;
  }
}

let flaskCache = -1;
let relicCache = null;

function updateHud() {
  if (!started) return;
  const hud = game.hud;
  const pct = Math.max(0, Math.min(1, hud.hp / hud.maxHp)) * 100;
  $('hp-fill').style.width = `${pct}%`;
  $('hp-text').textContent = `${hud.hp} / ${hud.maxHp}`;

  if (flaskCache !== hud.flasks) {
    flaskCache = hud.flasks;
    const slots = [];
    for (let i = 0; i < game.player.maxFlasks; i++) {
      slots.push(`<span class="flask ${i < hud.flasks ? 'filled' : ''}"></span>`);
    }
    $('flasks').innerHTML = slots.join('');
  }

  if (relicCache !== hud.relic) {
    relicCache = hud.relic;
    $('relic-badge').classList.toggle('owned', hud.relic);
    $('relic-badge').textContent = hud.relic ? '✦ BULU BARA' : '✦ TERKUNCI';
  }

  $('room-name').textContent = hud.roomName;
  $('room-sub').textContent = (game.room.subtitle || '').toUpperCase();

  const boss = hud.boss;
  $('boss-wrap').classList.toggle('hidden', !boss);
  if (boss) {
    $('boss-name').textContent = boss.name;
    $('boss-title').textContent = boss.title;
    $('boss-fill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    const phase = $('boss-phase');
    phase.textContent = boss.phase === 2 ? 'FASE II' : 'FASE I';
    phase.classList.toggle('on', boss.phase === 2);
  }

  const gate = hud.gate;
  let hint = '';
  if (game.state === 'playing') {
    if (gate && !gate.open && game.isNearGate()) hint = gate.reason;
    else if (hud.boss && game.boss && game.boss.intro > 0) hint = `${hud.boss.name} — ${hud.boss.title}`;
    else hint = hud.hint || '';
  }
  $('hint').textContent = hint;
}

// ── game loop ────────────────────────────────────────────────────────────
function drainEvents() {
  if (!game.events.length) return;
  const events = game.events.splice(0, game.events.length);
  for (const ev of events) {
    if (started && !paused) audio.play(ev);
    if (!started) continue;
    if (ev.type === 'roomEnter') showBanner(ev.name, ev.subtitle);
    else if (ev.type === 'bossSpawn') showToast(`⚔ ${ev.name} — ${ev.title}`, 2400);
    else if (ev.type === 'relic') showToast('Relik Bulu Bara — lompat ganda terbuka', 2400);
    else if (ev.type === 'bossPhase') showToast(`FASE II — ${ev.name} bangkit`, 2200);
    else if (ev.type === 'respawn') showToast('Kau terlempar dari jurang');
    else if (ev.type === 'blessingChosen') showToast(`Berkah: ${ev.name}`, 1600);
  }
}

function frame(now) {
  const raw = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (started && !paused) {
    accumulator += raw;
    let steps = 0;
    while (accumulator >= FIXED && steps < 10) {
      game.update(FIXED, inputSnapshot());
      accumulator -= FIXED;
      steps += 1;
      if (game.state !== 'playing') {
        accumulator = 0;
        break;
      }
    }
  } else {
    accumulator = 0;
  }

  renderer.render(game);
  drainEvents();
  syncScreens();
  updateHud();

  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => renderer.resize());

// ── debug hooks (used by automated smoke tests) ─────────────────────────
window.__ashen = {
  get game() {
    return game;
  },
  get renderer() {
    return renderer;
  },
  get started() {
    return started;
  },
  get paused() {
    return paused;
  },
  start: startRun,
  restart: startRun,
  retry: retryRun,
  enterRoom(index) {
    if (!started) startRun();
    game.enterRoom(index);
    lastGameState = 'playing';
    syncScreens();
    updateHud();
  },
  chooseBlessing(index) {
    chooseBlessing(index);
  },
  damageBoss(n) {
    game.damageBoss(n);
  },
  togglePause,
  step(seconds = 0.1, input = {}) {
    const frames = Math.max(1, Math.round(seconds / FIXED));
    const merged = { ...inputSnapshot(), ...input };
    for (let i = 0; i < frames; i++) game.update(FIXED, merged);
    syncScreens();
    updateHud();
  },
  tap(action) {
    game.update(FIXED, { ...inputSnapshot(), [action]: true });
    for (let i = 0; i < 6; i++) game.update(FIXED, inputSnapshot());
    syncScreens();
    updateHud();
  },
  snap() {
    const b = game.boss;
    return {
      state: game.state,
      room: game.roomIndex,
      roomName: game.room.name,
      hp: game.player.hp,
      maxHp: game.player.maxHp,
      flasks: game.player.flasks,
      relic: game.player.relic,
      kills: game.kills,
      blessings: [...game.blessings],
      enemies: game.enemies.length,
      projectiles: game.projectiles.length,
      boss: b
        ? {
            name: b.name,
            kind: b.kind,
            hp: b.hp,
            maxHp: b.maxHp,
            phase: b.phase,
            state: b.state,
            dying: b.dying,
          }
        : null,
      gate: game.gate ? { open: game.gate.open, reason: game.gate.reason } : null,
      view: { w: VIEW_W, started, paused },
    };
  },
};

// kick off
renderer.render(game);
syncScreens();
updateHud();
requestAnimationFrame(frame);
