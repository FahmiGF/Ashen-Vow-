// Ashen Vow — 3D Mode Engine
// Module: src/mode3d.js
// A zero-dependency, pure JavaScript 3D Metroidvania simulation and Canvas renderer.
// Supports third-person camera, free 3D movement, traversal abilities, 3D combat,
// Thornveil Forest vertical slice (village, NPCs, 3 enemies, elite, boss),
// 3D Map Editor, Training Grounds, and Graphics Presets.

import { render3DScene, render3DHudOverlay } from './mode3d_visuals.js';
import { WebGL3D } from './webgl3d.js';
import { HORROR3D_SITES, HORROR3D_SITE_BY_ID, horror3DScenery } from './mode3d_horror.js';
import {
  MODE3D_AREAS,
  MODE3D_AREA_BY_ID,
  MODE3D_ELITES,
  MODE3D_BOSSES,
  MODE3D_VAULTS,
  MODE3D_DUNGEONS,
  MODE3D_RELICS,
  applyRelics,
  areaVault,
  contentSummary,
} from './mode3d_content.js';

export const MODE_3D_VERSION = '1.0.0';

export const MODE3D_REGIONS = {
  thornveil: {
    id: 'thornveil', name: 'Thornveil Forest', subtitle: 'Hutan Purba · Worldroot', weather: 'spores', scale: 1,
    sky: [[0, '#081318'], [0.4, '#17342f'], [0.72, '#3d5140'], [1, '#756348']], sun: [0.74, 0.2], sunColor: '#ffe5a3', sunGlow: 'rgba(255,229,163,0.72)', haze: 'rgba(214,237,196,0.28)',
    mountains: ['#14251f', '#1c3026', '#263c2c'], ground: '#39462f', groundFar: '#5f6541', groundNear: '#202717', path: '#8e7a52', pathFar: '#6f6245', rock: '#58604e',
    trunk: '#5b4329', trunkDark: '#35291b', trunkLight: '#87683d', canopy: '#315c38', canopyDark: '#1c3826', canopyLight: '#5e8e4e',
    accent: '#c9d47a', grass: '#6c7b45', wood: '#77552f', woodDark: '#3e2d1b', wall: '#b8a47a', thatch: '#8d6f3f', thatchDark: '#604b2a', door: '#3c2b19', glow: '#d8ff8a',
    stone: '#697064', stoneLight: '#98a08e', moss: '#6b7f48', crystal: '#9adf9a', fog: 'rgba(198,219,188,0.16)',
    landmarks: [
      { type: 'ruin', x: -300, z: 360, scale: 1.4 }, { type: 'ruin', x: 290, z: 720, scale: 1.1 },
      { type: 'crystal', x: -250, z: 880, scale: 1.2 }, { type: 'crystal', x: 260, z: 520, scale: 0.9 },
    ],
  },
  infernal: {
    id: 'infernal', name: 'Infernal Fortress', subtitle: 'Benteng Bara · Obsidian Keep', weather: 'embers', scale: 1.05,
    sky: [[0, '#120609'], [0.4, '#331013'], [0.72, '#6b2417'], [1, '#b95428']], sun: [0.25, 0.26], sunColor: '#ffb15c', sunGlow: 'rgba(255,121,54,0.68)', haze: 'rgba(255,134,78,0.22)',
    mountains: ['#210d10', '#351115', '#4b1717'], ground: '#302124', groundFar: '#54302b', groundNear: '#170f11', path: '#6b3b2e', pathFar: '#4d2a24', rock: '#5c3c36',
    trunk: '#3a2924', trunkDark: '#211413', trunkLight: '#6b4432', canopy: '#512319', canopyDark: '#2c1210', canopyLight: '#8b3720',
    accent: '#ff8447', grass: '#7c4a32', wood: '#563021', woodDark: '#2a1714', wall: '#4a3536', thatch: '#452726', thatchDark: '#251416', door: '#170d0e', glow: '#ff7a3d',
    stone: '#433336', stoneLight: '#7b5c58', moss: '#63382a', crystal: '#ff7b4a', fog: 'rgba(120,48,34,0.18)',
    landmarks: [
      { type: 'ruin', x: -260, z: 280, scale: 1.8 }, { type: 'ruin', x: 250, z: 390, scale: 2.1 }, { type: 'ruin', x: -210, z: 760, scale: 1.5 },
      { type: 'crystal', x: 260, z: 690, scale: 1.3 }, { type: 'bonfire', x: 0, z: 210, scale: 1.2 },
    ],
  },
  drowned: {
    id: 'drowned', name: 'Drowned Kingdom', subtitle: 'Kerajaan Tenggelam · Pale Tide', weather: 'rain', scale: 1,
    sky: [[0, '#07131c'], [0.4, '#123341'], [0.72, '#2d5b61'], [1, '#66867f']], sun: [0.7, 0.18], sunColor: '#d9f3ef', sunGlow: 'rgba(196,240,239,0.6)', haze: 'rgba(182,225,220,0.26)',
    mountains: ['#11262d', '#18343a', '#21464a'], ground: '#314943', groundFar: '#56706a', groundNear: '#172a29', path: '#778c7c', pathFar: '#5e7167', rock: '#4c625f',
    trunk: '#394b47', trunkDark: '#20302f', trunkLight: '#688279', canopy: '#2d5a55', canopyDark: '#183b3a', canopyLight: '#4d8379',
    accent: '#86d5c8', grass: '#4f7e6f', wood: '#4c5e54', woodDark: '#24352f', wall: '#7f938b', thatch: '#506b64', thatchDark: '#314744', door: '#1b2b29', glow: '#8de5d5',
    stone: '#526e6b', stoneLight: '#8ba7a1', moss: '#3f796a', crystal: '#91e6dc', fog: 'rgba(138,192,188,0.24)',
    landmarks: [
      { type: 'ruin', x: -280, z: 310, scale: 1.6 }, { type: 'ruin', x: 240, z: 560, scale: 1.3 }, { type: 'platform', x: -60, y: 50, z: 320, w: 90, d: 42, scale: 1 },
      { type: 'crystal', x: 180, z: 860, scale: 1.4 },
    ],
  },
  gothic: {
    id: 'gothic', name: 'Gothic Citadel', subtitle: 'Kastel Gotik · Bellfall', weather: 'ash', scale: 1.1,
    sky: [[0, '#0b0c12'], [0.4, '#1d2232'], [0.72, '#3b4057'], [1, '#6c6b78']], sun: [0.78, 0.15], sunColor: '#e7e3db', sunGlow: 'rgba(230,228,221,0.5)', haze: 'rgba(198,204,218,0.2)',
    mountains: ['#141622', '#1c2030', '#282d3d'], ground: '#30333c', groundFar: '#5d606b', groundNear: '#171920', path: '#6d6b70', pathFar: '#565761', rock: '#545662',
    trunk: '#3a3331', trunkDark: '#211d1d', trunkLight: '#69605b', canopy: '#36453a', canopyDark: '#213027', canopyLight: '#60785c',
    accent: '#d3c39b', grass: '#5e6552', wood: '#57442f', woodDark: '#2b2119', wall: '#9a948b', thatch: '#5b4d43', thatchDark: '#352c27', door: '#17161b', glow: '#d6c38d',
    stone: '#595a65', stoneLight: '#999aa2', moss: '#596153', crystal: '#d9d1f1', fog: 'rgba(157,163,179,0.16)',
    landmarks: [
      { type: 'ruin', x: -300, z: 250, scale: 2.2 }, { type: 'ruin', x: -280, z: 520, scale: 2.8 }, { type: 'ruin', x: 290, z: 360, scale: 2.4 },
      { type: 'ruin', x: 310, z: 690, scale: 2.1 }, { type: 'totem', x: 0, z: 260, scale: 1 },
    ],
  },
  crystal: {
    id: 'crystal', name: 'Crystal Caverns', subtitle: 'Gua Kristal · Singing Deep', weather: 'spores', scale: 0.96,
    sky: [[0, '#080b1a'], [0.4, '#171d3a'], [0.72, '#343c68'], [1, '#7079a5']], sun: [0.35, 0.12], sunColor: '#d7e2ff', sunGlow: 'rgba(169,206,255,0.65)', haze: 'rgba(172,203,255,0.22)',
    mountains: ['#13152a', '#1a1d38', '#252a4a'], ground: '#2b2c42', groundFar: '#50516d', groundNear: '#161725', path: '#6e6e8b', pathFar: '#52536f', rock: '#4f5070',
    trunk: '#3e3045', trunkDark: '#211a27', trunkLight: '#77618c', canopy: '#4b3b6b', canopyDark: '#2a203f', canopyLight: '#8370b2',
    accent: '#c6b6ff', grass: '#5f5b83', wood: '#5b4564', woodDark: '#2f2437', wall: '#807b9d', thatch: '#55465f', thatchDark: '#30283a', door: '#1a1522', glow: '#c6e8ff',
    stone: '#515270', stoneLight: '#9a99b8', moss: '#71648f', crystal: '#bde9ff', fog: 'rgba(142,158,208,0.2)',
    landmarks: [
      { type: 'crystal', x: -270, z: 260, scale: 2.4 }, { type: 'crystal', x: 260, z: 300, scale: 1.8 }, { type: 'crystal', x: -220, z: 690, scale: 2.1 },
      { type: 'crystal', x: 250, z: 760, scale: 2.6 }, { type: 'ruin', x: 0, z: 430, scale: 1.2 },
    ],
  },
  astral: {
    id: 'astral', name: 'Astral Islands', subtitle: 'Pulau Astral · Veil Edge', weather: 'ash', scale: 1,
    sky: [[0, '#090717'], [0.35, '#211438'], [0.68, '#56346f'], [1, '#b186b9']], sun: [0.58, 0.16], sunColor: '#f3d8ff', sunGlow: 'rgba(235,183,255,0.7)', haze: 'rgba(228,189,240,0.24)',
    mountains: ['#1a122d', '#23183d', '#34204f'], ground: '#38304f', groundFar: '#6c5b84', groundNear: '#1e172f', path: '#8b79a4', pathFar: '#6a5c81', rock: '#63567e',
    trunk: '#4e3f5f', trunkDark: '#2a2138', trunkLight: '#8a709c', canopy: '#574b8d', canopyDark: '#302850', canopyLight: '#9b8fd3',
    accent: '#f0c8ff', grass: '#7968a0', wood: '#5d456f', woodDark: '#302239', wall: '#8e80a3', thatch: '#5d4b72', thatchDark: '#32263f', door: '#1b1526', glow: '#f2b7ff',
    stone: '#62577d', stoneLight: '#a69cbd', moss: '#7e6a9d', crystal: '#e9b9ff', fog: 'rgba(194,158,212,0.2)',
    landmarks: [
      { type: 'crystal', x: -280, z: 300, scale: 2.2 }, { type: 'ruin', x: 260, z: 430, scale: 1.9 }, { type: 'crystal', x: -210, z: 760, scale: 1.7 }, { type: 'totem', x: 180, z: 220, scale: 1.2 },
    ],
  },
};

