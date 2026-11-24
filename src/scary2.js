// Ashen Vow — Update XI: Scary Mode 2.0 (The Nightmare Protocol).
//
// Three independent layers, deliberately kept apart:
//   1. Horror difficulty   — how dangerous and unpredictable encounters are.
//   2. Scare presentation  — how jumpscares, audio, camera and visuals look.
//   3. Anti-Jumpscare      — which startling effects are withheld entirely.
//
// Everything here is pure and deterministic: no DOM, no storage, no audio.
// The browser shell persists `settings.scary` and `ashen-vow-horror-v1`; the
// simulation (src/core.js) consumes only the difficulty numbers.

import { SCARE_DEFAULTS, sanitizeScarySettings } from './scary.js';
import { sanitizeHorrorSkills } from './horror_tree.js';

export const SCARY_DIFFICULTY_IDS = ['easy', 'normal', 'hard'];

/**
 * Horror difficulty. These numbers are gameplay, not presentation: detection,
 * reaction, attack pacing, damage and encounter pressure all move. Presentation
 * settings never change them and campaign difficulty never changes them either.
 */
export const SCARY_DIFFICULTY = Object.freeze({
  easy: {
    id: 'easy',
    label: 'Easy — Atmospheric',
    tagline: 'Atmosfer tenang, kejutan jarang, isyarat jelas.',
    intensity: 'low',
    detection: 0.78,
    attackRate: 1.15,
    reaction: 1.3,
    speed: 0.92,
    damage: 0.85,
    aggression: 0.6,
    searchTime: 3.5,
    surpriseChance: 0.18,
    eventChance: 0.3,
    pursuitChance: 0.1,
    fakeSignalChance: 0.15,
    warnings: 'frequent',
    warningLead: 2,
    ambience: 'light',
    pursuer: 'predictable',
    flanking: false,
    maxScares: 3,
    cooldownMul: 1.8,
    rows: [
      ['Agresi musuh', 'Rendah'],
      ['Deteksi musuh', 'Memaafkan'],
      ['Kejutan', 'Jarang'],
      ['Peristiwa lingkungan', 'Ringan'],
      ['Isyarat peringatan', 'Sering'],
      ['Perilaku pemburu', 'Terprediksi'],
      ['Atmosfer horor', 'Ringan'],
      ['Tekanan bertahan hidup', 'Rendah'],
    ],
  },
  normal: {
    id: 'normal',
    label: 'Normal — Haunted',
    tagline: 'Pengalaman horor seimbang dan direkomendasikan.',
    intensity: 'medium',
    detection: 1,
    attackRate: 1,
    reaction: 1,
    speed: 1,
    damage: 1,
    aggression: 1,
    searchTime: 6,
    surpriseChance: 0.4,
    eventChance: 0.55,
    pursuitChance: 0.3,
    fakeSignalChance: 0.35,
    warnings: 'limited',
    warningLead: 1.2,
    ambience: 'immersive',
    pursuer: 'adaptive',
    flanking: true,
    maxScares: 8,
    cooldownMul: 1,
    rows: [
      ['Agresi musuh', 'Sedang'],
      ['Deteksi musuh', 'Standar'],
      ['Kejutan', 'Moderat'],
      ['Peristiwa lingkungan', 'Moderat'],
      ['Isyarat peringatan', 'Terbatas'],
      ['Perilaku pemburu', 'Adaptif'],
      ['Atmosfer horor', 'Imersif'],
      ['Tekanan bertahan hidup', 'Sedang'],
    ],
  },
  hard: {
    id: 'hard',
    label: 'Hard — Nightmare',
    tagline: 'Musuh cerdas, pencarian agresif, kejutan tak terduga.',
    intensity: 'high',
    detection: 1.3,
    attackRate: 0.86,
    reaction: 0.84,
    speed: 1.08,
    damage: 1.22,
    aggression: 1.45,
    searchTime: 9,
    surpriseChance: 0.66,
    eventChance: 0.8,
    pursuitChance: 0.55,
    fakeSignalChance: 0.5,
    warnings: 'minimal',
    warningLead: 0.5,
    ambience: 'intense',
    pursuer: 'advanced',
    flanking: true,
    maxScares: 14,
    cooldownMul: 0.7,
    rows: [
      ['Agresi musuh', 'Tinggi'],
      ['Deteksi musuh', 'Mahir'],
      ['Kejutan', 'Sering'],
      ['Peristiwa lingkungan', 'Kompleks'],
      ['Isyarat peringatan', 'Minimal'],
      ['Perilaku pemburu', 'Mahir'],
      ['Atmosfer horor', 'Intens'],
      ['Tekanan bertahan hidup', 'Tinggi'],
    ],
  },
});

export function scaryDifficultyProfile(id) {
  return SCARY_DIFFICULTY[id] || SCARY_DIFFICULTY.normal;
}

/** Independent from campaign difficulty — this never writes gameplay.difficulty. */
export function scaryDifficultyOf(settings = {}) {
  return scaryDifficultyProfile(settings?.scary?.difficulty || settings?.difficulty).id;
}

export const HORROR_TABS = [
  { id: 'jumpscare', label: 'Jumpscare', icon: '☠' },
  { id: 'tree', label: 'Pohon Skill', icon: '🌿' },
  { id: 'audio', label: 'Audio Horor', icon: '♪' },
  { id: 'visual', label: 'Visual Horor', icon: '◈' },
  { id: 'enemy', label: 'Musuh Horor', icon: '☾' },
  { id: 'comfort', label: 'Kenyamanan', icon: '◐' },
];

export const LEVEL3 = [
  { id: 'off', label: 'Off' },
  { id: 'reduced', label: 'Reduced' },
  { id: 'full', label: 'Full' },
];
const L2 = [{ id: 'off', label: 'Off' }, { id: 'on', label: 'On' }];
const FR4 = [
  { id: 'veryLow', label: 'Very Low' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];
const INTENSITY2 = [{ id: 'reduced', label: 'Reduced' }, { id: 'standard', label: 'Standard' }];
const DETECTION_MODES = [
  { id: 'auto', label: 'Auto (ikut kesulitan)' },
  { id: 'forgiving', label: 'Forgiving' },
  { id: 'standard', label: 'Standard' },
  { id: 'advanced', label: 'Advanced' },
];
const ENCOUNTER_FREQ = [{ id: 'rare', label: 'Rare' }, ...FR4.slice(1)];

export const HORROR_DEFAULTS = Object.freeze({
  // A. jumpscares
  difficulty: 'normal',
  jumpscares: true,
  antiJumpscare: false,
  frequency: 'medium',
  duration: 1,
  cooldown: 12,
  enemyJumpscares: true,
  bossIntroSurprises: true,
  environmentalSurprises: true,
  warningBeforeScares: true,
  randomizedSelection: true,
  repeatPrevention: true,
  maxScaresPerSession: 25,
  // B. audio
  horrorAmbience: false,
  ambientWind: true,
  distantFootsteps: true,
  whispers: true,
  creatureSounds: true,
  suspenseMusic: true,
  combatHorrorMusic: true,
  positionalAudio: true,
  reverb: 45,
  audioOcclusion: true,
  suddenSounds: true,
  dynamicRange: 60,
  maxHorrorVolume: 70,
  // C. visual
  fogDensity: 55,
  darkness: 50,
  environmentLighting: 60,
  shadowMovement: true,
  screenDistortion: 'full',
  vignette: 45,
  desaturation: 30,
  cameraShake: 'full',
  cameraZoom: true,
  silhouetteVisibility: 70,
  particles: true,
  flickeringLights: true,
  environmentAnimation: true,
  postProcessing: true,
  // D. enemies
  surpriseBehavior: true,
  stalking: true,
  detectionIntelligence: 'auto',
  disappearanceEvents: true,
  distantAppearances: true,
  enemyFootstepAudio: true,
  roamingEvents: true,
  fakeOutEvents: true,
  chaseEvents: true,
  encounterFrequency: 'medium',
  // E. comfort / anti-jumpscare table
  surpriseEnemyAppearances: true,
  suddenCameraMovement: true,
  suddenAudioStings: true,
  flashing: 'full',
  enemyFaceReveal: true,
  suddenScreenTransitions: true,
  scareIntensity: 'standard',
  reducedHorrorEffects: false,
  noSuddenAudio: false,
  noScreenShake: false,
  noFlashing: false,
  noDistortion: false,
  reducedDarkness: false,
  clearEnemyIndicators: false,
  cooldownExtension: 0,
  disableInBossCinematics: true,
  disableAtLowHealth: false,
  oneTouchDisable: true,
  // legacy keys kept for v0.21 compatibility
  enabled: false,
  intensity: 'standard',
  screenEffects: 'full',
  suddenAudio: 'full',
  surpriseEvents: true,
  ambience: false,
  warnings: true,
  notifications: true,
});

const SET3 = new Set(['off', 'reduced', 'full']);
const SET4 = new Set(['veryLow', 'low', 'medium', 'high']);
const ONOFF = new Set(['off', 'on']);

const num = (value, fallback, lo, hi) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
};
const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
const pick = (value, allowed, fallback) => (allowed.has(value) ? value : fallback);

