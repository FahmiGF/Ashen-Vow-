// Ashen Vow 3D Mode and Blackveil Nightfall — screen module split out of main.js (Phase 1, v0.37.0).
// Loaded on demand by main.js's mode loader. `A` is the shell context: every
// shared binding of main.js is reached through it, so this file owns no globals.
import {
  Ashen3DGame,
  render3D,
} from '../mode3d.js';
import {
  HORROR3D_SITES,
  horror3DSite,
  horror3DSummary,
  record3DHorrorResult,
} from '../mode3d_horror.js';
import * as __lib0 from '../mode3d.js';

export function install(A) {
function showMode3D(subMode = 'campaign', options = {}) {
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
  A.menuView = 'mode3d';
  const region = A.$('select-3d-region')?.value || 'thornveil';
  const area = A.$('select-3d-area')?.value || '';
  if (!A.game3D) {
    A.game3D = new Ashen3DGame({
      viewW: 960,
      viewH: 540,
      subMode,
      region,
      quality: A.settings.graphics.preset === 'extreme' ? 'ultra' : A.settings.graphics.preset,
      visualSettings: A.settings.graphics,
      hudSettings: A.settings.hud,
      cameraSensitivity: A.settings.controls.cameraSensitivity / 100,
    });
  } else {
    A.game3D.subMode = subMode;
    A.game3D.setRegion(region);
  }
  if (area && subMode !== 'scary') A.game3D.setArea(area);
  A.game3D.player.weaponId = A.game.player.weapon;
  if (subMode === 'scary') {
    start3DHorrorRun(options.siteId || A.horror3DSiteId, options);
  } else {
    buildHorror3DPanel();
  }
  A.clearHeldKeys();
  A.syncScreens();
}

function start3DHorrorRun(siteId, options = {}) {
  const site = horror3DSite(siteId);
  if (!site || !A.game3D) return null;
  A.horror3DSiteId = site.id;
  const anti = options.antiJumpscare ?? A.$('horror3d-anti')?.checked ?? A.horror3D.settings.antiJumpscare;
  const intensity = options.intensity || A.$('horror3d-intensity')?.value || A.horror3D.settings.intensity;
  A.horror3D.settings.antiJumpscare = !!anti;
  A.horror3D.settings.intensity = ['reduced', 'full', 'nightmare'].includes(intensity) ? intensity : 'full';
  A.horror3D.lastSite = site.id;
  A.save3DHorrorState();
  const active = A.game3D.startHorrorSite(site.id, { antiJumpscare: !!anti, intensity: A.horror3D.settings.intensity });
  if (!active) return null;
  A.game3D.player.weaponId = A.game.player.weapon;
  buildHorror3DPanel();
  A.syncScreens();
  return A.game3D.horrorSnapshot();
}

function start3DHorror(siteId = A.horror3DSiteId, options = {}) {
  if (A.menuView !== 'mode3d' || !A.game3D) {
    showMode3D('scary', { siteId, ...options });
    return A.game3D?.horrorSnapshot() || null;
  }
  return start3DHorrorRun(siteId, options);
}

function restart3DHorror() {
  const siteId = A.game3D?.horror?.siteId || A.horror3DSiteId;
  return start3DHorror(siteId, {
    antiJumpscare: A.game3D?.horror?.antiJumpscare,
    intensity: A.game3D?.horror?.intensity,
  });
}

function buildHorror3DPanel() {
  const summary = horror3DSummary(A.horror3D);
  const list = A.$('horror3d-sites');
  if (list) {
    list.innerHTML = summary.sites.map((entry) => `
      <button class="horror3d-card${entry.cleared ? ' cleared' : ''}${entry.id === A.horror3DSiteId ? ' active' : ''}" type="button" data-horror-site="${entry.id}">
        <span class="horror3d-card-level">SITUS ${String(entry.level).padStart(2, '0')} · ${entry.difficulty.toUpperCase()}</span>
        <strong>${entry.name}</strong>
        <em>${entry.cleared ? `CLEARED · ${entry.bestTime ? entry.bestTime.toFixed(1) + 's' : '—'}` : `${entry.attempts} percobaan · ${entry.deaths} mati`}</em>
      </button>`).join('');
  }
  const summaryEl = A.$('horror3d-summary');
  if (summaryEl) {
    summaryEl.textContent = `${summary.clearedSites}/${summary.totalSites} situs dibersihkan · ${summary.scares} jumpscare · ${summary.deaths} kematian${summary.bestTime ? ` · rekor ${summary.bestTime.toFixed(1)}s` : ''}`;
  }
  const select = A.$('horror3d-select');
  if (select && select.options.length !== HORROR3D_SITES.length) {
    select.innerHTML = HORROR3D_SITES.map((entry) => `
      <option value="${entry.id}">${entry.level} · ${entry.name} — ${entry.difficulty}</option>`).join('');
  }
  if (select) select.value = A.horror3DSiteId;
  const anti = A.$('horror3d-anti');
  if (anti) anti.checked = !!A.horror3D.settings.antiJumpscare;
  const intensity = A.$('horror3d-intensity');
  if (intensity) intensity.value = A.horror3D.settings.intensity;
}

function drain3DHorrorEvents() {
  if (!A.game3D) return;
  for (const event of A.game3D.drainHorrorEvents()) {
    if (event.type === 'horrorStart') {
      A.horror3D.lastSite = event.siteId;
      A.horror3D.lastResult = null;
      A.horror3DSiteId = event.siteId;
      A.save3DHorrorState();
    } else if (event.type === 'horrorCleared' || event.type === 'horrorDead') {
      const result = record3DHorrorResult(A.horror3D, {
        siteId: event.siteId,
        result: event.type === 'horrorCleared' ? 'cleared' : 'dead',
        time: event.time,
        scares: event.scares,
        phase: event.phase,
      });
      A.save3DHorrorState();
      buildHorror3DPanel();
      if (result.ok && result.unlocked.length) A.showToast(`PENCAPAIAN 3D SCARY · ${result.unlocked.join(' · ')}`, 3200);
    }
  }
}

function closeMode3D() {
  A.showMenu();
}

function mode3dFrame(raw) {
  A.game3D.update(raw, A.input3D);
  drain3DHorrorEvents();
  // Position the listener at the live camera and play world effects through
  // HRTF panners when spatial audio is enabled.
  {
    const cam3D = A.game3D.camera;
    const forwardX = cam3D.targetX - cam3D.x;
    const forwardY = cam3D.targetY - cam3D.y;
    const forwardZ = cam3D.targetZ - cam3D.z;
    const forwardLength = Math.hypot(forwardX, forwardY, forwardZ) || 1;
    A.audio.setListener(
      { x: cam3D.x, y: cam3D.y, z: cam3D.z },
      { x: forwardX / forwardLength, y: forwardY / forwardLength, z: forwardZ / forwardLength },
    );
    for (const soundEvent of A.game3D.drainSounds()) {
      A.audio.playAt(soundEvent.type, { x: soundEvent.x, y: soundEvent.y, z: soundEvent.z });
    }
  }
  const canvas3D = A.$('canvas-3d');
  if (canvas3D) {
    const ctx3D = canvas3D.getContext('2d');
    if (ctx3D) {
      render3D(ctx3D, A.game3D);
      // Scary Mode presents in 3D too: same effect data, camera-aware layer.
      const horror3D = A.horrorRenderLayer();
      if (horror3D) A.renderer.drawHorrorAtmosphere(ctx3D, horror3D, canvas3D.width, canvas3D.height);
      const scare3D = A.scareDirector?.active;
      if (scare3D) A.renderer.drawScareOverlay(ctx3D, scare3D, canvas3D.width, canvas3D.height);
    }
  }
  A.input3D.jumpJustPressed = false;
  A.input3D.attackJustPressed = false;
  A.input3D.dashJustPressed = false;
  A.input3D.interactJustPressed = false;
  A.input3D.lockOnJustPressed = false;
}

  A.applySettings({ persist: false });

  return { showMode3D, start3DHorrorRun, start3DHorror, restart3DHorror, buildHorror3DPanel, drain3DHorrorEvents, closeMode3D, mode3dFrame, lib: __lib0 };
}