export const MODE3D_REGION_LIST = Object.values(MODE3D_REGIONS);

// ── 1. MATH & 3D PROJECTION HELPERS ─────────────────────────────────────────
export function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function dist3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function project3D(point, camera, fov = 480, viewW = 960, viewH = 540) {
  // Translate relative to camera
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const dz = point.z - camera.z;

  // Rotate by camera yaw (horizontal)
  const cosY = Math.cos(-camera.yaw);
  const sinY = Math.sin(-camera.yaw);
  const x1 = dx * cosY - dz * sinY;
  const z1 = dx * sinY + dz * cosY;

  // Rotate by camera pitch (vertical)
  const cosP = Math.cos(-camera.pitch);
  const sinP = Math.sin(-camera.pitch);
  const y2 = dy * cosP - z1 * sinP;
  const z2 = dy * sinP + z1 * cosP;

  // Behind camera clip
  if (z2 <= 2) return null;

  const scale = fov / z2;
  return {
    sx: viewW / 2 + x1 * scale,
    sy: viewH / 2 - y2 * scale, // Canvas Y is inverted
    depth: z2,
    scale,
  };
}

// ── 2. 3D GAME STATE & ENTITIES ─────────────────────────────────────────────
export class Ashen3DGame {
  constructor(options = {}) {
    this.viewW = options.viewW || 960;
    this.viewH = options.viewH || 540;
    this.subMode = options.subMode || 'campaign'; // campaign, exploration, boss_rush, training, editor
    this.quality = options.quality || 'high'; // low, medium, high, ultra
    this.region = MODE3D_REGIONS[options.region] ? options.region : 'thornveil';
    this.visualSettings = { brightness: 100, contrast: 100, gamma: 100, ...(options.visualSettings || {}) };
    this.hudSettings = { showHealth: true, showStamina: true, showBoss: true, showDamageNumbers: true, showEnemyHealth: true, showCrosshair: true, ...(options.hudSettings || {}) };
    this.cameraSensitivity = options.cameraSensitivity || 1;

    this.player = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      radius: 18,
      height: 48,
      yaw: 0,
      hp: 120,
      maxHp: 120,
      stamina: 100,
      maxStamina: 100,
      poise: 100,
      maxPoise: 100,
      isGrounded: true,
      isSprinting: false,
      isGliding: false,
      isSwimming: false,
      isClimbing: false,
      isRiding: false,
      jumpCount: 0,
      maxJumps: 2,
      dodgeTimer: 0,
      attackState: 'idle', // idle, light1, light2, light3, heavy, charged, parry, block
      attackTimer: 0,
      abilityCooldowns: { 1: 0, 2: 0, 3: 0, 4: 0 },
      lockOnTarget: null,
      traversal: {
        doubleJump: true,
        wallGrip: true,
        airDash: true,
        glider: true,
        waterBreathing: true,
      },
    };

    this.camera = {
      x: 0,
      y: 60,
      z: -120,
      targetX: 0,
      targetY: 24,
      targetZ: 0,
      distance: 140,
      yaw: 0,
      pitch: 0.22,
      fov: 460,
      shake: 0,
      sensitivity: 0.0035,
    };

    this.npcs = [
      { id: 'elder_tova', name: 'Elder Tova', title: 'Tetua Suku Thornveil', x: 40, y: 0, z: 80, role: 'Chief', dialogue: 'Selamat datang di bawah naungan Pohon Dunia, Penjaga Sumpah. Bahaya mengintai di balik dahan purba.' },
      { id: 'scout_rian', name: 'Scout Rian', title: 'Pengintai Rimba', x: -60, y: 0, z: 120, role: 'Scout', dialogue: 'Kawanan Thornveil Alpha terpantau di lereng barat. Berhati-hatilah dengan sergapan dari atas dahan!' },
      { id: 'shaman_lyra', name: 'Shaman Lyra', title: 'Dukun Akar Roh', x: 90, y: 0, z: 160, role: 'Healer', dialogue: 'Akar Yggvar sedang resah. Ambillah berkah getah suci ini untuk memperkuat pertahananmu.' },
    ];