/** Sanitize the whole 2.0 payload into one flat `scary` object. */
export function sanitizeHorrorSettings(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const legacy = sanitizeScarySettings(source);
  const d = HORROR_DEFAULTS;
  const merged = { ...d, ...legacy, ...source };
  return {
    ...legacy,
    difficulty: SCARY_DIFFICULTY_IDS.includes(source.difficulty) ? source.difficulty : d.difficulty,
    jumpscares: bool(merged.jumpscares, d.jumpscares),
    antiJumpscare: bool(merged.antiJumpscare, d.antiJumpscare),
    duration: num(merged.duration, d.duration, 0.4, 3),
    enemyJumpscares: bool(merged.enemyJumpscares, d.enemyJumpscares),
    bossIntroSurprises: bool(merged.bossIntroSurprises, d.bossIntroSurprises),
    environmentalSurprises: bool(merged.environmentalSurprises, d.environmentalSurprises),
    warningBeforeScares: bool(merged.warningBeforeScares, d.warningBeforeScares),
    randomizedSelection: bool(merged.randomizedSelection, d.randomizedSelection),
    repeatPrevention: bool(merged.repeatPrevention, d.repeatPrevention),
    maxScaresPerSession: num(merged.maxScaresPerSession, d.maxScaresPerSession, 0, 200),
    horrorAmbience: bool(merged.horrorAmbience ?? merged.ambience, d.horrorAmbience),
    ambientWind: bool(merged.ambientWind, d.ambientWind),
    distantFootsteps: bool(merged.distantFootsteps, d.distantFootsteps),
    whispers: bool(merged.whispers, d.whispers),
    creatureSounds: bool(merged.creatureSounds, d.creatureSounds),
    suspenseMusic: bool(merged.suspenseMusic, d.suspenseMusic),
    combatHorrorMusic: bool(merged.combatHorrorMusic, d.combatHorrorMusic),
    positionalAudio: bool(merged.positionalAudio, d.positionalAudio),
    reverb: num(merged.reverb, d.reverb, 0, 100),
    audioOcclusion: bool(merged.audioOcclusion, d.audioOcclusion),
    suddenSounds: bool(merged.suddenSounds, d.suddenSounds),
    dynamicRange: num(merged.dynamicRange, d.dynamicRange, 0, 100),
    maxHorrorVolume: num(merged.maxHorrorVolume, d.maxHorrorVolume, 0, 100),
    fogDensity: num(merged.fogDensity, d.fogDensity, 0, 100),
    darkness: num(merged.darkness, d.darkness, 0, 100),
    environmentLighting: num(merged.environmentLighting, d.environmentLighting, 0, 100),
    shadowMovement: bool(merged.shadowMovement, d.shadowMovement),
    vignette: num(merged.vignette, d.vignette, 0, 100),
    desaturation: num(merged.desaturation, d.desaturation, 0, 100),
    cameraZoom: bool(merged.cameraZoom, d.cameraZoom),
    silhouetteVisibility: num(merged.silhouetteVisibility, d.silhouetteVisibility, 0, 100),
    particles: bool(merged.particles, d.particles),
    flickeringLights: bool(merged.flickeringLights, d.flickeringLights),
    environmentAnimation: bool(merged.environmentAnimation, d.environmentAnimation),
    postProcessing: bool(merged.postProcessing, d.postProcessing),
    surpriseBehavior: bool(merged.surpriseBehavior, d.surpriseBehavior),
    stalking: bool(merged.stalking, d.stalking),
    detectionIntelligence: DETECTION_MODES.some((entry) => entry.id === merged.detectionIntelligence)
      ? merged.detectionIntelligence
      : d.detectionIntelligence,
    disappearanceEvents: bool(merged.disappearanceEvents, d.disappearanceEvents),
    distantAppearances: bool(merged.distantAppearances, d.distantAppearances),
    enemyFootstepAudio: bool(merged.enemyFootstepAudio, d.enemyFootstepAudio),
    roamingEvents: bool(merged.roamingEvents, d.roamingEvents),
    fakeOutEvents: bool(merged.fakeOutEvents, d.fakeOutEvents),
    chaseEvents: bool(merged.chaseEvents, d.chaseEvents),
    encounterFrequency: pick(merged.encounterFrequency, new Set(['rare', 'low', 'medium', 'high']), d.encounterFrequency),
    surpriseEnemyAppearances: bool(merged.surpriseEnemyAppearances, d.surpriseEnemyAppearances),
    suddenCameraMovement: bool(merged.suddenCameraMovement, d.suddenCameraMovement),
    suddenAudioStings: bool(merged.suddenAudioStings, d.suddenAudioStings),
    flashing: pick(merged.flashing, SET3, d.flashing),
    enemyFaceReveal: bool(merged.enemyFaceReveal, d.enemyFaceReveal),
    suddenScreenTransitions: bool(merged.suddenScreenTransitions, d.suddenScreenTransitions),
    scareIntensity: INTENSITY2.some((entry) => entry.id === merged.scareIntensity) ? merged.scareIntensity : d.scareIntensity,
    reducedHorrorEffects: bool(merged.reducedHorrorEffects, d.reducedHorrorEffects),
    noSuddenAudio: bool(merged.noSuddenAudio, d.noSuddenAudio),
    noScreenShake: bool(merged.noScreenShake, d.noScreenShake),
    noFlashing: bool(merged.noFlashing, d.noFlashing),
    noDistortion: bool(merged.noDistortion, d.noDistortion),
    reducedDarkness: bool(merged.reducedDarkness, d.reducedDarkness),
    clearEnemyIndicators: bool(merged.clearEnemyIndicators, d.clearEnemyIndicators),
    cooldownExtension: num(merged.cooldownExtension, d.cooldownExtension, 0, 200),
    disableInBossCinematics: bool(merged.disableInBossCinematics, d.disableInBossCinematics),
    disableAtLowHealth: bool(merged.disableAtLowHealth, d.disableAtLowHealth),
    oneTouchDisable: bool(merged.oneTouchDisable, d.oneTouchDisable),
  };
}

/** Settings rows for the dedicated Scary Mode screen (five tabs). */
const S = (path, label, desc, options, tab, extra = {}) => ({ path: `scary.${path}`, label, desc, options, tab, type: 'select', ...extra });
const T = (path, label, desc, tab, extra = {}) => ({ path: `scary.${path}`, label, desc, tab, type: 'toggle', ...extra });
const R = (path, label, desc, min, max, step, suffix, tab, extra = {}) => ({ path: `scary.${path}`, label, desc, min, max, step, suffix, tab, type: 'range', ...extra });

