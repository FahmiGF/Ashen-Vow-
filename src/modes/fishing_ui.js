// Pondok Umpan — fishing — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  FISHING_BAITS,
  FISHING_BAIT_TIERS,
  FISHING_LOCATION,
  FISHING_SUBTITLE,
  FISH_TOTAL,
  baitHighTierChance,
  drawFishingIcon,
  fishRarity,
  fishingBaitById,
  fishingBuyBait,
  fishingCast,
  fishingEscape,
  fishingFishById,
  fishingIndex,
  fishingLandCatch,
  fishingSelectBait,
  fishingSummary,
  reelHit,
  reelZone,
  sanitizeFishingProgress,
} from '../fishing.js';
import * as __lib0 from '../fishing.js';

export function install(A) {
// ── Fishing: bait shack, reel minigame, illustrated index ───────────────
const FISH_SHAPE_LABELS = {
  slender: 'MEMANJANG',
  round: 'BUNDAR',
  flat: 'PIPIH',
  eel: 'BELUT',
  shell: 'BERCANGKANG',
  squid: 'BERKAKI',
  spiky: 'BERTARING',
};

function fishingState() {
  return A.progressBlock('fishing', sanitizeFishingProgress);
}

function fishingKg(value) {
  const n = Number(value) || 0;
  if (!n) return '—';
  return n >= 10 ? `${n.toFixed(1)} kg` : `${n.toFixed(2)} kg`;
}

function closeFishingOverlays() {
  cancelAnimationFrame(A.fishingReelFrame);
  A.fishingReelFrame = 0;
  A.fishingReel = null;
  A.$('fishing-cast')?.classList.add('hidden');
}

function showFishing() {
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
  A.speedrunSummaryOpen = false;
  closeFishingOverlays();
  A.menuView = 'fishing';
  A.fishIndexTab = 0;
  A.clearHeldKeys();
  buildFishingScreen();
  A.syncScreens();
}

function closeFishing() {
  closeFishingOverlays();
  A.showMenu();
}

function buildFishingScreen() {
  const p = fishingState();
  const summary = fishingSummary(p);
  const selected = fishingBaitById(summary.selectedBait) || FISHING_BAITS[0];
  const owned = p.bait[selected.id] || 0;
  const summaryBox = A.$('fishing-summary');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><span>KOIN</span><strong>${summary.coins}</strong><em>${summary.earned} koin dari tangkapan</em></div>
      <div><span>UMPAN</span><strong>${summary.owned}</strong><em>${summary.baitKinds} jenis di tas</em></div>
      <div><span>INDEKS</span><strong>${summary.discovered} / ${summary.total}</strong><em>${summary.completion}% koleksi</em></div>
      <div><span>TANGKAPAN</span><strong>${summary.successRate}%</strong><em>${summary.catches} berhasil · ${summary.escapes} lepas</em></div>
    `;
  }
  const body = A.$('fishing-body');
  if (body) {
    body.innerHTML = `
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>PILIH UMPAN</h3>
          <span>${summary.hasStarterBait ? 'cacing siap dipakai' : 'umban habis — beli di pondok'}</span>
        </div>
        <div class="bait-rack">
          ${FISHING_BAITS.map((bait) => {
            const count = p.bait[bait.id] || 0;
            const active = summary.selectedBait === bait.id;
            return `<button class="bait-chip tier-${bait.tier}${active ? ' active' : ''}${count ? '' : ' empty'}" type="button" data-fishing-bait="${bait.id}">
              <span class="bait-glyph" style="--bait:${bait.color};--bait-accent:${bait.accent}" aria-hidden="true">${bait.glyph}</span>
              <span class="bait-copy"><strong>${A.esc(bait.short)}</strong><em>${bait.price} koin · ${count} tersisa</em></span>
              <small>${baitHighTierChance(bait.id)}% langka+</small>
            </button>`;
          }).join('')}
        </div>
      </section>
      <section class="exp-section">
        <div class="exp-section-head">
          <h3>DANAU ABU</h3>
          <span>${summary.casts} lemparan · rekor ${fishingKg(summary.bestKg)}</span>
        </div>
        <div class="fishing-pond">
          <div class="fishing-pond-art" aria-hidden="true">
            <span class="pond-sun"></span>
            <span class="pond-wave w1"></span>
            <span class="pond-wave w2"></span>
            <span class="pond-float"></span>
            <span class="pond-hut"></span>
          </div>
          <div class="fishing-pond-copy">
            <h4>${A.esc(FISHING_LOCATION)}</h4>
            <p>${A.esc(FISHING_SUBTITLE)}</p>
            <div class="fishing-pond-meta">
              <span>UMPAN AKTIF<b>${A.esc(selected.short)} ×${owned}</b></span>
              <span>PELUANG LANGKA+<b>${baitHighTierChance(selected.id)}%</b></span>
              <span>TERTANGKAP<b>${summary.catches}</b></span>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  const cast = A.$('fishing-cast-start');
  if (cast) {
    const label = cast.querySelector('span');
    if (label) label.textContent = owned ? `LEMPAR KAIL (${selected.short} ×${owned})` : 'UMPAN HABIS';
    cast.disabled = owned <= 0;
  }
}

function selectFishingBait(baitId) {
  if (!fishingSelectBait(fishingState(), baitId)) return false;
  A.saveProgress();
  buildFishingScreen();
  return true;
}

function paintFishingCastArt(fish, landed) {
  const canvas = A.$('fishing-cast-canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  if (fish && landed) {
    drawFishingIcon(ctx, fish, 60, 35, 58);
    return;
  }
  ctx.strokeStyle = 'rgba(150, 205, 220, 0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(60, 44, 18 + i * 13, 5 + i * 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = '#e0b06a';
  ctx.arc(60, 44, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(59, 16, 2, 22);
}

function fishingReelLoop(now) {
  if (!A.fishingReel || A.fishingReel.resolved) {
    A.fishingReelFrame = 0;
    return;
  }
  const delta = Math.min(0.05, Math.max(0, (now - (A.fishingReel.last || now)) / 1000));
  A.fishingReel.last = now;
  A.fishingReel.position += (A.fishingReel.dir * delta) / 0.85;
  if (A.fishingReel.position >= 1) {
    A.fishingReel.position = 1;
    A.fishingReel.dir = -1;
  } else if (A.fishingReel.position <= 0) {
    A.fishingReel.position = 0;
    A.fishingReel.dir = 1;
  }
  const marker = A.$('fishing-reel-marker');
  if (marker) marker.style.left = `${Math.round(A.fishingReel.position * 1000) / 10}%`;
  A.fishingReelFrame = requestAnimationFrame(fishingReelLoop);
}

function beginFishingCast() {
  const p = fishingState();
  const cast = fishingCast(p, p.selectedBait, Math.random());
  if (!cast.ok) {
    A.showToast(cast.reason === 'empty' ? 'Umpan habis — beli di pondok umpan.' : 'Umpan itu tidak dikenal.', 2200);
    return false;
  }
  A.saveProgress();
  const bait = fishingBaitById(cast.bait);
  A.fishingReel = {
    fish: cast.fish,
    zone: reelZone(cast.fish),
    bait: bait ? bait.short : 'umpan',
    position: 0,
    dir: 1,
    last: performance.now(),
    resolved: false,
    result: '',
  };
  buildFishingScreen();
  const overlay = A.$('fishing-cast');
  if (!overlay) return false;
  overlay.classList.remove('hidden');
  const name = A.$('fishing-cast-name');
  const sub = A.$('fishing-cast-sub');
  const result = A.$('fishing-cast-result');
  if (name) name.textContent = 'SESUATU MENGGIGIT!';
  if (sub) sub.textContent = `Umpan ${A.fishingReel.bait} · tekan TARIK saat penanda di zona terang`;
  if (result) {
    result.textContent = '';
    result.className = 'fishing-cast-result';
  }
  const zoneEl = A.$('fishing-reel-zone');
  if (zoneEl) {
    zoneEl.style.left = `${(A.fishingReel.zone.center - A.fishingReel.zone.half) * 100}%`;
    zoneEl.style.width = `${A.fishingReel.zone.half * 2 * 100}%`;
  }
  const marker = A.$('fishing-reel-marker');
  if (marker) marker.style.left = '0%';
  const strike = A.$('fishing-strike');
  if (strike) {
    const label = strike.querySelector('span');
    if (label) label.textContent = 'TARIK!';
  }
  paintFishingCastArt(null, false);
  cancelAnimationFrame(A.fishingReelFrame);
  A.fishingReelFrame = requestAnimationFrame(fishingReelLoop);
  return true;
}

function strikeFishingReel(position) {
  if (!A.fishingReel || A.fishingReel.resolved) return false;
  A.fishingReel.resolved = true;
  cancelAnimationFrame(A.fishingReelFrame);
  A.fishingReelFrame = 0;
  const at = typeof position === 'number' ? position : A.fishingReel.position;
  const p = fishingState();
  const fish = A.fishingReel.fish;
  const rarity = fishRarity(fish.tier);
  const hit = reelHit(fish, at);
  const name = A.$('fishing-cast-name');
  const sub = A.$('fishing-cast-sub');
  const result = A.$('fishing-cast-result');
  const strike = A.$('fishing-strike');
  if (strike) {
    const label = strike.querySelector('span');
    if (label) label.textContent = 'LEMPAR LAGI';
  }
  if (hit) {
    const landed = fishingLandCatch(p, fish, Math.random());
    A.saveProgress();
    A.fishingReel.result = 'hit';
    if (name) name.textContent = `${fish.name} · ${fishingKg(landed.kg)}`;
    if (sub) {
      sub.textContent = `${rarity.name} · ${fish.value} koin${landed.isRecord ? ' · REKOR BERAT BARU' : ''} · tertangkap ${landed.caughtCount}×`;
    }
    if (result) {
      result.textContent = 'TERTARIK!';
      result.className = 'fishing-cast-result hit';
    }
    paintFishingCastArt(fish, true);
    A.showToast(`🎣 ${fish.name} — ${fishingKg(landed.kg)} (+${fish.value} koin)`, 2400);
  } else {
    fishingEscape(p);
    A.saveProgress();
    A.fishingReel.result = 'miss';
    if (name) name.textContent = 'IKAN ITU LEPAS';
    if (sub) sub.textContent = `${rarity.name} · penanda meleset dari zona — umpan tetap terpakai`;
    if (result) {
      result.textContent = 'LEPAS';
      result.className = 'fishing-cast-result miss';
    }
    paintFishingCastArt(fish, true);
  }
  return hit;
}

function openBaitShop() {
  closeFishingOverlays();
  A.menuView = 'baitShop';
  buildBaitShop();
  A.syncScreens();
}

function closeBaitShop() {
  A.menuView = 'fishing';
  buildFishingScreen();
  A.syncScreens();
}

function buildBaitShop() {
  const p = fishingState();
  const summary = fishingSummary(p);
  const wallet = A.$('bait-shop-wallet');
  if (wallet) {
    wallet.innerHTML = `
      <span class="wallet-coin" aria-hidden="true">◉</span>
      <strong>${summary.coins}</strong>
      <em>koin · ${summary.owned} umpan di tas</em>
    `;
  }
  const body = A.$('bait-shop-body');
  if (!body) return;
  body.innerHTML = FISHING_BAIT_TIERS.map((tier) => `
    <section class="bait-shelf tier-${tier.tier}">
      <div class="exp-section-head">
        <h3>${A.esc(tier.name)}</h3>
        <span>${tier.price} koin / unit · ${A.esc(tier.note)}</span>
      </div>
      <div class="bait-shelf-grid">
        ${FISHING_BAITS.filter((bait) => bait.tier === tier.tier).map((bait) => {
          const count = p.bait[bait.id] || 0;
          const canOne = summary.coins >= bait.price;
          const canFive = summary.coins >= bait.price * 5;
          return `<article class="bait-shop-card${count ? '' : ' unbought'}">
            <span class="bait-shop-glyph" style="--bait:${bait.color};--bait-accent:${bait.accent}" aria-hidden="true">${bait.glyph}</span>
            <div class="bait-shop-copy">
              <h4>${A.esc(bait.name)}</h4>
              <em>${baitHighTierChance(bait.id)}% peluang ikan langka+</em>
              <p>${A.esc(bait.blurb)}</p>
              <div class="bait-shop-meta">
                <span>HARGA<b>${bait.price}</b></span>
                <span>DIMILIKI<b>${count}</b></span>
              </div>
            </div>
            <div class="bait-shop-actions">
              <button class="btn btn-primary btn-compact" type="button" data-buy-bait="${bait.id}" data-bait-qty="1"${canOne ? '' : ' disabled'}>BELI ×1</button>
              <button class="btn btn-ghost btn-compact" type="button" data-buy-bait="${bait.id}" data-bait-qty="5"${canFive ? '' : ' disabled'}>BELI ×5</button>
            </div>
          </article>`;
        }).join('')}
      </div>
    </section>
  `).join('');
}

function buyFishingBait(baitId, qty = 1) {
  const result = fishingBuyBait(fishingState(), baitId, qty);
  if (!result.ok) {
    A.showToast(
      result.reason === 'coins'
        ? `Koin kurang: ${result.name || 'umpan'} butuh ${result.total}, kau punya ${result.coins}.`
        : result.reason === 'full'
          ? 'Tas umpan penuh untuk jenis ini.'
          : 'Umpan itu tidak dijual di sini.',
      2200,
    );
    return result;
  }
  A.saveProgress();
  buildBaitShop();
  A.showToast(`+${result.qty} ${result.name} · ${result.total} koin`, 2000);
  return result;
}

function openFishIndex() {
  closeFishingOverlays();
  A.menuView = 'fishIndex';
  buildFishIndex();
  A.syncScreens();
}

function closeFishIndex() {
  A.menuView = 'fishing';
  buildFishingScreen();
  A.syncScreens();
}

function setFishIndexTab(tier) {
  A.fishIndexTab = Math.max(0, Math.min(5, Math.floor(Number(tier) || 0)));
  buildFishIndex();
}

function paintFishIcons() {
  for (const canvas of document.querySelectorAll('#fish-index-body canvas[data-fish-icon]')) {
    const fish = fishingFishById(canvas.dataset.fishIcon);
    const ctx = canvas.getContext('2d');
    if (!fish || !ctx) continue;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    drawFishingIcon(ctx, fish, 60, 35, 60);
  }
}

function buildFishIndex() {
  const p = fishingState();
  const index = fishingIndex(p);
  const summary = fishingSummary(p);
  const summaryBox = A.$('fish-index-summary');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div><span>SPESIES</span><strong>${summary.discovered} / ${FISH_TOTAL}</strong><em>${summary.completion}% indeks</em></div>
      <div><span>TANGKAPAN</span><strong>${summary.catches}</strong><em>${summary.casts} lemparan</em></div>
      <div><span>REKOR BERAT</span><strong>${fishingKg(summary.bestKg)}</strong><em>${summary.bestFish ? A.esc(fishingFishById(summary.bestFish)?.name || '—') : 'belum ada'}</em></div>
      <div><span>KOIN</span><strong>${summary.coins}</strong><em>${summary.earned} total didapat</em></div>
    `;
  }
  const tabs = A.$('fish-index-tabs');
  if (tabs) {
    tabs.innerHTML = [0, 1, 2, 3, 4, 5].map((tier) => `<button class="fish-tab${A.fishIndexTab === tier ? ' active' : ''}" type="button" data-fish-tier="${tier}">${tier ? fishRarity(tier).name : `SEMUA ${FISH_TOTAL}`}</button>`).join('');
  }
  const body = A.$('fish-index-body');
  if (!body) return;
  const rows = A.fishIndexTab ? index.filter((row) => row.fish.tier === A.fishIndexTab) : index;
  body.innerHTML = rows.map((row) => {
    const fish = row.fish;
    return `<article class="fish-card tier-${fish.tier}${row.discovered ? '' : ' unknown'}">
      <div class="fish-card-art" style="--fish:${fish.body};--fish-accent:${fish.fin}">
        <canvas data-fish-icon="${fish.id}" width="240" height="140" role="img" aria-label="Gambar ${A.esc(fish.name)}"></canvas>
      </div>
      <div class="fish-card-body">
        <div class="fish-card-head">
          <h4>${A.esc(fish.name)}</h4>
          <span class="fish-rarity">${row.rarity.name}</span>
        </div>
        <p class="fish-card-note">${A.esc(fish.note)}</p>
        <div class="fish-meta">
          <span>TIPE<b>${FISH_SHAPE_LABELS[fish.shape] || fish.shape}</b></span>
          <span>BERAT<b>${fish.minKg}–${fish.maxKg} kg</b></span>
          <span>NILAI<b>${fish.value} koin</b></span>
          <span>TERBUKA<b>${row.count > 0 ? 'YA' : 'BELUM'}</b></span>
          <span>TERTANGKAP<b>${row.count}</b></span>
          <span>REKOR<b>${fishingKg(row.bestKg)}</b></span>
        </div>
        <div class="fish-odds">
          <span class="fish-odds-head">PELUANG PER UMPAN</span>
          ${row.chances.map((entry) => `<span class="fish-odds-chip${entry.baitId === row.bestBait ? ' best' : ''}">${A.esc(entry.baitName)}<b>${entry.chance}%</b></span>`).join('')}
        </div>
      </div>
    </article>`;
  }).join('');
  paintFishIcons();
}

  return { fishingState, fishingKg, closeFishingOverlays, showFishing, closeFishing, buildFishingScreen, selectFishingBait, paintFishingCastArt, fishingReelLoop, beginFishingCast, strikeFishingReel, openBaitShop, closeBaitShop, buildBaitShop, buyFishingBait, openFishIndex, closeFishIndex, setFishIndexTab, paintFishIcons, buildFishIndex, FISH_SHAPE_LABELS, lib: __lib0 };
}