    this.enemies = [
      { id: 'prowler_1', type: 'forest_prowler', name: 'Forest Prowler', x: -140, y: 0, z: 280, hp: 120, maxHp: 120, poise: 40, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 24 },
      { id: 'prowler_2', type: 'forest_prowler', name: 'Forest Prowler', x: 120, y: 0, z: 320, hp: 120, maxHp: 120, poise: 40, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 24 },
      { id: 'beetle_1', type: 'spore_beetle', name: 'Spore Beetle', x: -80, y: 0, z: 420, hp: 180, maxHp: 180, poise: 70, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 28 },
      { id: 'stalker_1', type: 'bramble_stalker', name: 'Bramble Stalker', x: 80, y: 0, z: 480, hp: 220, maxHp: 220, poise: 60, state: 'patrol', target: null, attackCd: 0, telegraph: 0, radius: 26 },
    ];

    this.elite = {
      id: 'thornveil_alpha',
      name: 'Thornveil Alpha (E3 Champion)',
      rank: 'E3',
      x: 0,
      y: 0,
      z: 620,
      hp: 680,
      maxHp: 680,
      poise: 160,
      maxPoise: 160,
      state: 'idle',
      attackCd: 0,
      telegraph: 0,
      radius: 36,
      color: '#f77f00',
    };

    this.boss = {
      id: 'elder_yggvar_3d',
      name: 'Elder Yggvar, the Worldroot Colossus',
      title: 'Living Heart of the World-Tree',
      x: 0,
      y: 0,
      z: 950,
      hp: 1800,
      maxHp: 1800,
      poise: 300,
      phase: 1,
      state: 'dormant',
      attackTimer: 0,
      radius: 64,
      height: 120,
      color: '#70e000',
    };

    this.scenery = this.generateScenery();
    this.horror = null;
    this.firstPerson = false;
    this.horrorEvents = [];
    this.particles = [];
    this.damageNumbers = [];
    this.activeDialogue = null;
    this.toast = null;
    this.toastTimer = 0;