export const HORROR_SETTING_DEFINITIONS = [
  T('enabled', 'Aktifkan Scary Mode', 'Mengaktifkan seluruh lapisan horor. Default off.', 'jumpscare', { key: 'enabled' }),
  S('difficulty', 'Kesulitan Horor', 'Terpisah dari kesulitan kampanye.', Object.values(SCARY_DIFFICULTY).map((d) => ({ id: d.id, label: d.label })), 'jumpscare'),
  T('jumpscares', 'Enable Jumpscares', 'Presentasi kejutan penuh saat terkena serangan.', 'jumpscare'),
  T('antiJumpscare', 'Anti-Jumpscare', 'Tidak ada kemunculan wajah penuh, zoom mendadak, sting keras, atau transisi kejut. Atmosfer tetap ada.', 'jumpscare', { highlight: true }),
  S('surpriseEnemyAppearances', 'Surprise Enemy Appearances', 'Kemunculan musuh mendadak di luar combat.', L2, 'jumpscare'),
  S('suddenCameraMovement', 'Sudden Camera Movement', 'Zoom dan hentakan kamera mendadak.', L2, 'jumpscare'),
  S('suddenAudioStings', 'Sudden Audio Stings', 'Sting audio mendadak.', L2, 'jumpscare'),
  S('flashing', 'Flashing Effects', 'Kilatan layar penuh.', LEVEL3, 'jumpscare'),
  S('screenDistortion', 'Screen Distortion', 'Distorsi dan pergeseran gambar.', LEVEL3, 'jumpscare'),
  T('enemyFaceReveal', 'Enemy Face Reveal', 'Wajah musuh memenuhi layar.', 'jumpscare'),
  S('suddenScreenTransitions', 'Sudden Screen Transitions', 'Transisi layar mendadak.', L2, 'jumpscare'),
  T('warningBeforeScares', 'Warning Before Scares', 'Isyarat sebelum kejutan.', 'jumpscare'),
  S('scareIntensity', 'Scare Intensity', 'Reduced atau Standard.', INTENSITY2, 'jumpscare'),
  S('frequency', 'Jumpscare Frequency', 'Peluang setiap hit yang sah.', FR4, 'jumpscare'),
  R('duration', 'Jumpscare Duration', 'Pengali durasi presentasi.', 0.4, 2.5, 0.1, '×', 'jumpscare'),
  R('cooldown', 'Scare Cooldown', 'Jeda minimum antar kejutan.', 2, 120, 1, ' s', 'jumpscare'),
  R('maxScaresPerSession', 'Maximum Scares Per Session', 'Batas keras per sesi; 0 mematikan kejutan.', 0, 200, 1, '', 'jumpscare'),
  T('enemyJumpscares', 'Enemy-Specific Jumpscares', 'Presentasi berbeda per jenis musuh.', 'jumpscare'),
  T('bossIntroductionSurprises', 'Boss Introduction Surprises', 'Kejutan saat bos muncul.', 'jumpscare'),
  T('environmentalSurprises', 'Environmental Surprise Events', 'Kejutan dari lingkungan, bukan musuh.', 'jumpscare'),
  T('randomizedSelection', 'Randomized Scare Selection', 'Pilih variasi kejutan secara acak.', 'jumpscare'),
  T('repeatPrevention', 'Repeated Scare Prevention', 'Ingat kejutan terakhir dan hindari pengulangan.', 'jumpscare'),

  T('horrorAmbience', 'Horror Ambience', 'Layer atmosfer horor.', 'audio'),
  T('ambientWind', 'Ambient Wind', 'Angin dan rongga jauh.', 'audio'),
  T('distantFootsteps', 'Distant Footsteps', 'Langkah jauh tanpa sumber terlihat.', 'audio'),
  T('whispers', 'Whispering Effects', 'Bisikan samar.', 'audio'),
  T('creatureSounds', 'Creature Sounds', 'Suara makhluk di luar pandangan.', 'audio'),
  T('suspenseMusic', 'Suspense Music', 'Layer ketegangan non-combat.', 'audio'),
  T('combatHorrorMusic', 'Combat Horror Music', 'Layer musik horor saat bertarung.', 'audio'),
  T('positionalAudio', 'Positional Audio', 'Sumber suara mengikuti posisi dunia.', 'audio', { preview: 'audio' }),
  R('reverb', 'Reverb Intensity', 'Ruangan dan gema.', 0, 100, 5, '%', 'audio'),
  T('audioOcclusion', 'Audio Occlusion', 'Suara teredam oleh dinding.', 'audio'),
  T('suddenSounds', 'Sudden Sound Effects', 'Efek suara mendadak (anti-jumpscare menimpanya).', 'audio'),
  R('dynamicRange', 'Audio Dynamic Range', 'Rentang dinamis ambience horor.', 0, 100, 5, '%', 'audio'),
  R('maxHorrorVolume', 'Maximum Horror Audio Volume', 'Batas volume seluruh lapisan horor.', 0, 100, 5, '%', 'audio'),

  R('fogDensity', 'Fog Density', 'Kepadatan kabut.', 0, 100, 5, '%', 'visual'),
  R('darkness', 'Darkness Intensity', 'Seberapa gelap dunia.', 0, 100, 5, '%', 'visual'),
  R('environmentLighting', 'Environmental Lighting', 'Kekuatan cahaya lingkungan.', 0, 100, 5, '%', 'visual'),
  T('shadowMovement', 'Shadow Movement', 'Bayangan bergerak di luar sumbernya.', 'visual'),
  R('vignette', 'Vignette', 'Pinggiran gelap.', 0, 100, 5, '%', 'visual'),
  R('desaturation', 'Color Desaturation', 'Penurunan saturasi warna.', 0, 100, 5, '%', 'visual'),
  T('cameraZoom', 'Camera Zoom Effects', 'Zoom halus (dimatikan anti-jumpscare).', 'visual'),
  R('silhouetteVisibility', 'Enemy Silhouette Visibility', 'Keterlihatan siluet musuh.', 0, 100, 5, '%', 'visual'),
  T('particles', 'Atmospheric Particles', 'Debu, abu, dan spora.', 'visual'),
  T('flickeringLights', 'Flickering Lights', 'Cahaya berkelip (dimatikan No Flashing).', 'visual'),
  T('environmentAnimation', 'Environmental Animation', 'Gerakan latar dan objek.', 'visual'),
  T('postProcessing', 'Horror Post-Processing', 'Grading dan lapisan layar; mengikuti kualitas grafis.', 'visual'),

  T('surpriseBehavior', 'Enemy Surprise Behavior', 'Musuh boleh muncul dari arah tak terduga.', 'enemy'),
  T('stalking', 'Enemy Stalking', 'Musuh membuntuti dari jarak jauh.', 'enemy'),
  S('detectionIntelligence', 'Enemy Detection Intelligence', 'Auto mengikuti kesulitan horor.', DETECTION_MODES, 'enemy'),
  T('disappearanceEvents', 'Enemy Disappearance Events', 'Musuh memudar lalu kembali di titik navigasi sah.', 'enemy'),
  T('distantAppearances', 'Distant Enemy Appearances', 'Siluet musuh di kejauhan.', 'enemy'),
  T('enemyFootstepAudio', 'Enemy Footstep Audio', 'Langkah musuh yang dekat.', 'enemy'),
  T('roamingEvents', 'Enemy Roaming Events', 'Musuh berpatroli lebih jauh.', 'enemy'),
  T('fakeOutEvents', 'Enemy Fake-Out Events', 'Isyarat palsu tanpa musuh nyata.', 'enemy'),
  T('chaseEvents', 'Enemy Chase Events', 'Musuh memulai pengejaran.', 'enemy'),
  S('encounterFrequency', 'Enemy Encounter Frequency', 'Seberapa sering kejutan musuh terjadi.', ENCOUNTER_FREQ, 'enemy'),

  T('antiJumpscare', 'Anti-Jumpscare', 'Saklar utama; berlaku seketika, juga saat bermain.', 'comfort', { highlight: true, key: 'antiJumpscare' }),
  T('reducedHorrorEffects', 'Reduced Horror Effects', 'Menurunkan seluruh intensitas presentasi.', 'comfort'),
  T('noSuddenAudio', 'No Sudden Audio', 'Tidak ada sting mendadak.', 'comfort'),
  T('noScreenShake', 'No Screen Shake', 'Kamera tidak bergetar.', 'comfort'),
  T('noFlashing', 'No Flashing', 'Tidak ada kilatan.', 'comfort'),
  T('noDistortion', 'No Distortion', 'Tidak ada distorsi layar.', 'comfort'),
  T('warningIndicators', 'Warning Indicators', 'Isyarat sebelum peristiwa menegangkan.', 'comfort'),
  T('reducedDarkness', 'Reduced Darkness', 'Menaikkan cahaya minimum.', 'comfort'),
  T('clearEnemyIndicators', 'Clear Enemy Indicators', 'Penanda musuh yang lebih jelas.', 'comfort'),
  R('cooldownExtension', 'Scare Cooldown Extension', 'Menambah jeda antar kejutan.', 0, 200, 10, '%', 'comfort'),
  T('disableInBossCinematics', 'Disable Horror During Boss Cinematics', 'Tidak ada horor saat sinematik bos.', 'comfort'),
  T('disableAtLowHealth', 'Disable Horror During Low Health', 'Meredakan horor saat HP rendah.', 'comfort'),
  T('oneTouchDisable', 'One-Touch Scary Mode Disable', 'Tombol cepat di menu jeda.', 'comfort'),
];

export const HORROR_SETTING_BY_PATH = Object.fromEntries(HORROR_SETTING_DEFINITIONS.map((entry) => [entry.path, entry]));

export function horrorSettingsForTab(tabId) {
  return HORROR_SETTING_DEFINITIONS.filter((entry) => entry.tab === tabId);
}

/**
 * Resolve every layer once. Accessibility and the graphics budget can only
 * ever remove effects; they can never add them.
 */
export function resolveHorrorPresentation(settings = {}, ctx = {}) {
  const s = sanitizeHorrorSettings(settings);
  const acc = ctx.accessibility || {};
  const gfx = ctx.graphics || {};
  const profile = scaryDifficultyProfile(s.difficulty);
  const suppression = [];

  const anti = s.antiJumpscare;
  const lowBudget = gfx.preset === 'low' || gfx.postProcessing === 'off';
  const levelOf = (value) => (value === 'off' ? 0 : value === 'reduced' ? 0.5 : 1);

  if (anti) suppression.push('anti-jumpscare');
  if (s.noSuddenAudio) suppression.push('no-sudden-audio');
  if (s.noScreenShake || acc.reduceShake) suppression.push('no-screen-shake');
  if (s.noFlashing || acc.reduceFlashing) suppression.push('no-flashing');
  if (s.noDistortion) suppression.push('no-distortion');
  if (acc.reduceCameraMotion) suppression.push('reduced-motion');
  if (lowBudget) suppression.push('graphics-budget');

  // ── layer 1: hostile gameplay pressure (difficulty only) ──
  const detectionOverride = s.detectionIntelligence === 'auto' ? profile.detection
    : s.detectionIntelligence === 'forgiving' ? Math.min(profile.detection, 0.8)
      : s.detectionIntelligence === 'advanced' ? Math.max(profile.detection, 1.2)
        : profile.detection;
  const encounterMul = { rare: 0.5, low: 0.75, medium: 1, high: 1.35 }[s.encounterFrequency] || 1;

  // ── layer 2: presentation ──
  const reduced = s.reducedHorrorEffects;
  const scale = (base) => Math.round(base * (reduced ? 0.55 : 1));
  const fog = lowBudget ? scale(s.fogDensity) * 0.6 : scale(s.fogDensity);
  const darkness = s.reducedDarkness ? Math.min(scale(s.darkness), 25) : scale(s.darkness);
  const silhouette = s.clearEnemyIndicators ? Math.max(scale(s.silhouetteVisibility), 85) : scale(s.silhouetteVisibility);
  const shakeLevel = anti || s.noScreenShake ? 0 : levelOf(s.cameraShake) * (acc.reduceShake ? 0 : 1);
  const flashLevel = anti || s.noFlashing ? 0 : levelOf(s.flashing) * (acc.reduceFlashing ? 0 : 1);
  const distortionLevel = anti || s.noDistortion ? 0 : levelOf(s.screenDistortion) * (acc.reduceCameraMotion ? 0.2 : 1) * (lowBudget ? 0 : 1);
  const stingGain = anti || s.noSuddenAudio || !s.suddenSounds ? 0
    : (acc.reduceLoudSfx ? 0.35 : 1) * (s.maxHorrorVolume / 100);
  const jumpscaresPossible = s.enabled && s.jumpscares && !anti && s.maxScaresPerSession > 0;

  return {
    enabled: s.enabled,
    antiJumpscare: anti,
    difficulty: profile.id,
    profile,
    suppression,
    gameplay: {
      detection: detectionOverride,
      aggression: profile.aggression,
      speed: profile.speed,
      damage: profile.damage,
      reaction: profile.reaction,
      attackRate: profile.attackRate,
      searchTime: profile.searchTime,
      flanking: profile.flanking,
      pursuerMode: profile.pursuer,
      encounterMul,
      surpriseChance: profile.surpriseChance * encounterMul,
      fakeSignalChance: profile.fakeSignalChance,
    },
    jumpscares: {
      possible: jumpscaresPossible,
      enemySpecific: s.enemyJumpscares,
      bossIntro: s.bossIntroSurprises && !anti,
      environmental: s.environmentalSurprises && !anti,
      faceReveal: jumpscaresPossible && s.enemyFaceReveal && s.surpriseEnemyAppearances,
      screenTransitions: !anti && s.suddenScreenTransitions,
      intensity: anti || reduced ? 'reduced' : s.scareIntensity,
      durationMul: s.duration * (reduced ? 0.7 : 1),
      cooldown: Math.round((s.cooldown + profile.cooldownMul * 4) * (1 + s.cooldownExtension / 100)),
      maxPerSession: Math.min(s.maxScaresPerSession, profile.maxScares),
      frequency: s.frequency,
      warnings: anti ? 'always' : s.warningBeforeScares ? profile.warnings : 'none',
      warningLead: anti ? Math.max(1.5, profile.warningLead) : profile.warningLead,
      randomization: s.randomizedSelection,
      repeatPrevention: s.repeatPrevention,
      intensityScale: s.scareIntensity === 'reduced' ? 0.55 : 1,
    },
    visual: {
      fog,
      darkness,
      lighting: scale(s.environmentLighting),
      vignette: anti ? Math.min(scale(s.vignette), 40) : scale(s.vignette),
      desaturation: scale(s.desaturation),
      silhouette,
      particles: s.particles && !lowBudget,
      flicker: s.flickeringLights && flashLevel > 0 && !acc.reduceFlashing,
      shadowMovement: s.shadowMovement && !acc.reduceCameraMotion,
      environmentAnimation: s.environmentAnimation && (gfx.animationQuality !== 'low'),
      distortion: distortionLevel,
      flash: flashLevel,
      post: s.postProcessing && !lowBudget,
      zoom: anti ? 0 : s.cameraZoom && !acc.reduceCameraMotion ? 1 : 0,
    },
    audio: {
      ambience: s.horrorAmbience || s.ambience,
      wind: s.ambientWind,
      footsteps: s.distantFootsteps,
      whispers: s.whispers,
      creatures: s.creatureSounds,
      suspense: s.suspenseMusic,
      combatLayer: s.combatHorrorMusic,
      positioned: s.positionalAudio,
      reverb: s.reverb,
      occlusion: s.audioOcclusion,
      dynamicRange: s.dynamicRange,
      maxVolume: s.maxHorrorVolume,
      stingGain,
      stingMuted: stingGain <= 0,
    },
    camera: {
      shake: shakeLevel,
      zoom: anti ? 0 : s.cameraZoom ? 1 : 0,
      suddenMovement: !anti && s.suddenCameraMovement,
      roll: anti ? 0 : 1,
    },
    enemy: {
      stalking: s.stalking,
      surpriseBehavior: s.surpriseBehavior && !anti && s.surpriseEnemyAppearances,
      disappearance: s.disappearanceEvents,
      distant: s.distantAppearances,
      footsteps: s.enemyFootstepAudio,
      roaming: s.roamingEvents,
      fakeOuts: s.fakeOutEvents && !anti,
      chases: s.chaseEvents,
      faceReveal: jumpscaresPossible && s.enemyFaceReveal && s.surpriseEnemyAppearances,
      surpriseChance: profile.surpriseChance * encounterMul,
    },
    horror: {
      disabledInBossCinematics: s.disableInBossCinematics,
      disabledAtLowHealth: s.disableAtLowHealth,
      ambienceLevel: profile.ambience,
      comfortMode: anti,
    },
  };
}

/* ────────────────────────── scare memory ────────────────────────── */

/**
 * Remembers recently used scare variants so the same presentation cannot repeat
 * back-to-back, and enforces the per-session ceiling.
 */
export class ScareLedger {
  constructor(options = {}) {
    this.history = [];
    this.limit = Math.max(1, Number(options.historyLimit) || 4);
    this.maxPerSession = Number.isFinite(options.maxPerSession) ? options.maxPerSession : 25;
    this.repeatPrevention = options.repeatPrevention !== false;
    this.sessionCount = 0;
    this.suppressed = 0;
  }

  remaining() {
    return Math.max(0, this.maxPerSession - this.sessionCount);
  }

  isBlocked(id) {
    return this.sessionCount >= this.maxPerSession;
  }

  /** Filter candidates, then record the chosen one. */
  choose(candidates = [], random = Math.random) {
    if (this.sessionCount >= this.maxPerSession) {
      this.suppressed += 1;
      return null;
    }
    let pool = candidates.filter(Boolean);
    if (!pool.length) {
      this.suppressed += 1;
      return null;
    }
    if (this.repeatPrevention) {
      const fresh = pool.filter((id) => !this.history.includes(id));
      if (fresh.length) pool = fresh;
    }
    const choice = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    this.record(choice);
    return choice;
  }

  record(id) {
    this.sessionCount += 1;
    this.history.push(id);
    while (this.history.length > this.limit) this.history.shift();
    return id;
  }

  reset() {
    this.history = [];
    this.sessionCount = 0;
    this.suppressed = 0;
    return this;
  }

  snapshot() {
    return {
      recent: this.history.slice(),
      used: this.sessionCount,
      remaining: this.remaining(),
      suppressed: this.suppressed,
      repeatPrevention: this.repeatPrevention,
    };
  }
}

/* ────────────────────────── horror events ────────────────────────── */

const REQUIREMENTS = {
  explore: (ctx) => !ctx.combat && !ctx.paused && !ctx.menu && !ctx.dialogue,
  alive: (ctx) => (ctx.hp ?? 1) > 0 && !ctx.dead,
  roomCleared: (ctx) => ctx.roomCleared !== false,
  noBoss: (ctx) => !ctx.boss,
  enemySlot: (ctx) => (ctx.enemyCount ?? 0) === 0,
  hasEnemySlot: (ctx) => (ctx.enemySlots ?? 4) > (ctx.enemyCount ?? 0),
  collectible: (ctx) => !!ctx.collectiblePresent,
  route: (ctx) => ctx.optionalRoute !== false,
  enabled: (ctx) => ctx.scaryEnabled !== false,
};