    // ── Update X: content pack, relics, vaults, audio events ──
    this.clock3D = 0;
    this.areas = MODE3D_AREAS;
    this.areaId = 'thornveil_heart';
    this.area = MODE3D_AREA_BY_ID[this.areaId] || null;
    this.dungeons = MODE3D_DUNGEONS;
    this.relics = [];
    this.modifiers = applyRelics(this.relics);
    this.echoes = 0;
    this.vault = areaVault(this.areaId) ? { ...areaVault(this.areaId), collected: false } : null;
    this.soundEvents = [];
    this.applyRelicStats();
  }

  // Relic effects are real: max HP, damage and speed read from this.modifiers.
  recomputeModifiers() {
    this.modifiers = applyRelics(this.relics);
    this.applyRelicStats();
  }

  applyRelicStats() {
    const baseHp = 120;
    const maxHp = Math.round(baseHp * this.modifiers.maxHp);
    const ratio = this.player.maxHp ? this.player.hp / this.player.maxHp : 1;
    this.player.maxHp = maxHp;
    this.player.hp = Math.max(1, Math.min(maxHp, Math.round(maxHp * ratio)));
    this.player.maxStamina = Math.round(100 * this.modifiers.stamina);
    this.player.stamina = Math.min(this.player.stamina, this.player.maxStamina);
  }

  pickRelic(relicId) {
    if (!MODE3D_RELICS.some((relic) => relic.id === relicId)) return false;
    if (this.relics.includes(relicId)) return false;
    this.relics.push(relicId);
    this.recomputeModifiers();
    this.emitSound('relic', this.player.x, this.player.y + 20, this.player.z);
    return true;
  }

  emitSound(type, x, y, z) {
    this.soundEvents.push({ type, x, y, z, at: this.clock3D });
    if (this.soundEvents.length > 24) this.soundEvents.shift();
  }

  drainSounds() {
    const events = this.soundEvents;
    this.soundEvents = [];
    return events;
  }

  // Loads one of the ten authored areas: region, hazards, enemy line-up, elite,
  // boss and vault all come from src/mode3d_content.js.
  setArea(areaId) {
    const area = MODE3D_AREA_BY_ID[areaId];
    if (!area) return false;
    this.horror = null;
    this.firstPerson = false;
    this.areaId = areaId;
    this.area = area;
    if (area.region && MODE3D_REGIONS[area.region]) this.setRegion(area.region);

    const specs = {
      forest_prowler: { name: 'Forest Prowler', hp: 120, radius: 24, poise: 40 },
      spore_beetle: { name: 'Spore Beetle', hp: 180, radius: 28, poise: 70 },
      bramble_stalker: { name: 'Bramble Stalker', hp: 220, radius: 26, poise: 60 },
    };
    this.enemies = area.enemies.map((type, index) => {
      const spec = specs[type] || specs.forest_prowler;
      const spread = area.enemies.length > 1 ? index / (area.enemies.length - 1) : 0.5;
      return {
        id: `${type}_${index}`,
        type,
        name: spec.name,
        x: -160 + spread * 320,
        y: 0,
        z: 260 + index * 90,
        hp: spec.hp,
        maxHp: spec.hp,
        poise: spec.poise,
        state: 'patrol',
        target: null,
        attackCd: 0,
        telegraph: 0,
        radius: spec.radius,
      };
    });

    const eliteDef = area.elite ? MODE3D_ELITES.find((entry) => entry.id === area.elite) : null;
    this.elite = eliteDef
      ? {
          id: eliteDef.id,
          name: `${eliteDef.name} (${eliteDef.rank})`,
          rank: eliteDef.rank,
          x: 0,
          y: 0,
          z: 620,
          hp: eliteDef.hp,
          maxHp: eliteDef.hp,
          poise: eliteDef.poise,
          maxPoise: eliteDef.poise,
          state: 'idle',
          attackCd: 0,
          telegraph: 0,
          radius: 36,
          color: '#f77f00',
          model: eliteDef.model,
          tint: eliteDef.tint,
          modifier: eliteDef.modifier,
        }
      : null;

    const bossDef = area.boss ? MODE3D_BOSSES.find((entry) => entry.id === area.boss) : null;
    if (bossDef) {
      this.boss = {
        id: bossDef.id,
        name: bossDef.name,
        title: bossDef.title,
        x: 0,
        y: 0,
        z: 950,
        hp: bossDef.hp,
        maxHp: bossDef.hp,
        poise: 300,
        phase: 1,
        phases: bossDef.phases,
        state: 'dormant',
        attackTimer: 0,
        radius: 64,
        height: 120,
        color: '#70e000',
        model: bossDef.model,
        tint: bossDef.tint,
      };
    } else if (!area.boss) {
      this.boss = null;
    }

    const vault = areaVault(areaId);
    this.vault = vault ? { ...vault, collected: false } : null;
    this.showToast(`${area.name} — ${area.subtitle}`, 2400);
    this.emitSound('roomEnter', 0, 20, 0);
    return true;
  }

  // ── Update XVII: 3D Scary Mode ─────────────────────────────────────────
  startHorrorSite(siteId, options = {}) {
    const site = HORROR3D_SITE_BY_ID[siteId];
    if (!site || !this.setArea(site.areaId)) return null;
    this.subMode = 'scary';
    this.scenery = horror3DScenery(siteId);
    this.npcs = [];
    this.elite = null;
    this.boss = null;
    this.vault = null;
    const entity = {
      id: `horror_${site.id}`,
      type: 'bramble_stalker',
      name: site.entity.name,
      title: site.entity.title,
      x: 0,
      y: 0,
      z: 520,
      hp: 99999,
      maxHp: 99999,
      poise: 99999,
      maxPoise: 99999,
      state: 'dormant',
      target: null,
      attackCd: 0,
      telegraph: 0,
      radius: 32,
      speed: site.entity.speed,
      damage: site.entity.damage,
      stagger: 0,
      unkillable: true,
      horror: true,
      tint: site.entity.tint,
      model: site.entity.model,
    };
    this.enemies = [entity];
    this.firstPerson = true;
    const p = this.player;
    p.x = 0;
    p.y = 0;
    p.z = 0;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.hp = p.maxHp;
    p.stamina = p.maxStamina;
    p.lockOnTarget = null;
    p.attackState = 'idle';
    this.camera.x = 0;
    this.camera.y = 54;
    this.camera.z = 0;
    this.camera.yaw = 0;
    this.camera.pitch = 0.04;
    this.camera.shake = 0;
    this.horror = {
      active: true,
      siteId: site.id,
      site,
      phaseIndex: 0,
      phaseTitle: site.phases[0].title,
      collected: [],
      fear: 0,
      sanity: 100,
      elapsed: 0,
      scares: 0,
      scare: null,
      scareTimer: 0,
      huntCooldown: 6,
      entity,
      antiJumpscare: !!options.antiJumpscare,
      intensity: options.intensity || 'full',
      completed: false,
      dead: false,
      result: null,
      exit: site.exit,
    };
    this.triggerHorrorScare(site.scares[0]);
    this.emitHorrorEvent({ type: 'horrorStart', siteId: site.id, name: site.name });
    this.emitSound('horrorSiteEnter', 0, 20, 0);
    this.showToast(`${site.name} · ${site.difficulty}`, 2800);
    return this.horror;
  }

  drainHorrorEvents() {
    const events = this.horrorEvents;
    this.horrorEvents = [];
    return events;
  }

  emitHorrorEvent(event) {
    this.horrorEvents.push({ ...event, at: this.clock3D });
    if (this.horrorEvents.length > 48) this.horrorEvents.shift();
  }

  triggerHorrorScare(scare, overrides = {}) {
    const h = this.horror;
    if (!h || !scare) return null;
    const anti = h.antiJumpscare || overrides.antiJumpscare;
    const duration = anti ? 1.6 : 2.4;
    h.scare = {
      id: scare.id,
      shape: anti ? 'atmospheric' : scare.shape,
      line: scare.line,
      timer: duration,
      duration,
      flash: anti ? 0 : (h.intensity === 'reduced' ? 0.22 : 0.48),
      antiJumpscare: anti,
    };
    h.scareTimer = duration;
    h.scares += 1;
    this.camera.shake = Math.max(this.camera.shake, anti ? 0.25 : 0.9);
    this.emitSound(anti ? 'horrorWhisper' : 'horrorSting', this.player.x, this.player.y + 20, this.player.z);
    this.emitHorrorEvent({ type: 'horrorScare', siteId: h.siteId, scareId: scare.id });
    return h.scare;
  }

  updateHorrorCamera(dt, input = {}) {
    const p = this.player;
    const c = this.camera;
    if (input.lookX) c.yaw += input.lookX * c.sensitivity * this.cameraSensitivity;
    if (input.lookY) c.pitch = clamp(c.pitch + input.lookY * c.sensitivity * this.cameraSensitivity, -0.7, 0.7);
    c.x = p.x;
    c.y = p.y + 54;
    c.z = p.z;
    c.targetX = p.x + Math.sin(c.yaw) * 120;
    c.targetY = p.y + 54 + Math.sin(c.pitch) * 120;
    c.targetZ = p.z + Math.cos(c.yaw) * 120;
    p.yaw = c.yaw;
    if (c.shake > 0) {
      c.x += (Math.random() - 0.5) * c.shake * 8;
      c.y += (Math.random() - 0.5) * c.shake * 8;
      c.shake = Math.max(0, c.shake - dt * 2.2);
    }
  }

  updateHorror(dt, input = {}) {
    const h = this.horror;
    if (!h || !h.active) return;
    const p = this.player;
    const e = h.entity;
    h.elapsed += dt;
    if (h.scareTimer > 0) {
      h.scareTimer = Math.max(0, h.scareTimer - dt);
      if (h.scareTimer <= 0) h.scare = null;
    }
    h.huntCooldown = Math.max(0, h.huntCooldown - dt);

    const nearbyEcho = h.site.echoes.find((echo) => !h.collected.includes(echo.id) && dist3D(p, echo) < 62);
    if (nearbyEcho && input.interactJustPressed) {
      h.collected.push(nearbyEcho.id);
      const marker = this.scenery.find((item) => item.echoId === nearbyEcho.id);
      if (marker) marker.collected = true;
      this.spawnParticleRing(nearbyEcho.x, 20, nearbyEcho.z, h.site.palette.glow, 22);
      this.emitSound('relic', nearbyEcho.x, 20, nearbyEcho.z);
      this.emitHorrorEvent({ type: 'horrorEcho', siteId: h.siteId, echoId: nearbyEcho.id, count: h.collected.length });
      if (h.collected.length === 1) this.triggerHorrorScare(h.site.scares[1]);
      if (h.collected.length === 2) this.triggerHorrorScare(h.site.scares[2]);
      this.showToast(`${nearbyEcho.label} · ${h.collected.length}/3`, 1600);
    }

    h.phaseIndex = h.collected.length >= 3 ? 2 : h.collected.length >= 1 ? 1 : 0;
    h.phaseTitle = h.site.phases[h.phaseIndex].title;
    h.sanity = Math.max(0, 100 - h.fear);

    if (h.phaseIndex >= 1) {
      e.state = 'chase';
      const d = dist3D(p, e);
      const speed = e.speed * (h.phaseIndex === 2 ? 1.22 : 1);
      if (e.stagger > 0) {
        e.stagger = Math.max(0, e.stagger - dt);
      } else if (d < 900) {
        const dx = p.x - e.x;
        const dz = p.z - e.z;
        const n = Math.hypot(dx, dz) || 1;
        e.x += (dx / n) * speed * dt;
        e.z += (dz / n) * speed * dt;
      }
      e.attackCd += dt;
      if (d < 44 && e.attackCd >= 1.8) {
        e.attackCd = 0;
        p.hp = Math.max(0, p.hp - e.damage);
        h.fear = Math.min(100, h.fear + 18);
        this.addDamageNumber(p.x, p.y + 40, p.z, e.damage, '#e63946');
        this.camera.shake = 1.1;
        this.emitSound('horrorHit', p.x, p.y + 20, p.z);
        this.emitHorrorEvent({ type: 'horrorHit', siteId: h.siteId, hp: p.hp });
        if (p.hp <= 0) {
          this.finishHorror('dead');
          return;
        }
      }
      if (d < 150 && h.huntCooldown <= 0) {
        h.huntCooldown = 13;
        this.triggerHorrorScare(h.site.scares[3]);
      }
    } else {
      e.state = 'dormant';
      e.attackCd = 0;
    }

    h.fear = clamp(h.fear + (dist3D(p, e) < 300 && h.phaseIndex >= 1 ? 5 * dt : -4 * dt), 0, 100);
    h.sanity = Math.max(0, 100 - h.fear);

    if (h.phaseIndex === 2 && dist3D(p, h.site.exit) < 68) this.finishHorror('cleared');
  }

  finishHorror(result) {
    const h = this.horror;
    if (!h || !h.active) return false;
    h.active = false;
    h.result = result;
    h.completed = result === 'cleared';
    h.dead = result === 'dead';
    h.elapsed = Math.round(h.elapsed * 10) / 10;
    if (result === 'cleared') {
      this.showToast(`KELUAR HIDUP · ${h.site.name} · ${h.elapsed.toFixed(1)}s`, 3600);
      this.emitSound('victory', this.player.x, this.player.y + 20, this.player.z);
    } else {
      this.showToast(`THE UNLIT MENEMUKANMU · ${h.site.name}`, 3600);
      this.emitSound('death', this.player.x, this.player.y + 20, this.player.z);
    }
    this.emitHorrorEvent({
      type: result === 'cleared' ? 'horrorCleared' : 'horrorDead',
      siteId: h.siteId,
      result,
      time: h.elapsed,
      scares: h.scares,
      phase: h.phaseIndex,
    });
    return true;
  }

  horrorSnapshot() {
    const h = this.horror;
    if (!h) return null;
    return {
      active: h.active, siteId: h.siteId, name: h.site.name, areaId: this.areaId, phase: h.phaseIndex,
      phaseTitle: h.phaseTitle, collected: h.collected.length, echoes: h.site.echoes.length,
      fear: Math.round(h.fear), sanity: Math.round(h.sanity), scares: h.scares,
      elapsed: h.elapsed, result: h.result, firstPerson: this.firstPerson,
      entityName: h.entity.name,
      entityDistance: Math.round(dist3D(this.player, h.entity)),
      scare: h.scare ? { shape: h.scare.shape, line: h.scare.line, flash: h.scare.flash } : null,
    };
  }

  setRegion(regionId) {
    if (!MODE3D_REGIONS[regionId]) return false;
    this.region = regionId;
    this.scenery = this.generateScenery();
    this.player.x = 0;
    this.player.z = 0;
    this.player.y = 0;
    this.camera.x = 0;
    this.camera.z = -120;
    this.camera.yaw = 0;
    return true;
  }

  generateScenery() {
    if (this.region !== 'thornveil') {
      const list = [];
      const trees = [[-180, 100], [180, 150], [-230, 340], [220, 390], [-190, 620], [210, 660], [-240, 880], [230, 900]];
      for (const [x, z] of trees) list.push({ type: this.region === 'crystal' ? 'crystal' : 'worldtree', x, y: 0, z, radius: 36, height: 190, color: '#41513f' });
      for (const [x, z, type] of [[-90, 250, 'ruin'], [110, 560, 'ruin'], [-130, 760, 'crystal'], [120, 820, 'crystal'], [0, 460, 'totem']]) {
        list.push({ type, x, y: 0, z, radius: 24, height: 70, w: 70, d: 36, color: '#6b5f4d' });
      }
      return list;
    }
    const list = [];
    // Tribal Village Huts
    list.push({ type: 'hut', x: 30, y: 0, z: 90, radius: 36, color: '#8d6e63' });
    list.push({ type: 'hut', x: -70, y: 0, z: 130, radius: 32, color: '#8d6e63' });
    list.push({ type: 'hut', x: 100, y: 0, z: 170, radius: 34, color: '#8d6e63' });
    // Village Bonfire
    list.push({ type: 'bonfire', x: 0, y: 0, z: 110, radius: 14, color: '#ff7043' });

    // Towering Ancient World-Trees
    const treePositions = [
      { x: -180, z: 60 }, { x: 190, z: 70 }, { x: -220, z: 240 }, { x: 210, z: 260 },
      { x: -160, z: 400 }, { x: 180, z: 420 }, { x: -240, z: 580 }, { x: 230, z: 600 },
      { x: -150, z: 780 }, { x: 160, z: 800 }, { x: -200, z: 920 }, { x: 220, z: 940 },
    ];
    for (const pos of treePositions) {
      list.push({ type: 'worldtree', x: pos.x, y: 0, z: pos.z, radius: 45, height: 260, color: '#2d6a4f' });
    }

    // Platforms & Rope Bridges
    list.push({ type: 'platform', x: -60, y: 50, z: 320, w: 80, d: 40, color: '#795548' });
    list.push({ type: 'platform', x: 70, y: 70, z: 460, w: 90, d: 45, color: '#795548' });
    list.push({ type: 'totem', x: -40, y: 0, z: 520, radius: 12, height: 70, color: '#ffb703' });
    list.push({ type: 'totem', x: 40, y: 0, z: 520, radius: 12, height: 70, color: '#ffb703' });

    return list;
  }

  // ── UPDATE LOOP ───────────────────────────────────────────────────────────
  update(dt, input = {}) {
    dt = clamp(dt, 0.001, 0.05);
    this.clock3D += dt;

    if (this.horror) {
      if (this.horror.active) {
        this.updatePlayer(dt, input);
        this.updateHorrorCamera(dt, input);
        this.updateHorror(dt, input);
      }
      this.updateParticles(dt);
      this.updateDamageNumbers(dt);
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) this.toast = null;
      }
      return;
    }

    this.updatePlayer(dt, input);
    this.updateCamera(dt, input);
    this.updateEnemies(dt);
    this.updateParticles(dt);
    this.updateDamageNumbers(dt);
    this.updateVault();

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast = null;
    }
  }

  updatePlayer(dt, input) {
    const p = this.player;
    if (this.horror?.active) p.yaw = this.camera.yaw;

    // Movement relative to camera yaw
    let moveX = 0;
    let moveZ = 0;
    if (input.up) moveZ += 1;
    if (input.down) moveZ -= 1;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    p.isSprinting = !!input.sprint && p.stamina > 10;

    let speed = 90;
    if (p.isSprinting) {
      speed = 160;
      p.stamina = Math.max(0, p.stamina - dt * 15);
    } else {
      p.stamina = Math.min(p.maxStamina, p.stamina + dt * 25);
    }

    if (p.isRiding) speed *= 1.7;

    if (len > 0) {
      const normX = moveX / len;
      const normZ = moveZ / len;

      // Rotate with camera yaw
      const cosY = Math.cos(this.camera.yaw);
      const sinY = Math.sin(this.camera.yaw);
      const worldMoveX = normX * cosY + normZ * sinY;
      const worldMoveZ = -normX * sinY + normZ * cosY;

      p.vx = worldMoveX * speed;
      p.vz = worldMoveZ * speed;
      p.yaw = Math.atan2(worldMoveX, worldMoveZ);
    } else {
      p.vx *= 0.82;
      p.vz *= 0.82;
    }

    // Traversal: Jump & Double Jump
    if (input.jumpJustPressed) {
      if (p.isGrounded) {
        p.vy = 220;
        p.isGrounded = false;
        p.jumpCount = 1;
        this.spawnParticleRing(p.x, p.y, p.z, '#a7c957', 8);
      } else if (p.traversal.doubleJump && p.jumpCount === 1) {
        p.vy = 190;
        p.jumpCount = 2;
        this.spawnParticleRing(p.x, p.y + 10, p.z, '#64dfdf', 12);
      }
    }

    // Traversal: Glider (hold jump while falling)
    if (input.jump && !p.isGrounded && p.vy < 0 && p.traversal.glider) {
      p.isGliding = true;
      p.vy = Math.max(-40, p.vy + dt * 300); // slow glide descent
      p.vx *= 1.15;
      p.vz *= 1.15;
    } else {
      p.isGliding = false;
    }

    // Traversal: Air Dash
    if (input.dashJustPressed && p.traversal.airDash && p.stamina >= 20) {
      p.stamina -= 20;
      const dashSpeed = 380;
      p.vx = Math.sin(p.yaw) * dashSpeed;
      p.vz = Math.cos(p.yaw) * dashSpeed;
      this.spawnParticleRing(p.x, p.y + 16, p.z, '#48cae4', 16);
    }

    // Gravity
    if (!p.isGrounded) {
      p.vy -= 480 * dt;
    }

    // Apply Velocity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;

    // Floor collision
    const floorY = 0;
    if (p.y <= floorY) {
      p.y = floorY;
      p.vy = 0;
      p.isGrounded = true;
      p.jumpCount = 0;
    }

    // World Boundary clamps
    p.x = clamp(p.x, -300, 300);
    p.z = clamp(p.z, -80, 1100);

    // Combat: Light attack combo
    if (input.attackJustPressed && p.attackState === 'idle') {
      p.attackState = 'light1';
      p.attackTimer = 0.32;
      this.execute3DAttack('light', 38);
    }

    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) {
        p.attackState = 'idle';
      }
    }

    // NPC Proximity Check
    let nearNpc = null;
    for (const npc of this.npcs) {
      const d = dist3D(p, npc);
      if (d < 50) {
        nearNpc = npc;
        break;
      }
    }
    if (nearNpc && input.interactJustPressed) {
      this.activeDialogue = {
        name: nearNpc.name,
        title: nearNpc.title,
        text: nearNpc.dialogue,
      };
    } else if (!nearNpc) {
      this.activeDialogue = null;
    }

    // Lock-on Cycling (Tab / Q)
    if (input.lockOnJustPressed) {
      if (p.lockOnTarget) {
        p.lockOnTarget = null;
      } else {
        const potential = [...this.enemies, this.elite, this.boss].filter((e) => e && e.hp > 0);
        potential.sort((a, b) => dist3D(p, a) - dist3D(p, b));
        if (potential.length > 0 && dist3D(p, potential[0]) < 380) {
          p.lockOnTarget = potential[0];
        }
      }
    }
  }

  execute3DAttack(type, damage) {
    const p = this.player;
    const hitAngle = p.yaw;
    const reach = 55;

    // Hitbox sphere forward of player
    const hx = p.x + Math.sin(hitAngle) * reach * 0.7;
    const hy = p.y + 18;
    const hz = p.z + Math.cos(hitAngle) * reach * 0.7;

    const targets = [...this.enemies, this.elite, this.boss];
    let hitCount = 0;

    for (const target of targets) {
      if (!target || target.hp <= 0) continue;
      const d = dist3D({ x: hx, y: hy, z: hz }, target);
      if (d <= reach + (target.radius || 20)) {
        const crit = Math.random() < this.modifiers.crit;
        if (target.unkillable) {
          target.stagger = 1.2;
          this.emitSound('hit', target.x, target.y + 20, target.z);
          this.addDamageNumber(target.x, target.y + 40, target.z, 0, '#d9c6ff');
          this.camera.shake = 0.5;
          hitCount++;
          continue;
        }
        const finalDamage = Math.max(1, Math.round(damage * this.modifiers.damage * (crit ? 1.6 : 1)));
        target.hp = Math.max(0, target.hp - finalDamage);
        target.poise = Math.max(0, (target.poise || 50) - 25);
        if (this.modifiers.lifesteal > 0) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + finalDamage * this.modifiers.lifesteal);
        }
        this.emitSound('hit', target.x, target.y + 20, target.z);
        this.addDamageNumber(target.x, target.y + 40, target.z, finalDamage, crit ? '#ffd166' : '#ffffff');
        this.spawnParticleRing(target.x, target.y + 20, target.z, '#ff0054', 10);
        this.camera.shake = 0.4;
        hitCount++;

        if (target.hp <= 0) {
          this.showToast(`${target.name} dikalahkan!`, 2000);
          this.spawnParticleRing(target.x, target.y + 30, target.z, '#ffd166', 24);
        }
      }
    }
  }

  updateCamera(dt, input) {
    const p = this.player;
    const c = this.camera;

    // Mouse / Analog look
    if (input.lookX) c.yaw += input.lookX * c.sensitivity * this.cameraSensitivity;
    if (input.lookY) c.pitch = clamp(c.pitch + input.lookY * c.sensitivity * this.cameraSensitivity, -0.4, 0.7);

    // If lock-on active, orient camera to face between player and target
    if (p.lockOnTarget && p.lockOnTarget.hp > 0) {
      const dx = p.lockOnTarget.x - p.x;
      const dz = p.lockOnTarget.z - p.z;
      const targetYaw = Math.atan2(dx, dz);
      c.yaw += (targetYaw - c.yaw) * 0.1;
    }

    // Desired camera position behind player
    const camDist = c.distance;
    const cx = p.x - Math.sin(c.yaw) * Math.cos(c.pitch) * camDist;
    const cy = p.y + 30 + Math.sin(c.pitch) * camDist;
    const cz = p.z - Math.cos(c.yaw) * Math.cos(c.pitch) * camDist;

    // Smooth lerp
    c.x += (cx - c.x) * 0.15;
    c.y += (Math.max(12, cy) - c.y) * 0.15;
    c.z += (cz - c.z) * 0.15;

    // Keep the camera inside the playable volume and push it out of the largest
    // tree trunks instead of clipping through the world.
    c.x = clamp(c.x, -360, 360);
    c.y = Math.max(10, c.y);
    c.z = clamp(c.z, -120, 1160);
    for (const item of this.scenery) {
      if (item.type !== 'worldtree' && item.type !== 'hut') continue;
      const dx = c.x - item.x;
      const dz = c.z - item.z;
      const safe = (item.radius || 30) * 0.85;
      const dist = Math.hypot(dx, dz);
      if (dist < safe && dist > 0.001) {
        c.x = item.x + (dx / dist) * safe;
        c.z = item.z + (dz / dist) * safe;
      }
    }

    c.targetX = p.x;
    c.targetY = p.y + 24;
    c.targetZ = p.z;

    if (c.shake > 0) {
      c.x += (Math.random() - 0.5) * c.shake * 8;
      c.y += (Math.random() - 0.5) * c.shake * 8;
      c.shake = Math.max(0, c.shake - dt * 3);
    }
  }

  updateEnemies(dt) {
    const p = this.player;

    // Normal Enemies AI
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const d = dist3D(p, e);
      if (d < 220) {
        e.state = 'chase';
        const dx = p.x - e.x;
        const dz = p.z - e.z;
        const n = Math.sqrt(dx * dx + dz * dz) || 1;
        e.x += (dx / n) * 55 * dt;
        e.z += (dz / n) * 55 * dt;

        // Attack telegraph and strike
        if (d < 45) {
          e.attackCd += dt;
          if (e.attackCd >= 1.4) {
            e.attackCd = 0;
            p.hp = Math.max(0, p.hp - 16);
            this.addDamageNumber(p.x, p.y + 35, p.z, 16, '#e63946');
            this.camera.shake = 0.5;
          }
        }
      } else {
        e.state = 'patrol';
      }
    }

    // Elite Mob AI: Thornveil Alpha
    const el = this.elite;
    if (el && el.hp > 0) {
      const d = dist3D(p, el);
      if (d < 260) {
        el.state = 'chase';
        const dx = p.x - el.x;
        const dz = p.z - el.z;
        const n = Math.sqrt(dx * dx + dz * dz) || 1;
        el.x += (dx / n) * 75 * dt;
        el.z += (dz / n) * 75 * dt;

        el.attackCd += dt;
        if (el.attackCd >= 2.0 && d < 60) {
          el.attackCd = 0;
          p.hp = Math.max(0, p.hp - 32);
          this.addDamageNumber(p.x, p.y + 40, p.z, 32, '#d62828');
          this.camera.shake = 0.8;
          this.spawnParticleRing(el.x, el.y + 20, el.z, '#f77f00', 16);
        }
      }
    }

    // Boss AI: Elder Yggvar (Worldroot Colossus)
    const b = this.boss;
    if (b && b.hp > 0) {
      const d = dist3D(p, b);
      if (d < 380) {
        b.state = 'active';
        b.attackTimer += dt;
        if (b.attackTimer > 3.0) {
          b.attackTimer = 0;
          // Root Slam Attack
          p.hp = Math.max(0, p.hp - 40);
          this.addDamageNumber(p.x, p.y + 45, p.z, 40, '#70e000');
          this.camera.shake = 1.2;
          this.spawnParticleRing(p.x, 0, p.z, '#70e000', 32);
        }
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z += pt.vz * dt;
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateDamageNumbers(dt) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += 35 * dt;
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  spawnParticleRing(x, y, z, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 40 + Math.random() * 50;
      this.particles.push({
        x, y, z,
        vx: Math.cos(angle) * speed,
        vy: 20 + Math.random() * 30,
        vz: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 3,
        life: 0.6 + Math.random() * 0.4,
      });
    }
  }

  addDamageNumber(x, y, z, amount, color = '#ffffff') {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 16,
      y,
      z: z + (Math.random() - 0.5) * 16,
      text: String(Math.round(amount)),
      color,
      life: 0.85,
    });
  }

  showToast(text, durationMs = 2000) {
    this.toast = text;
    this.toastTimer = durationMs / 1000;
  }

  updateVault() {
    if (!this.vault || this.vault.collected) return;
    const d = dist3D(this.player, this.vault);
    if (d > 46) return;
    this.vault.collected = true;
    if (this.pickRelic(this.vault.relic)) {
      const relic = MODE3D_RELICS.find((entry) => entry.id === this.vault.relic);
      this.echoes += this.vault.echoes || 0;
      this.showToast(`Relik ditemukan: ${relic ? relic.name : this.vault.relic} (+${this.vault.echoes} echo)`, 2600);
      this.spawnParticleRing(this.vault.x, 20, this.vault.z, '#ffd166', 26);
    }
  }
}