export const HORROR_EVENTS = Object.freeze({
  silent_hallway: {
    id: 'silent_hallway', label: 'Silent Hallway', icon: '◌',
    desc: 'Suara lingkungan tiba-tiba meredam.',
    duration: 14, cooldown: 120, weight: 1, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive', 'roomCleared'],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'hush' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Angin berhenti. Bahkan abu menahan napas.',
  },
  the_watcher: {
    id: 'the_watcher', label: 'The Watcher', icon: '👁',
    desc: 'Siluet jauh yang menghilang saat didekati.',
    duration: 9, cooldown: 90, weight: 1.2, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive', 'noBoss'],
    antiJumpscare: 'soften',
    start: [{ layer: 'presence', value: 'appear' }],
    end: [{ layer: 'presence', value: 'vanish' }],
    line: 'Ada yang berdiri di antara pepohonan.',
  },
  forgotten_footsteps: {
    id: 'forgotten_footsteps', label: 'Forgotten Footsteps', icon: '⌁',
    desc: 'Langkah kaki terdengar di dekatmu.',
    duration: 10, cooldown: 100, weight: 1, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive'],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'footsteps' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Langkah itu berhenti saat kau berhenti.',
  },
  haunted_room: {
    id: 'haunted_room', label: 'Haunted Room', icon: '⌂',
    desc: 'Ruangan mengubah cahaya dan atmosfernya.',
    duration: 16, cooldown: 150, weight: 1, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive', 'roomCleared'],
    antiJumpscare: 'soften',
    start: [{ layer: 'lighting', value: 'haunted' }],
    end: [{ layer: 'lighting', value: 'restore' }],
    line: 'Cahaya berpindah tanpa ada yang menyentuhnya.',
  },
  the_pursuit: {
    id: 'the_pursuit', label: 'The Pursuit', icon: '☾',
    desc: 'Kehadiran mengikuti langkahmu melalui lorong.',
    duration: 45, cooldown: 300, weight: 0.8, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive', 'hasEnemySlot'],
    antiJumpscare: 'soften',
    start: [{ layer: 'pursuer', value: 'spawn' }, { layer: 'audio', value: 'pursuit' }],
    end: [{ layer: 'pursuer', value: 'leave' }, { layer: 'audio', value: 'restore' }],
    line: 'Sesuatu berjalan di belakangmu, selangkah terlambat.',
  },
  broken_reflection: {
    id: 'broken_reflection', label: 'Broken Reflection', icon: '◫',
    desc: 'Pantulan singkat menampilkan adegan lain.',
    duration: 8, cooldown: 180, weight: 0.7, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive'],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'reflection' }],
    end: [{ layer: 'screen', value: 'restore' }],
    line: 'Pantulan itu bergerak lebih dulu darimu.',
  },
  lost_signal: {
    id: 'lost_signal', label: 'Lost Signal', icon: '≋',
    desc: 'Efek UI non-esensial hilang sementara.',
    duration: 6, cooldown: 240, weight: 0.6, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive'],
    antiJumpscare: 'suppress',
    start: [{ layer: 'ui', value: 'glitch' }],
    end: [{ layer: 'ui', value: 'restore' }],
    line: 'Sinyal itu patah. Sesuatu menumpang di celahnya.',
  },
  the_locked_door: {
    id: 'the_locked_door', label: 'The Locked Door', icon: '⚿',
    desc: 'Rute opsional terbuka setelah tantangan kecil.',
    duration: 60, cooldown: 300, weight: 0.6, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive', 'route'],
    antiJumpscare: 'soften',
    start: [{ layer: 'route', value: 'unlock' }],
    end: [{ layer: 'route', value: 'close' }],
    line: 'Engsel itu berderit, meski tidak ada angin.',
  },
  whispering_relic: {
    id: 'whispering_relic', label: 'Whispering Relic', icon: '✦',
    desc: 'Relik memicu peristiwa atmosfer unik.',
    duration: 12, cooldown: 200, weight: 0.7, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive', 'collectible'],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'whisper' }, { layer: 'screen', value: 'tint' }],
    end: [{ layer: 'audio', value: 'restore' }, { layer: 'screen', value: 'restore' }],
    line: 'Relik itu menyebut namamu dengan suara orang lain.',
  },
  nightmare_rift: {
    id: 'nightmare_rift', label: 'Nightmare Rift', icon: '✧',
    desc: 'Pertemuan horor opsional yang muncul sementara.',
    duration: 30, cooldown: 360, weight: 0.5, minDifficulty: 'hard',
    requires: ['enabled', 'explore', 'alive', 'hasEnemySlot'],
    antiJumpscare: 'soften',
    start: [{ layer: 'rift', value: 'open' }],
    end: [{ layer: 'rift', value: 'close' }],
    line: 'Dunia terbelah, dan celah itu menatap balik.',
  },
  the_second_shadow: {
    id: 'the_second_shadow', label: 'The Second Shadow', icon: '◭',
    desc: 'Sebuah bayangan kedua berdiri di belakang bayanganmu.',
    duration: 9, cooldown: 150, weight: 0.9, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive'],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'double_shadow' }],
    end: [{ layer: 'screen', value: 'restore' }],
    line: 'Bayanganmu punya satu bayangan tambahan. Ia tidak mengikuti cahaya.',
  },
  the_counting_knocks: {
    id: 'the_counting_knocks', label: 'The Counting Knocks', icon: '⋮',
    desc: 'Tiga ketukan menjawab dari dalam dinding.',
    duration: 13, cooldown: 140, weight: 1, minDifficulty: 'easy',
    requires: ['enabled', 'explore', 'alive'],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'knocks' }],
    end: [{ layer: 'audio', value: 'restore' }],
    line: 'Ketukan pertama dari dinding. Yang ketiga dari dalam dadamu.',
  },
  the_floor_hand: {
    id: 'the_floor_hand', label: 'The Floor Hand', icon: '☟',
    desc: 'Jari-jari pucat muncul dari celah lantai.',
    duration: 8, cooldown: 260, weight: 0.65, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive'],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'floor_hand' }],
    end: [{ layer: 'screen', value: 'restore' }],
    line: 'Lantai itu bernapas, dan sesuatu di bawahnya ingin naik.',
  },
  the_glass_twin: {
    id: 'the_glass_twin', label: 'The Glass Twin', icon: '◫',
    desc: 'Pantulanmu keluar dari cermin dan mengambil posisi di belakangmu.',
    duration: 22, cooldown: 280, weight: 0.7, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive', 'hasEnemySlot'],
    antiJumpscare: 'suppress',
    start: [{ layer: 'screen', value: 'mirror_guest' }, { layer: 'ghost', value: 'mirror_double' }],
    end: [{ layer: 'screen', value: 'restore' }, { layer: 'ghost', value: 'leave' }],
    line: 'Pantulan itu tersenyum. Kau belum melakukannya.',
  },
  the_hungry_light: {
    id: 'the_hungry_light', label: 'The Hungry Light', icon: '◉',
    desc: 'Cahaya di sekitarmu dimakan oleh sesuatu yang hanya bergerak saat tidak dilihat.',
    duration: 18, cooldown: 240, weight: 0.75, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive', 'hasEnemySlot'],
    antiJumpscare: 'soften',
    start: [{ layer: 'lighting', value: 'blackout' }, { layer: 'ghost', value: 'lantern_eater' }],
    end: [{ layer: 'lighting', value: 'restore' }, { layer: 'ghost', value: 'leave' }],
    line: 'Lentera mati satu per satu. Yang terakhir mati saat kau menoleh.',
  },
  the_bell_below: {
    id: 'the_bell_below', label: 'The Bell Below', icon: '♢',
    desc: 'Lonceng terkubur berdentang dan tanah menjawab dengan gelombang.',
    duration: 20, cooldown: 260, weight: 0.7, minDifficulty: 'normal',
    requires: ['enabled', 'explore', 'alive', 'hasEnemySlot'],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'bell' }, { layer: 'ghost', value: 'drowned_bell' }],
    end: [{ layer: 'audio', value: 'restore' }, { layer: 'ghost', value: 'leave' }],
    line: 'Lonceng di bawah tanah berdentang sekali. Tanah ikut berdenyut.',
  },
  the_mourning_wake: {
    id: 'the_mourning_wake', label: 'The Mourning Wake', icon: '☾',
    desc: 'Nyanyian ratapan memanggil sosok yang tidak pernah berhenti berduka.',
    duration: 24, cooldown: 300, weight: 0.55, minDifficulty: 'hard',
    requires: ['enabled', 'explore', 'alive', 'hasEnemySlot'],
    antiJumpscare: 'soften',
    start: [{ layer: 'audio', value: 'lullaby' }, { layer: 'ghost', value: 'weeping_mother' }],
    end: [{ layer: 'audio', value: 'restore' }, { layer: 'ghost', value: 'leave' }],
    line: 'Ratapan itu memanggilmu dengan suara ibumu, lalu dengan suaramu sendiri.',
  },
});

export const HORROR_EVENT_LIST = Object.values(HORROR_EVENTS);
export const HORROR_EVENT_IDS = HORROR_EVENT_LIST.map((event) => event.id);

const DIFFICULTY_ORDER = { easy: 0, normal: 1, hard: 2 };

function seededRandom(seed) {
  let state = (Number(seed) || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/**
 * Runs one horror event at a time. Every event has an activation check, a
 * duration, a hard timeout, cancellations, a safe exit and accessibility rules,
 * so no state can survive a death, a room change or a menu.
 */
export class HorrorEventDirector {
  constructor(settings = {}, options = {}) {
    this.configure(settings);
    this.rng = seededRandom(options.seed ?? 424242);
    this.clock = 0;
    this.active = null;
    this.lastEvent = null;
    this.cooldowns = {};
    this.completed = {};
    this.blocked = {};
    this.pending = [];
    this.history = [];
    this.started = 0;
    this.cancelled = 0;
    this.roomIndex = options.roomIndex ?? 0;
  }

  configure(settings = {}) {
    this.settings = sanitizeHorrorSettings(settings);
    this.presentation = resolveHorrorPresentation(this.settings);
    return this.presentation;
  }

  profile() {
    return scaryDifficultyProfile(this.settings.difficulty);
  }

  canActivate(event, ctx = {}) {
    if (!this.settings.enabled) return 'disabled';
    if (this.active) return 'busy';
    if ((this.cooldowns[event.id] || 0) > 0) return 'cooldown';
    if (DIFFICULTY_ORDER[this.profile().id] < DIFFICULTY_ORDER[event.minDifficulty]) return 'difficulty';
    for (const key of event.requires) {
      const test = REQUIREMENTS[key];
      if (test && !test({ scaryEnabled: this.settings.enabled, ...ctx })) return `requires:${key}`;
    }
    return null;
  }

  /** Try to begin a specific event. Returns the active event or a reason string. */
  tryStart(eventId, ctx = {}) {
    const event = HORROR_EVENTS[eventId];
    if (!event) return 'unknown';
    const blocked = this.canActivate(event, ctx);
    if (blocked) {
      this.blocked[eventId] = blocked;
      return blocked;
    }
    const anti = this.settings.antiJumpscare && event.antiJumpscare === 'suppress';
    const warnings = this.presentation.jumpscares.warnings;
    this.active = {
      id: event.id,
      label: event.label,
      antiJumpscare: event.antiJumpscare,
      suppressed: anti,
      phase: warnings === 'none' || anti ? 'active' : 'warn',
      warnDuration: warnings === 'none' || anti ? 0 : this.presentation.jumpscares.warningLead,
      elapsed: 0,
      duration: event.duration,
      hardTimeout: event.duration * 1.5 + 2,
      startChanges: anti ? event.start.filter((c) => c.layer !== 'screen') : event.start.slice(),
      ctx: { ...ctx },
      startedAt: this.clock,
    };
    this.started += 1;
    this.pending.push(...this.active.startChanges.map((change) => ({ ...change, event: event.id, phase: 'start' })));
    return this.active;
  }

  /** Pick a valid event for the current context. */
  autoStart(ctx = {}) {
    const profile = this.profile();
    const covered = { ...ctx, scaryEnabled: this.settings.enabled };
    if (!this.settings.enabled) return null;
    if (this.active) return this.active;
    const roll = this.rng();
    if (roll > profile.eventChance * (this.presentation.gameplay.encounterMul || 1)) {
      this.blocked.auto = 'roll';
      return null;
    }
    const candidates = HORROR_EVENT_LIST.filter((event) => !this.canActivate(event, covered));
    if (!candidates.length) return null;
    let pool = candidates;
    if (this.settings.repeatPrevention) {
      const fresh = pool.filter((event) => !this.history.includes(event.id));
      if (fresh.length) pool = fresh;
    }
    const weights = pool.map((event) => event.weight * (1 + (this.completed[event.id] ? 0 : 0.25)));
    const total = weights.reduce((a, b) => a + b, 0);
    let pickValue = this.rng() * total;
    let chosen = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i += 1) {
      pickValue -= weights[i];
      if (pickValue <= 0) { chosen = pool[i]; break; }
    }
    return this.tryStart(chosen.id, ctx);
  }

  cancel(reason = 'cancelled') {
    if (!this.active) return null;
    const event = HORROR_EVENTS[this.active.id];
    const ended = { ...this.active, phase: 'cancelled', reason };
    event.end.forEach((change) => this.pending.push({ ...change, event: event.id, phase: 'end' }));
    this.cooldowns[event.id] = event.cooldown;
    this.cancelled += 1;
    this.lastEvent = ended;
    this.active = null;
    this.history.push(event.id);
    if (this.history.length > 6) this.history.shift();
    return ended;
  }

  finish() {
    if (!this.active) return null;
    const event = HORROR_EVENTS[this.active.id];
    const ended = { ...this.active, phase: 'done' };
    event.end.forEach((change) => this.pending.push({ ...change, event: event.id, phase: 'end' }));
    this.cooldowns[event.id] = event.cooldown;
    this.completed[event.id] = (this.completed[event.id] || 0) + 1;
    this.lastEvent = ended;
    this.active = null;
    this.history.push(event.id);
    if (this.history.length > 6) this.history.shift();
    return ended;
  }

  /**
   * Advance the director. Cancellation is checked before the timer so a room
   * change or death can never leave a half-open event.
   */
  update(dt, ctx = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return this.snapshot();
    this.clock += dt;
    for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);

    if (ctx.roomIndex != null && ctx.roomIndex !== this.roomIndex) {
      this.roomIndex = ctx.roomIndex;
      if (this.active) this.cancel('room-change');
    }
    if (this.active) {
      if (ctx.dead || (ctx.hp ?? 1) <= 0) { this.cancel('death'); return this.snapshot(); }
      if (ctx.menu || ctx.paused) { this.cancel('menu'); return this.snapshot(); }
      if (this.settings.disableInBossCinematics && ctx.cinematic) { this.cancel('cinematic'); return this.snapshot(); }
      if (this.settings.disableAtLowHealth && (ctx.hp ?? 1) <= (ctx.maxHp ?? 100) * 0.2) { this.cancel('low-health'); return this.snapshot(); }
      if (ctx.combat && HORROR_EVENTS[this.active.id].requires.includes('roomCleared')) { this.cancel('combat'); return this.snapshot(); }

      this.active.elapsed += dt;
      if (this.active.phase === 'warn' && this.active.elapsed >= this.active.warnDuration) {
        this.active.phase = 'active';
        this.active.elapsed = 0;
      } else if (this.active.phase === 'active' && this.active.elapsed >= this.active.duration) {
        this.finish();
      } else if (this.active && this.active.elapsed >= this.active.hardTimeout) {
        this.cancel('timeout');
      }
    }
    return this.snapshot();
  }

  drain() {
    const changes = this.pending.slice();
    this.pending = [];
    return changes;
  }

  snapshot() {
    const event = this.active ? HORROR_EVENTS[this.active.id] : null;
    return {
      enabled: this.settings.enabled,
      antiJumpscare: this.settings.antiJumpscare,
      difficulty: this.profile().id,
      active: this.active
        ? {
          id: this.active.id,
          label: this.active.label,
          phase: this.active.phase,
          elapsed: Number(this.active.elapsed.toFixed(2)),
          duration: this.active.duration,
          suppressed: this.active.suppressed,
          antiJumpscare: this.active.antiJumpscare,
        }
        : null,
      last: this.lastEvent ? { id: this.lastEvent.id, phase: this.lastEvent.phase, reason: this.lastEvent.reason || null } : null,
      started: this.started,
      cancelled: this.cancelled,
      completed: { ...this.completed },
      cooldowns: Object.fromEntries(Object.entries(this.cooldowns).filter(([, value]) => value > 0).map(([key, value]) => [key, Math.round(value)])),
      history: this.history.slice(-5),
      line: event ? event.line : null,
      ui: event ? event.icon : null,
    };
  }
}

/* ────────────────────────── scary enemies ────────────────────────── */