// ── 3. 3D RENDER PIPELINE (WebGL2 GLB assets, Canvas fallback) ───────────────
// A single renderer instance is shared by every 3D screen. It initialises lazily
// on first use, loads the authored GLB kit asynchronously, and transparently
// degrades to the illustrated Canvas presentation if WebGL2 is unavailable.
let gfx3D = null;
let gfx3DState = 'idle';

function ensureRenderer() {
  if (gfx3D) return gfx3D;
  gfx3D = new WebGL3D();
  if (!gfx3D.init()) {
    gfx3DState = 'unsupported';
    return gfx3D;
  }
  gfx3DState = 'loading';
  gfx3D
    .load('assets/3d/')
    .then((ok) => {
      gfx3DState = ok ? 'ready' : 'failed';
    })
    .catch(() => {
      gfx3DState = 'failed';
    });
  return gfx3D;
}

export function configure3D(options) {
  if (gfx3D) gfx3D.configure(options);
}

export function gfx3DStatus() {
  return {
    state: gfx3DState,
    available: Boolean(gfx3D?.available),
    reason: gfx3D?.failedReason || null,
    hdr: gfx3D?.hdrFormat || null,
    msaa: gfx3D?.msaa || 0,
    anisotropic: gfx3D?.appliedAniso || 1,
    upscaler: gfx3D?.lastUpscaler || null,
    models: gfx3D ? Object.keys(gfx3D.models).length : 0,
    props: gfx3D ? Object.keys(gfx3D.props).length : 0,
    internalWidth: gfx3D?.width || 0,
    stats: gfx3D?.stats || null,
  };
}