export const SCARY_ENEMIES = Object.freeze({
  hollow_wraith: {
    id: 'hollow_wraith',
    name: 'The Hollow Wraith',
    family: 'wraith',
    archetype: 'wraith',
    ai: 'wraith',
    hp: 150, damage: 16, speed: 105, w: 34, h: 46,
    detect: 470, keepRange: 210, fadeRange: 96, fadeTime: 1.1, vanishTime: 2.6, respawnDistance: 240,
    castCooldown: 2.1, projectile: { type: 'wisp', dmg: 12, r: 8, vx: 200 },
    sound: { sting: 'sine', freq: 610, sweepTo: 120, dur: 1.2, gain: 0.1 },
    line: 'Ia mengikuti dari kejauhan, lalu melangkah ke dalam dinding.',
    tactic: 'follow-and-fade',
  },
  night_stalker: {
    id: 'night_stalker',
    name: 'The Night Stalker',
    family: 'stalker',
    archetype: 'stalker',
    ai: 'stalker',
    hp: 210, damage: 20, speed: 132, w: 38, h: 48,
    detect: 560, keepRange: 70, flankDistance: 190, strikeRange: 74, strikeCooldown: 2.4,
    sound: { sting: 'noise', freq: 880, sweepTo: 90, dur: 0.5, gain: 0.14 },
    line: 'Ia tidak mendekat dari depan. Ia memilih sisi butamu.',
    tactic: 'flank-strike',
  },
  silent_knight: {
    id: 'silent_knight',
    name: 'The Silent Knight',
    family: 'sentinel',
    archetype: 'sentinel',
    ai: 'sentinel',
    hp: 300, damage: 26, speed: 96, w: 40, h: 56,
    detect: 420, windup: 0.6, lungeSpeed: 420, lungeDamage: 30, lungeCooldown: 2.8,
    sound: { sting: 'metal', freq: 210, sweepTo: 60, dur: 0.9, gain: 0.16 },
    line: 'Armor itu kosong, tetapi langkahnya tahu ke mana kau pergi.',
    tactic: 'patrol-and-lunge',
  },
  forgotten_one: {
    id: 'forgotten_one',
    name: 'The Forgotten One',
    family: 'brute',
    archetype: 'brute',
    ai: 'brute',
    hp: 620, damage: 24, speed: 78, w: 54, h: 74,
    detect: 600, phaseThreshold: 0.55, volley: 10, slamRadius: 240,
    sound: { sting: 'sawtooth', freq: 95, sweepTo: 34, dur: 1.5, gain: 0.2 },
    line: 'Nama itu sudah dihapus, tetapi tubuhnya masih menagih.',
    tactic: 'phase-volley-slam',
    boss: true,
  },
  weeping_mother: {
    id: 'weeping_mother',
    name: 'The Weeping Mother',
    family: 'weeper',
    archetype: 'wraith',
    ai: 'wraith',
    hp: 280, damage: 15, speed: 86, w: 38, h: 54,
    detect: 540, keepRange: 190, wailCooldown: 3.5, wailWindup: 0.55,
    wailRadius: 270, tearCount: 5, tearSpeed: 165, tearDamage: 10,
    sound: { sting: 'sine', freq: 430, sweepTo: 74, dur: 1.1, gain: 0.12 },
    line: 'Ia tidak mengejarmu. Ia menangis sampai kau tidak sanggup menjauh.',
    tactic: 'wail-and-pull',
  },
  mirror_double: {
    id: 'mirror_double',
    name: 'The Mirror Double',
    family: 'mirror',
    archetype: 'sentinel',
    ai: 'sentinel',
    hp: 230, damage: 21, speed: 122, w: 34, h: 48,
    detect: 520, mirrorCooldown: 3.6, mirrorRange: 480, mirrorBehind: 170,
    strikeRange: 78, strikeDamage: 26,
    sound: { sting: 'metal', freq: 760, sweepTo: 130, dur: 0.55, gain: 0.12 },
    line: 'Ia memakai wajahmu, lalu berdiri di tempat yang belum kau pilih.',
    tactic: 'mirror-step',
  },
  lantern_eater: {
    id: 'lantern_eater',
    name: 'The Lantern Eater',
    family: 'lantern',
    archetype: 'stalker',
    ai: 'stalker',
    hp: 195, damage: 18, speed: 140, w: 34, h: 44,
    detect: 500, stareRange: 430, lungeRange: 72, lungeCooldown: 2.5,
    sound: { sting: 'noise', freq: 1200, sweepTo: 160, dur: 0.4, gain: 0.1 },
    line: 'Selama kau melihatnya, ia hanya bayangan. Saat kau berpaling, ia sudah dekat.',
    tactic: 'watched-stalk',
  },
  drowned_bell: {
    id: 'drowned_bell',
    name: 'The Drowned Bell',
    family: 'bell',
    archetype: 'brute',
    ai: 'brute',
    hp: 410, damage: 24, speed: 68, w: 48, h: 66,
    detect: 560, tollCooldown: 4.2, tollWindup: 0.55, tollRadius: 310, tollDamage: 18,
    sound: { sting: 'sawtooth', freq: 160, sweepTo: 38, dur: 1.7, gain: 0.18 },
    line: 'Lonceng di dalam tubuhnya berdentang setiap kali kau menyentuh tanah.',
    tactic: 'toll-shockwave',
  },
});

export const SCARY_ENEMY_LIST = Object.values(SCARY_ENEMIES);
export const SCARY_ENEMY_IDS = SCARY_ENEMY_LIST.map((enemy) => enemy.id);

/** Build a def for `game.spawnEnemy` with real per-difficulty scaling. */
export function makeScaryEnemy(kind, x, difficulty = 'normal', extra = {}) {
  const profile = SCARY_ENEMIES[kind];
  if (!profile) return null;
  const diff = scaryDifficultyProfile(difficulty);
  const baseline = 300; // compare against an average room enemy
  return {
    type: profile.archetype,
    name: profile.name,
    x,
    minX: Math.max(24, x - 260),
    maxX: Math.min(1900, x + 260),
    hpScale: (profile.hp / baseline) * (1 / diff.damage),
    dmgScale: (profile.damage / 16) * diff.damage,
    speedScale: (profile.speed / 120) * diff.speed,
    scaryKind: kind,
    ...extra,
  };
}

/* ────────────────────────── journal / achievements ────────────────────────── */

export const HORROR_SAVE_KEY = 'ashen-vow-horror-v1';

export const HORROR_ACHIEVEMENTS = Object.freeze([
  { id: 'first_encounter', label: 'First Encounter', desc: 'Selesaikan pertemuan Scary Mode pertama.', icon: '☠', test: (j) => j.counters.encounters >= 1 },
  { id: 'silent_explorer', label: 'Silent Explorer', desc: 'Selesaikan satu area berhantu.', icon: '◌', test: (j) => j.areas.length >= 1 },
  { id: 'night_watcher', label: 'Night Watcher', desc: 'Temukan semua peristiwa Watching Presence.', icon: '👁', test: (j) => (j.events.the_watcher || 0) >= 3 },
  { id: 'nightmare_survivor', label: 'Nightmare Survivor', desc: 'Selesaikan area pada kesulitan Nightmare.', icon: '☾', test: (j) => j.clears.hard >= 1 },
  { id: 'crypt_keeper', label: 'Crypt Keeper', desc: 'Selesaikan Echoing Crypt.', icon: '⚿', test: (j) => j.areas.includes('echoing_crypt') },
  { id: 'fearless_explorer', label: 'Fearless Explorer', desc: 'Selesaikan tantangan dengan pengaturan horor default.', icon: '✦', test: (j) => j.challenges.includes('default_horror') },
  { id: 'the_last_light', label: 'The Last Light', desc: 'Selesaikan tantangan bertahan hidup khusus.', icon: '✧', test: (j) => j.challenges.includes('last_light') },
  { id: 'the_uninvited', label: 'The Uninvited', desc: 'Temui keempat roh baru: Weeping Mother, Mirror Double, Lantern Eater, dan Drowned Bell.', icon: '◭', test: (j) => ['weeping_mother', 'mirror_double', 'lantern_eater', 'drowned_bell'].every((id) => j.enemies.includes(id)) },
  { id: 'every_last_whisper', label: 'Every Last Whisper', desc: 'Saksikan seluruh tujuh belas peristiwa horor.', icon: '⋮', test: (j) => HORROR_EVENT_IDS.every((id) => (j.events[id] || 0) > 0) },
]);