export function content3DSummary() {
  return contentSummary();
}

// ── 4. 3D CANVAS FALLBACK RENDERER (SOFTWARE PROJECTION PIPELINE) ───────────
function render3DLegacy(ctx, game) {
  const w = game.viewW;
  const h = game.viewH;
  const cam = game.camera;

  // Clear Sky & Depth Fog
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#0a171c');
  skyGrad.addColorStop(0.55, '#13282a');
  skyGrad.addColorStop(1, '#1b3834');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Render Depth-Sorted Draw List
  const drawList = [];

  // Ground Grid (Thornveil Forest Floor)
  const gridStep = 80;
  for (let z = 0; z <= 1000; z += gridStep) {
    const p1 = project3D({ x: -300, y: 0, z }, cam, cam.fov, w, h);
    const p2 = project3D({ x: 300, y: 0, z }, cam, cam.fov, w, h);
    if (p1 && p2) {
      drawList.push({
        depth: (p1.depth + p2.depth) / 2,
        render: () => {
          ctx.strokeStyle = 'rgba(74, 133, 98, 0.22)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p1.sx, p1.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.stroke();
        },
      });
    }
  }

  // Scenery (Huts, Trees, Platforms, Bonfire)
  for (const s of game.scenery) {
    const p = project3D(s, cam, cam.fov, w, h);
    if (!p) continue;

    drawList.push({
      depth: p.depth,
      render: () => {
        const rad = s.radius * p.scale;
        if (s.type === 'bonfire') {
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
          ctx.fill();
          // Glow halo
          ctx.strokeStyle = 'rgba(255, 112, 67, 0.4)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad * 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (s.type === 'worldtree') {
          const treeH = (s.height || 200) * p.scale;
          // Trunk
          ctx.fillStyle = '#4a3525';
          ctx.fillRect(p.sx - rad * 0.35, p.sy - treeH, rad * 0.7, treeH);
          // Canopy
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy - treeH, rad, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.type === 'hut') {
          // Village Hut Base
          ctx.fillStyle = '#6d4c41';
          ctx.fillRect(p.sx - rad, p.sy - rad * 1.2, rad * 2, rad * 1.2);
          // Straw Roof Cone
          ctx.fillStyle = '#8d6e63';
          ctx.beginPath();
          ctx.moveTo(p.sx - rad * 1.3, p.sy - rad * 1.2);
          ctx.lineTo(p.sx + rad * 1.3, p.sy - rad * 1.2);
          ctx.lineTo(p.sx, p.sy - rad * 2.2);
          ctx.closePath();
          ctx.fill();
        } else if (s.type === 'platform') {
          const pw = s.w * p.scale;
          const pd = s.d * p.scale;
          ctx.fillStyle = s.color;
          ctx.fillRect(p.sx - pw / 2, p.sy - pd / 2, pw, pd);
        } else if (s.type === 'totem') {
          const th = s.height * p.scale;
          ctx.fillStyle = s.color;
          ctx.fillRect(p.sx - rad * 0.5, p.sy - th, rad, th);
        }
      },
    });
  }

  // NPCs (Tribal Villagers)
  for (const npc of game.npcs) {
    const p = project3D(npc, cam, cam.fov, w, h);
    if (!p) continue;

    drawList.push({
      depth: p.depth,
      render: () => {
        const hRad = 16 * p.scale;
        // NPC Body
        ctx.fillStyle = '#2a9d8f';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy - hRad * 1.5, hRad, 0, Math.PI * 2);
        ctx.fill();

        // NPC Name Tag
        ctx.fillStyle = '#e9c46a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, p.sx, p.sy - hRad * 3.2);

        // Interaction Prompt indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('[E] Bicara', p.sx, p.sy - hRad * 2.2);
      },
    });
  }

  // Enemies (Forest Prowler, Spore Beetle, Bramble Stalker)
  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    const p = project3D(e, cam, cam.fov, w, h);
    if (!p) continue;

    drawList.push({
      depth: p.depth,
      render: () => {
        const rad = (e.radius || 20) * p.scale;
        // Shadow disc
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(p.sx, p.sy, rad, rad * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enemy model (sphere/cylinder representation)
        ctx.fillStyle = e.type === 'forest_prowler' ? '#e76f51' : e.type === 'spore_beetle' ? '#8338ec' : '#588157';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy - rad * 1.2, rad, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barW = 40 * p.scale;
        const hpPct = e.hp / e.maxHp;
        ctx.fillStyle = '#333333';
        ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.4, barW, 4);
        ctx.fillStyle = '#e63946';
        ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.4, barW * hpPct, 4);
      },
    });
  }

  // Elite Mob: Thornveil Alpha
  const el = game.elite;
  if (el && el.hp > 0) {
    const p = project3D(el, cam, cam.fov, w, h);
    if (p) {
      drawList.push({
        depth: p.depth,
        render: () => {
          const rad = el.radius * p.scale;
          // Aura Ring
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad * 1.4, 0, Math.PI * 2);
          ctx.stroke();

          // Body
          ctx.fillStyle = el.color;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy - rad, rad, 0, Math.PI * 2);
          ctx.fill();

          // Elite Badge
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`★ ${el.name}`, p.sx, p.sy - rad * 2.4);

          // Health bar
          const barW = 60 * p.scale;
          ctx.fillStyle = '#222';
          ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.1, barW, 5);
          ctx.fillStyle = '#ff7043';
          ctx.fillRect(p.sx - barW / 2, p.sy - rad * 2.1, barW * (el.hp / el.maxHp), 5);
        },
      });
    }
  }

  // Major Boss: Elder Yggvar (Worldroot Colossus)
  const b = game.boss;
  if (b && b.hp > 0) {
    const p = project3D(b, cam, cam.fov, w, h);
    if (p) {
      drawList.push({
        depth: p.depth,
        render: () => {
          const rad = b.radius * p.scale;
          const bh = b.height * p.scale;

          // Colossal Boss Body
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy - bh * 0.5, rad, bh * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing Core
          ctx.fillStyle = '#ffb703';
          ctx.beginPath();
          ctx.arc(p.sx, p.sy - bh * 0.5, rad * 0.45, 0, Math.PI * 2);
          ctx.fill();

          // Title & Health Bar at Top of Screen
          ctx.fillStyle = '#e9c46a';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b.name, w / 2, 38);
          ctx.font = '11px sans-serif';
          ctx.fillStyle = '#cccccc';
          ctx.fillText(b.title, w / 2, 54);

          const bossBarW = 380;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(w / 2 - bossBarW / 2, 62, bossBarW, 10);
          ctx.fillStyle = '#70e000';
          ctx.fillRect(w / 2 - bossBarW / 2, 62, bossBarW * (b.hp / b.maxHp), 10);
        },
      });
    }
  }

  // Player Character in 3D
  const ply = game.player;
  const pProj = game.firstPerson ? null : project3D(ply, cam, cam.fov, w, h);
  if (pProj) {
    drawList.push({
      depth: pProj.depth,
      render: () => {
        const pr = ply.radius * pProj.scale;
        const ph = ply.height * pProj.scale;

        // Shadow disc
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.ellipse(pProj.sx, pProj.sy, pr * 1.2, pr * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cape / Back accessory
        ctx.fillStyle = '#1c1c1e';
        ctx.beginPath();
        ctx.moveTo(pProj.sx - pr * 0.8, pProj.sy - ph * 0.7);
        ctx.lineTo(pProj.sx + pr * 0.8, pProj.sy - ph * 0.7);
        ctx.lineTo(pProj.sx, pProj.sy - 4);
        ctx.closePath();
        ctx.fill();

        // Armor Chest & Legs
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(pProj.sx - pr * 0.6, pProj.sy - ph * 0.75, pr * 1.2, ph * 0.75);

        // Head / Helmet
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(pProj.sx, pProj.sy - ph * 0.88, pr * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Weapon trail or held weapon
        ctx.strokeStyle = '#f8f9fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pProj.sx + pr * 0.8, pProj.sy - ph * 0.5);
        ctx.lineTo(pProj.sx + pr * 1.6, pProj.sy - ph * 0.9);
        ctx.stroke();

        // Glider wings when gliding
        if (ply.isGliding) {
          ctx.fillStyle = 'rgba(100, 223, 223, 0.65)';
          ctx.beginPath();
          ctx.moveTo(pProj.sx - pr * 2.5, pProj.sy - ph);
          ctx.lineTo(pProj.sx + pr * 2.5, pProj.sy - ph);
          ctx.lineTo(pProj.sx, pProj.sy - ph * 0.4);
          ctx.closePath();
          ctx.fill();
        }
      },
    });
  }

  // 3D Particles
  for (const pt of game.particles) {
    const p = project3D(pt, cam, cam.fov, w, h);
    if (!p) continue;
    drawList.push({
      depth: p.depth,
      render: () => {
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, pt.size * p.scale, 0, Math.PI * 2);
        ctx.fill();
      },
    });
  }

  // 3D Damage Numbers
  for (const dn of game.damageNumbers) {
    const p = project3D(dn, cam, cam.fov, w, h);
    if (!p) continue;
    drawList.push({
      depth: p.depth - 5, // Render in front
      render: () => {
        ctx.fillStyle = dn.color;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dn.text, p.sx, p.sy);
      },
    });
  }

  // Sort back-to-front (Painter's Algorithm)
  drawList.sort((a, b) => b.depth - a.depth);

  for (const item of drawList) {
    item.render();
  }

  // ── 2D OVERLAYS & HUD ─────────────────────────────────────────────────────
  render3DHUD(ctx, game);
}

function render3DHUDLegacy(ctx, game) {
  const w = game.viewW;
  const h = game.viewH;
  const p = game.player;

  // Lock-on Reticle
  if (p.lockOnTarget && p.lockOnTarget.hp > 0) {
    const targetProj = project3D(p.lockOnTarget, game.camera, game.camera.fov, w, h);
    if (targetProj) {
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      const r = 22;
      ctx.beginPath();
      ctx.arc(targetProj.sx, targetProj.sy - 20, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(targetProj.sx, targetProj.sy - 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Player Health & Stamina Bars (Top-Left)
  const hpW = 180;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(20, 20, hpW + 8, 16);
  ctx.fillStyle = '#e63946';
  ctx.fillRect(24, 24, hpW * (p.hp / p.maxHp), 8);

  // Stamina Bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(20, 40, hpW + 8, 12);
  ctx.fillStyle = '#52b788';
  ctx.fillRect(24, 43, hpW * (p.stamina / p.maxStamina), 6);

  // Mode Indicator Badge
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(20, h - 36, 260, 24);
  ctx.fillStyle = '#8ec5fc';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ASHEN VOW 3D: Thornveil Forest Vertical Slice', 26, h - 20);

  // Active Dialogue Box
  if (game.activeDialogue) {
    const dw = 520;
    const dh = 80;
    const dx = (w - dw) / 2;
    const dy = h - 110;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(dx, dy, dw, dh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${game.activeDialogue.name} (${game.activeDialogue.title})`, dx + 16, dy + 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText(game.activeDialogue.text, dx + 16, dy + 48);
  }

  // Toast Notification
  if (game.toast) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = '#70e000';
    ctx.lineWidth = 2;
    const tw = 320;
    ctx.beginPath();
    ctx.roundRect(w / 2 - tw / 2, 90, tw, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, w / 2, 113);
  }
}

// Public rendering entry points. The legacy primitive renderer above is kept
// only as an internal fallback reference; production always uses the
// illustrated presentation layer in mode3d_visuals.js.
export function render3D(ctx, game) {
  const renderer = ensureRenderer();
  if (renderer.available) {
    const region = MODE3D_REGIONS[game.region] || MODE3D_REGIONS.thornveil;
    let rendered = false;
    try {
      rendered = renderer.render(ctx, game, { region });
    } catch (error) {
      gfx3DState = 'failed';
      renderer.failedReason = String(error.message || error);
      rendered = false;
    }
    if (rendered) {
      render3DHudOverlay(ctx, game);
      return;
    }
  }
  render3DScene(ctx, game);
}