export const HORROR_REWARDS = Object.freeze([
  { id: 'skin_haunted_knight', label: 'Haunted Knight', kind: 'armor skin', cosmetic: true },
  { id: 'weapon_wraith_effect', label: 'Wraith Weapon Effects', kind: 'weapon effect', cosmetic: true },
  { id: 'accessory_dark_lantern', label: 'Dark Lantern', kind: 'accessory', cosmetic: true },
  { id: 'companion_forgotten_watcher', label: 'Forgotten Watcher', kind: 'companion skin', cosmetic: true },
  { id: 'title_nightmare', label: 'Nightmare', kind: 'title', cosmetic: true },
  { id: 'frame_haunted', label: 'Haunted Profile Frame', kind: 'profile frame', cosmetic: true },
  { id: 'emote_horror_set', label: 'Horror Emotes', kind: 'emote', cosmetic: true },
  { id: 'companion_mirror_moth', label: 'Mirror Moth', kind: 'companion skin', cosmetic: true },
  { id: 'title_the_uninvited', label: 'The Uninvited', kind: 'title', cosmetic: true },
]);
export const HORROR_REWARD_IDS = HORROR_REWARDS.map((reward) => reward.id);
export const HORROR_REWARD_ACHIEVEMENT = Object.freeze({
  first_encounter: 'accessory_dark_lantern',
  silent_explorer: 'emote_horror_set',
  night_watcher: 'companion_forgotten_watcher',
  nightmare_survivor: 'title_nightmare',
  crypt_keeper: 'skin_haunted_knight',
  fearless_explorer: 'frame_haunted',
  the_last_light: 'weapon_wraith_effect',
  the_uninvited: 'companion_mirror_moth',
  every_last_whisper: 'title_the_uninvited',
});

const JOURNAL_KINDS = {
  enemies: SCARY_ENEMY_IDS,
  events: HORROR_EVENT_IDS,
  areas: ['echoing_crypt', 'silent_hallway', 'thornveil_forest', 'ashen_gate', 'mycelial_hollow', 'hollow_corridor'],
  bosses: ['forgotten_one'],
  relics: ['dark_lantern', 'wraith_sigil', 'whispering_relic', 'nightmare_shard'],
  challenges: ['default_horror', 'last_light', 'no_scares', 'antisocial'],
};

/** Separate progression store; never mixed into campaign progress. */
export class HorrorJournal {
  constructor(raw = {}) {
    const clean = sanitizeHorrorProgress(raw);
    this.enemies = clean.enemies;
    this.events = clean.events;
    this.areas = clean.areas;
    this.bosses = clean.bosses;
    this.relics = clean.relics;
    this.challenges = clean.challenges;
    this.clears = clean.clears;
    this.counters = clean.counters;
    this.rewards = clean.rewards;
    this.flags = clean.flags;
    this.skills = clean.skills;
  }

  record(kind, id, amount = 1) {
    if (!JOURNAL_KINDS[kind]) return false;
    if (kind === 'areas' || kind === 'bosses' || kind === 'relics' || kind === 'challenges') {
      if (!JOURNAL_KINDS[kind].includes(id) || this[kind].includes(id)) return false;
      this[kind] = [...this[kind], id];
      return true;
    }
    if (kind === 'enemies') {
      if (!JOURNAL_KINDS.enemies.includes(id)) return false;
      if (!this.enemies.includes(id)) this.enemies = [...this.enemies, id];
      this.counters.encounters += amount;
      return true;
    }
    if (kind === 'events') {
      if (!JOURNAL_KINDS.events.includes(id)) return false;
      this.events[id] = (this.events[id] || 0) + amount;
      return true;
    }
    return false;
  }

  recordClear(difficultyId, options = {}) {
    const id = SCARY_DIFFICULTY_IDS.includes(difficultyId) ? difficultyId : 'normal';
    this.clears[id] = (this.clears[id] || 0) + 1;
    this.counters.runs += 1;
    if (options.area) this.record('areas', options.area);
    if (options.challenge) this.record('challenges', options.challenge);
    if (options.boss) this.record('bosses', options.boss);
    return this;
  }

  achievements() {
    return HORROR_ACHIEVEMENTS.map((entry) => ({
      ...entry,
      unlocked: !!entry.test(this),
    }));
  }

  unlockedAchievements() {
    return this.achievements().filter((entry) => entry.unlocked).map((entry) => entry.id);
  }

  /** Cosmetics only; never combat stats, never multiplayer advantage. */
  grantRewards() {
    const granted = [];
    for (const id of this.unlockedAchievements()) {
      const reward = HORROR_REWARD_ACHIEVEMENT[id];
      if (reward && !this.rewards.includes(reward)) {
        this.rewards = [...this.rewards, reward];
        granted.push(reward);
      }
    }
    return granted;
  }

  progress() {
    const unlocked = this.unlockedAchievements();
    return {
      enemies: `${this.enemies.length}/${SCARY_ENEMY_IDS.length}`,
      events: `${Object.keys(this.events).length}/${HORROR_EVENT_IDS.length}`,
      areas: `${this.areas.length}/${JOURNAL_KINDS.areas.length}`,
      bosses: `${this.bosses.length}/${JOURNAL_KINDS.bosses.length}`,
      relics: `${this.relics.length}/${JOURNAL_KINDS.relics.length}`,
      challenges: `${this.challenges.length}/${JOURNAL_KINDS.challenges.length}`,
      achievements: `${unlocked.length}/${HORROR_ACHIEVEMENTS.length}`,
      rewards: `${this.rewards.length}/${HORROR_REWARDS.length}`,
      unlocked,
    };
  }

  snapshot() {
    return {
      ...this.progress(),
      counters: { ...this.counters },
      clears: { ...this.clears },
      events: { ...this.events },
      rewards: [...this.rewards],
      flags: { ...this.flags },
      skills: { ...this.skills },
      achievements: this.achievements(),
    };
  }

  toJSON() {
    return {
      version: 1,
      enemies: this.enemies,
      events: this.events,
      areas: this.areas,
      bosses: this.bosses,
      relics: this.relics,
      challenges: this.challenges,
      clears: this.clears,
      counters: this.counters,
      rewards: this.rewards,
      flags: this.flags,
      skills: { ...this.skills },
    };
  }
}

export function sanitizeHorrorProgress(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const list = (value, allowed) => (Array.isArray(value) ? [...new Set(value.filter((id) => allowed.includes(id)))] : []);
  const counters = source.counters && typeof source.counters === 'object' ? source.counters : {};
  const clears = source.clears && typeof source.clears === 'object' ? source.clears : {};
  const events = {};
  if (source.events && typeof source.events === 'object') {
    for (const [id, count] of Object.entries(source.events)) {
      if (!JOURNAL_KINDS.events.includes(id)) continue;
      const n = Math.max(0, Math.min(9999, Math.floor(Number(count) || 0)));
      if (n > 0) events[id] = n;
    }
  }
  const flags = source.flags && typeof source.flags === 'object' ? { ...source.flags } : {};
  return {
    enemies: list(source.enemies, JOURNAL_KINDS.enemies),
    events,
    areas: list(source.areas, JOURNAL_KINDS.areas),
    bosses: list(source.bosses, JOURNAL_KINDS.bosses),
    relics: list(source.relics, JOURNAL_KINDS.relics),
    challenges: list(source.challenges, JOURNAL_KINDS.challenges),
    clears: {
      easy: Math.max(0, Math.floor(Number(clears.easy) || 0)),
      normal: Math.max(0, Math.floor(Number(clears.normal) || 0)),
      hard: Math.max(0, Math.floor(Number(clears.hard) || 0)),
    },
    counters: {
      encounters: Math.max(0, Math.floor(Number(counters.encounters) || 0)),
      scares: Math.max(0, Math.floor(Number(counters.scares) || 0)),
      suppressed: Math.max(0, Math.floor(Number(counters.suppressed) || 0)),
      runs: Math.max(0, Math.floor(Number(counters.runs) || 0)),
      deaths: Math.max(0, Math.floor(Number(counters.deaths) || 0)),
    },
    rewards: list(source.rewards, HORROR_REWARD_IDS),
    flags,
    skills: sanitizeHorrorSkills(source.skills),
  };
}

/** Human-readable summary used by the menu and the HUD badge. */
export function horrorSummary(settings = {}, journal = null) {
  const s = sanitizeHorrorSettings(settings);
  const profile = scaryDifficultyProfile(s.difficulty);
  return {
    enabled: !!s.enabled,
    difficulty: profile.id,
    difficultyLabel: profile.label,
    antiJumpscare: !!s.antiJumpscare,
    intensity: profile.intensity,
    ambience: profile.ambience,
    status: !s.enabled ? 'off' : s.antiJumpscare ? 'comfort' : 'full',
    journal: journal ? journal.progress() : null,
  };
}

/** True when the presentation layer may show a startling full-screen scare. */
export function startlingAllowed(settings = {}) {
  const s = sanitizeHorrorSettings(settings);
  return !!s.enabled && !!s.jumpscares && !s.antiJumpscare && s.maxScaresPerSession > 0;
}
