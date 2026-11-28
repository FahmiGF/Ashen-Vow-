// Ashen Vow — Settings 2.0 schema, categories, presets, and value helpers.
// The module is intentionally pure: the browser shell renders it, Node tests
// validate it, and no DOM or storage access happens here.
import { SCARE_DEFAULTS, SCARE_OPTIONS } from './scary.js';
import { sanitizeHorrorSettings } from './scary2.js';
import { sanitizeDreadSettings } from './dread.js';
import { sanitizeVeilSettings } from './veil.js';
import { sanitizeEternalSettings } from './eternal.js';

export const SETTINGS2_VERSION = 2;

export const SETTINGS_CATEGORIES = [
  { id: 'graphics', label: 'Grafis', icon: '◈', desc: 'Preset, pencahayaan, material, dan efek render.' },
  { id: 'display', label: 'Tampilan', icon: '▣', desc: 'Mode layar, resolusi, skala UI, dan tangkapan layar.' },
  { id: 'audio', label: 'Audio', icon: '♪', desc: 'Sepuluh bus mixer independen dan perilaku audio.' },
  { id: 'controls', label: 'Kontrol', icon: '⌘', desc: 'Keybind, sensitivitas, gamepad, dan interaksi.' },
  { id: 'gameplay', label: 'Gameplay', icon: '⚔', desc: 'Kesulitan, pemulihan, dan aturan main.' },
  { id: 'difficulty', label: 'Kesulitan', icon: '☠', desc: 'Enam profil kesulitan dengan perilaku nyata.' },
  { id: 'accessibility', label: 'Aksesibilitas', icon: '◐', desc: 'Warna, teks, gerak, dan isyarat combat.' },
  { id: 'language', label: 'Bahasa', icon: '文', desc: 'Bahasa antarmuka, subtitle, dialog, dan suara.' },
  { id: 'performance', label: 'Performa', icon: '▤', desc: 'Resolusi dinamis, streaming, dan anggaran frame.' },
  { id: 'interface', label: 'Antarmuka / HUD', icon: '▦', desc: 'Visibilitas HUD, opacity, skala, dan tata letak.' },
  { id: 'notifications', label: 'Notifikasi', icon: '◇', desc: 'Combat, loot, quest, dan pesan sistem.' },
  { id: 'privacy', label: 'Privasi & Online', icon: '◎', desc: 'Telemetri, laporan crash, dan status online.' },
  { id: 'account', label: 'Akun', icon: '⌂', desc: 'Profil lokal dan preferensi sinkronisasi.' },
  { id: 'advanced', label: 'Lanjutan', icon: '⚙', desc: 'Diagnostik, batas engine, dan perilaku eksperimental.' },
];

export const LANGUAGES = [
  { id: 'id', name: 'Bahasa Indonesia', english: 'Indonesian', rtl: false, ui: 1, voice: 0.95 },
  { id: 'en', name: 'English', english: 'English', rtl: false, ui: 1, voice: 1 },
  { id: 'ja', name: '日本語', english: 'Japanese', rtl: false, ui: 0.96, voice: 0.9 },
  { id: 'ko', name: '한국어', english: 'Korean', rtl: false, ui: 0.96, voice: 0.9 },
  { id: 'zh-cn', name: '简体中文', english: 'Simplified Chinese', rtl: false, ui: 0.96, voice: 0.9 },
  { id: 'zh-tw', name: '繁體中文', english: 'Traditional Chinese', rtl: false, ui: 0.96, voice: 0.9 },
  { id: 'es', name: 'Español', english: 'Spanish', rtl: false, ui: 0.98, voice: 0.95 },
  { id: 'fr', name: 'Français', english: 'French', rtl: false, ui: 0.98, voice: 0.95 },
  { id: 'de', name: 'Deutsch', english: 'German', rtl: false, ui: 0.98, voice: 0.95 },
  { id: 'pt', name: 'Português', english: 'Portuguese', rtl: false, ui: 0.98, voice: 0.95 },
  { id: 'ru', name: 'Русский', english: 'Russian', rtl: false, ui: 0.96, voice: 0.9 },
  { id: 'ar', name: 'العربية', english: 'Arabic', rtl: true, ui: 0.96, voice: 0.9 },
  { id: 'th', name: 'ไทย', english: 'Thai', rtl: false, ui: 0.94, voice: 0.9 },
  { id: 'vi', name: 'Tiếng Việt', english: 'Vietnamese', rtl: false, ui: 0.96, voice: 0.9 },
];
export const LANGUAGE_IDS = LANGUAGES.map((language) => language.id);
export const LANGUAGE_BY_ID = Object.fromEntries(LANGUAGES.map((language) => [language.id, language]));

export const AUDIO_CHANNELS = [
  { id: 'master', label: 'Master', desc: 'Gain akhir untuk seluruh output audio.' },
  { id: 'music', label: 'Musik', desc: 'Skor prosedural dan layer combat.' },
  { id: 'sfx', label: 'Efek Suara', desc: 'Serangan, luka, dan efek dunia.' },
  { id: 'ambient', label: 'Ambient', desc: 'Angin, gua, dan atmosfer zona.' },
  { id: 'dialogue', label: 'Dialog', desc: 'Suara dialog dan narasi prosedural.' },
  { id: 'combat', label: 'Combat', desc: 'Isyarat tempur dan layer intensitas.' },
  { id: 'ui', label: 'UI', desc: 'Klik, konfirmasi, dan peringatan antarmuka.' },
  { id: 'footsteps', label: 'Langkah', desc: 'Langkah kaki dan permukaan.' },
  { id: 'voiceChat', label: 'Voice Chat', desc: 'Bus terpisah untuk voice chat saat tersedia.' },
  { id: 'cinematic', label: 'Cinematic', desc: 'Cutscene, prolog, dan momen bos.' },
];

export const GRAPHICS_PRESETS = {
  low: {
    label: 'Low', tagline: 'Biaya minimum',
    values: {
      shadowQuality: 'low', textureQuality: 'low', lightingQuality: 'low', ambientOcclusion: 'off',
      reflectionQuality: 'low', volumetricFog: 'off', particleQuality: 'low', waterQuality: 'low',
      foliageQuality: 'low', viewDistance: 'near', postProcessing: 'off', motionBlur: 'off',
      depthOfField: 'off', bloom: 'off', chromaticAberration: 'off', lensFlare: 'off',
      screenSpaceReflections: 'off', rayTracing: 'off', upscaling: 'native', renderScale: 65,
      anisotropicFiltering: 'off', antiAliasing: 'off', particleMultiplier: 0.5,
    },
  },
  medium: {
    label: 'Medium', tagline: 'Seimbang',
    values: {
      shadowQuality: 'medium', textureQuality: 'medium', lightingQuality: 'medium', ambientOcclusion: 'ssao',
      reflectionQuality: 'medium', volumetricFog: 'low', particleQuality: 'medium', waterQuality: 'medium',
      foliageQuality: 'medium', viewDistance: 'medium', postProcessing: 'low', motionBlur: 'off',
      depthOfField: 'off', bloom: 'low', chromaticAberration: 'off', lensFlare: 'off',
      screenSpaceReflections: 'off', rayTracing: 'off', upscaling: 'native', renderScale: 85,
      anisotropicFiltering: '4x', antiAliasing: 'fxaa', particleMultiplier: 0.85,
    },
  },
  high: {
    label: 'High', tagline: 'Rekomendasi',
    values: {
      shadowQuality: 'high', textureQuality: 'high', lightingQuality: 'high', ambientOcclusion: 'hbao',
      reflectionQuality: 'high', volumetricFog: 'medium', particleQuality: 'high', waterQuality: 'high',
      foliageQuality: 'high', viewDistance: 'far', postProcessing: 'high', motionBlur: 'low',
      depthOfField: 'on', bloom: 'high', chromaticAberration: 'off', lensFlare: 'on',
      screenSpaceReflections: 'on', rayTracing: 'off', upscaling: 'native', renderScale: 100,
      anisotropicFiltering: '8x', antiAliasing: 'smaa', particleMultiplier: 1,
    },
  },
  ultra: {
    label: 'Ultra', tagline: 'Kualitas tinggi',
    values: {
      shadowQuality: 'ultra', textureQuality: 'ultra', lightingQuality: 'ultra', ambientOcclusion: 'gtao',
      reflectionQuality: 'ultra', volumetricFog: 'high', particleQuality: 'ultra', waterQuality: 'ultra',
      foliageQuality: 'ultra', viewDistance: 'ultra', postProcessing: 'ultra', motionBlur: 'high',
      depthOfField: 'on', bloom: 'high', chromaticAberration: 'on', lensFlare: 'on',
      screenSpaceReflections: 'on', rayTracing: 'off', upscaling: 'native', renderScale: 115,
      anisotropicFiltering: '16x', antiAliasing: 'taa', particleMultiplier: 1.75,
    },
  },
  extreme: {
    label: 'Extreme', tagline: 'Batas perangkat',
    values: {
      shadowQuality: 'ultra', textureQuality: 'ultra', lightingQuality: 'ultra', ambientOcclusion: 'gtao',
      reflectionQuality: 'ultra', volumetricFog: 'high', particleQuality: 'ultra', waterQuality: 'ultra',
      foliageQuality: 'ultra', viewDistance: 'ultra', postProcessing: 'ultra', motionBlur: 'high',
      depthOfField: 'on', bloom: 'high', chromaticAberration: 'on', lensFlare: 'on',
      screenSpaceReflections: 'on', rayTracing: 'auto', upscaling: 'native', renderScale: 115,
      anisotropicFiltering: '16x', antiAliasing: 'msaa', particleMultiplier: 2.5,
    },
  },
  custom: { label: 'Custom', tagline: 'Pilihan manual', values: {} },
};

export const AUDIO_OUTPUTS = [
  { id: 'default', label: 'Perangkat default' },
  { id: 'headphones', label: 'Headphone / stereo' },
  { id: 'speakers', label: 'Speaker / surround' },
];
export const AUDIO_SPATIAL = [
  { id: 'stereo', label: 'Stereo' }, { id: 'surround', label: 'Surround' }, { id: 'spatial', label: 'Spatial / HRTF' },
];
export const DYNAMIC_RANGES = [
  { id: 'night', label: 'Night — kompresi tinggi' },
  { id: 'normal', label: 'Normal' },
  { id: 'wide', label: 'Wide — rentang dinamis penuh' },
];
export const DISPLAY_MODES = [
  { id: 'windowed', label: 'Windowed' }, { id: 'borderless', label: 'Borderless' }, { id: 'fullscreen', label: 'Fullscreen' },
];
export const QUALITY4 = [
  { id: 'low', label: 'Low' }, { id: 'medium', label: 'Medium' }, { id: 'high', label: 'High' }, { id: 'ultra', label: 'Ultra' },
];
export const SHADOW_QUALITY = [{ id: 'off', label: 'Off' }, ...QUALITY4];
export const AO_MODES = [
  { id: 'off', label: 'Off' }, { id: 'ssao', label: 'SSAO' }, { id: 'hbao', label: 'HBAO+' }, { id: 'gtao', label: 'GTAO' },
];
export const AA_MODES = [
  { id: 'off', label: 'Off' }, { id: 'fxaa', label: 'FXAA' }, { id: 'smaa', label: 'SMAA' },
  { id: 'taa', label: 'TAA' }, { id: 'msaa', label: 'MSAA' }, { id: 'native', label: 'Native / platform default' },
];
export const VIEW_DISTANCES = [
  { id: 'near', label: 'Near' }, { id: 'medium', label: 'Medium' }, { id: 'far', label: 'Far' }, { id: 'ultra', label: 'Ultra' },
];
export const POST_QUALITY = [{ id: 'off', label: 'Off' }, { id: 'low', label: 'Low' }, { id: 'high', label: 'High' }, { id: 'ultra', label: 'Ultra' }];
export const MOTION_BLUR = [{ id: 'off', label: 'Off' }, { id: 'low', label: 'Low' }, { id: 'high', label: 'High' }];
export const BLOOM = [{ id: 'off', label: 'Off' }, { id: 'low', label: 'Low' }, { id: 'high', label: 'High' }];
export const UPSCALERS = [{ id: 'native', label: 'Native' }, { id: 'bilinear', label: 'Bilinear' }, { id: 'fsr', label: 'FSR (emulated)' }, { id: 'nis', label: 'NIS (emulated)' }];
export const ANISO = [{ id: 'off', label: 'Off' }, { id: '2x', label: '2×' }, { id: '4x', label: '4×' }, { id: '8x', label: '8×' }, { id: '16x', label: '16×' }];
export const FRAME_LIMITS = [30, 60, 90, 120, 144, 0];
export const HDR_MODES = [{ id: 'auto', label: 'Auto' }, { id: 'on', label: 'On (jika didukung)' }, { id: 'off', label: 'Off' }];
export const COLORBLIND_MODES = [
  { id: 'off', label: 'Off' }, { id: 'protanopia', label: 'Protanopia' }, { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' }, { id: 'custom', label: 'Indikator kustom' },
];
export const TEXT_SIZES = [{ id: 'small', label: 'Kecil' }, { id: 'normal', label: 'Normal' }, { id: 'large', label: 'Besar' }, { id: 'xlarge', label: 'Sangat besar' }];
export const HUD_POSITIONS = [{ id: 'default', label: 'Default' }, { id: 'compact', label: 'Kompak' }, { id: 'split', label: 'Terpisah' }, { id: 'custom', label: 'Kustom' }];
export const INTERACTION_MODES = [{ id: 'hold', label: 'Tahan' }, { id: 'toggle', label: 'Toggle' }];
export const LOG_LEVELS = [{ id: 'error', label: 'Error saja' }, { id: 'warn', label: 'Warning' }, { id: 'info', label: 'Info' }, { id: 'debug', label: 'Debug' }];
export const STREAMING_QUALITY = [{ id: 'low', label: 'Low' }, { id: 'medium', label: 'Medium' }, { id: 'high', label: 'High' }, { id: 'auto', label: 'Auto' }];

const select = (path, label, desc, options, category, extra = {}) => ({ path, label, desc, type: 'select', options, category, ...extra });
const toggle = (path, label, desc, category, extra = {}) => ({ path, label, desc, type: 'toggle', category, ...extra });
const range = (path, label, desc, min, max, step, suffix, category, extra = {}) => ({ path, label, desc, type: 'range', min, max, step, suffix, category, ...extra });

export const SETTING_DEFINITIONS = [
  select('graphics.preset', 'Graphics Preset', 'Menerapkan seluruh nilai grafis di bawahnya. Perubahan manual menjadi Custom.', [
    ...Object.entries(GRAPHICS_PRESETS).filter(([id]) => id !== 'custom').map(([id, p]) => ({ id, label: p.label })),
    { id: 'custom', label: 'Custom' },
  ], 'graphics', { key: 'preset' }),
  range('graphics.brightness', 'Brightness', 'Mengubah output cahaya, bukan mencuci warna UI.', 0, 200, 1, '%', 'graphics'),
  range('graphics.contrast', 'Contrast', 'Memisahkan bayangan dan sorotan.', 0, 200, 1, '%', 'graphics'),
  range('graphics.gamma', 'Gamma', 'Kurva mid-tone terpisah dari brightness dan HDR.', 50, 250, 1, '%', 'graphics'),
  select('graphics.hdr', 'HDR', 'Mendeteksi display HDR; jika tidak tersedia, status menunjukkan Unsupported.', HDR_MODES, 'graphics'),
  toggle('graphics.hdrCalibration', 'HDR Calibration', 'Panel paper-white dan peak brightness saat HDR aktif.', 'graphics'),
  select('graphics.antiAliasing', 'Anti-Aliasing', 'Metode tepi aktif; Canvas 2D memakai smoothing dan 3D memakai detail tepi.', AA_MODES, 'graphics'),
  select('graphics.shadowQuality', 'Shadow Quality', 'Anggaran bayangan dan jumlah lapisan bayangan prosedural.', SHADOW_QUALITY, 'graphics'),
  select('graphics.textureQuality', 'Texture Quality', 'Detail material dan tekstur prosedural.', QUALITY4, 'graphics'),
  select('graphics.lightingQuality', 'Lighting Quality', 'Jumlah cahaya langsung, rim, dan ambient.', QUALITY4, 'graphics'),
  select('graphics.ambientOcclusion', 'Ambient Occlusion', 'Kontak bayangan pada geometri.', AO_MODES, 'graphics'),
  select('graphics.reflectionQuality', 'Reflection Quality', 'Refleksi air dan permukaan.', QUALITY4, 'graphics'),
  select('graphics.volumetricFog', 'Volumetric Fog', 'Kabut bervolume dan scattering.', [{ id: 'off', label: 'Off' }, ...QUALITY4.slice(0, 3)], 'graphics'),
  select('graphics.particleQuality', 'Particle Quality', 'Kepadatan partikel dan efek dunia.', QUALITY4, 'graphics'),
  range('graphics.particleMultiplier', 'Particle Density Boost', 'Pengali kepadatan partikel ekstra (hingga 4× untuk efek penuh).', 0.5, 4, 0.25, '×', 'graphics'),
  select('graphics.waterQuality', 'Water Quality', 'Detail air, riak, dan refraksi.', QUALITY4, 'graphics'),
  select('graphics.foliageQuality', 'Foliage Quality', 'Kepadatan rumput, daun, dan vegetasi.', QUALITY4, 'graphics'),
  select('graphics.viewDistance', 'View Distance', 'Jarak pandang dunia dan populasi objek.', VIEW_DISTANCES, 'graphics'),
  select('graphics.postProcessing', 'Post Processing', 'Bloom, grading, vignette, dan efek layar.', POST_QUALITY, 'graphics'),
  select('graphics.motionBlur', 'Motion Blur', 'Blur gerak kamera; dimatikan oleh aksesibilitas.', MOTION_BLUR, 'graphics'),
  toggle('graphics.depthOfField', 'Depth of Field', 'Fokus sinematik pada kedalaman tertentu.', 'graphics'),
  select('graphics.bloom', 'Bloom', 'Halo pada sumber cahaya terang.', BLOOM, 'graphics'),
  toggle('graphics.chromaticAberration', 'Chromatic Aberration', 'Pemisahan warna tepi layar.', 'graphics'),
  toggle('graphics.lensFlare', 'Lens Flare', 'Flare prosedural pada cahaya kuat.', 'graphics'),
  toggle('graphics.screenSpaceReflections', 'Screen Space Reflections', 'Refleksi berbasis ruang layar.', 'graphics'),
  select('graphics.rayTracing', 'Ray Tracing', 'Hanya aktif jika perangkat dan renderer mendukung.', [{ id: 'off', label: 'Off' }, { id: 'auto', label: 'On (jika didukung)' }], 'graphics'),
  select('graphics.upscaling', 'Upscaling', 'Metode rekonstruksi resolusi internal.', UPSCALERS, 'graphics'),
  range('graphics.renderScale', 'Render Scale', 'Resolusi internal 50–200%; UI tetap tajam.', 50, 200, 5, '%', 'graphics'),
  toggle('graphics.vsync', 'V-Sync', 'Sinkronisasi vertikal saat browser mengizinkan.', 'graphics'),
  select('graphics.frameRateLimit', 'Frame Rate Limit', 'Batas frame engine; Unlimited = 0.', FRAME_LIMITS.map((n) => ({ id: String(n), label: n ? `${n} FPS` : 'Unlimited' })), 'graphics', { numeric: true }),
  select('graphics.anisotropicFiltering', 'Anisotropic Filtering', 'Ketajaman tekstur pada sudut miring.', ANISO, 'graphics'),

  select('display.mode', 'Display Mode', 'Windowed, borderless, atau fullscreen.', DISPLAY_MODES, 'display'),
  select('display.resolution', 'Resolution', 'Resolusi window yang didukung layar.', [{ id: 'auto', label: 'Auto / layar penuh' }, { id: '1280x720', label: '1280 × 720' }, { id: '1920x1080', label: '1920 × 1080' }, { id: '2560x1440', label: '2560 × 1440' }], 'display'),
  select('display.refreshRate', 'Refresh Rate', 'Refresh rate yang dilaporkan browser.', [{ id: 'auto', label: 'Auto' }, { id: '60', label: '60 Hz' }, { id: '120', label: '120 Hz' }, { id: '144', label: '144 Hz' }], 'display'),
  select('display.monitor', 'Monitor', 'Pemilihan monitor jika API tersedia.', [{ id: 'primary', label: 'Monitor utama' }], 'display'),
  range('display.resolutionScaling', 'Resolution Scaling', 'Skala resolusi UI dan canvas.', 50, 200, 5, '%', 'display'),
  range('display.safeArea', 'Safe Area', 'Margin aman untuk notch dan tepi layar.', 0, 10, 1, '%', 'display'),
  range('display.uiScale', 'UI Scaling', 'Skala HUD dan menu 70–150%.', 70, 150, 5, '%', 'display'),
  toggle('display.minimizeOnFocusLoss', 'Minimize on Focus Loss', 'Menurunkan aktivitas render saat tab tidak fokus.', 'display'),
  toggle('display.showFps', 'Show FPS', 'Menampilkan penghitung FPS.', 'display'),
  toggle('display.showPerformance', 'Show Performance Statistics', 'Menampilkan frame time, memori, dan preset.', 'display'),
  select('display.screenshotFormat', 'Screenshot Format', 'Format tangkapan layar.', [{ id: 'png', label: 'PNG lossless' }, { id: 'jpeg', label: 'JPEG' }, { id: 'webp', label: 'WebP' }], 'display'),
  range('display.screenshotQuality', 'Screenshot Quality', 'Kualitas kompresi tangkapan layar.', 10, 100, 1, '%', 'display'),

  ...AUDIO_CHANNELS.map((channel) => range(`audio.${channel.id}`, channel.label, channel.desc, 0, 100, 1, '%', 'audio')),
  toggle('audio.muted', 'Mute Semua', 'Membisukan master tanpa menghapus level tiap bus.', 'audio'),
  toggle('audio.muteOnBlur', 'Mute saat Kehilangan Fokus', 'Membisukan audio saat tab tidak aktif.', 'audio'),
  select('audio.outputDevice', 'Output Device', 'Pemilihan perangkat output bila didukung browser.', AUDIO_OUTPUTS, 'audio'),
  select('audio.spatial', 'Spatial Audio', 'Mode stereo, surround, atau spatial.', AUDIO_SPATIAL, 'audio'),
  select('audio.dynamicRange', 'Dynamic Range', 'Kompresi malam, normal, atau rentang lebar.', DYNAMIC_RANGES, 'audio'),
  range('audio.subtitleOffset', 'Subtitle Offset', 'Penyelarasan subtitle dalam milidetik.', -1000, 1000, 50, ' ms', 'audio'),
  toggle('audio.dialogueSubtitles', 'Dialogue Subtitles', 'Menampilkan subtitle dialog saat tersedia.', 'audio'),
  toggle('audio.combatMusic', 'Music During Combat', 'Layer musik tetap aktif saat combat.', 'audio'),
  toggle('audio.reduceLoudSfx', 'Reduce Loud SFX', 'Membatasi puncak efek suara keras.', 'audio'),
  toggle('audio.channelMutes.dialogue', 'Mute Dialog Independen', 'Mematikan bus dialog tanpa mematikan SFX.', 'audio', { key: 'muteDialogue' }),
  toggle('audio.channelMutes.voiceChat', 'Mute Voice Chat Independen', 'Mematikan bus voice chat tanpa mematikan musik.', 'audio', { key: 'muteVoiceChat' }),

  range('controls.mouseSensitivity', 'Mouse Sensitivity', 'Kecepatan kamera dengan mouse.', 10, 300, 5, '%', 'controls'),
  range('controls.controllerSensitivity', 'Controller Sensitivity', 'Kecepatan kamera dengan stick.', 10, 300, 5, '%', 'controls'),
  range('controls.cameraSensitivity', 'Camera Sensitivity', 'Sensitivitas kamera 3D.', 10, 300, 5, '%', 'controls'),
  range('controls.aimSensitivity', 'Aim Sensitivity', 'Sensitivitas saat aim / lock-on.', 10, 300, 5, '%', 'controls'),
  toggle('controls.invertX', 'Invert X Axis', 'Membalik sumbu horizontal kamera.', 'controls'),
  toggle('controls.invertY', 'Invert Y Axis', 'Membalik sumbu vertikal kamera.', 'controls'),
  toggle('controls.vibration', 'Controller Vibration', 'Getaran gamepad bila didukung.', 'controls'),
  toggle('controls.toggleSprint', 'Toggle Sprint', 'Sprint sebagai toggle, bukan tahan.', 'controls'),
  toggle('controls.toggleCrouch', 'Toggle Crouch', 'Crouch sebagai toggle di mode yang mendukung.', 'controls'),
  select('controls.interaction', 'Interaction Mode', 'Tahan atau toggle untuk interaksi.', INTERACTION_MODES, 'controls'),
  range('controls.doubleTapWindow', 'Double-Tap Detection', 'Jendela double-tap dalam milidetik.', 120, 500, 10, ' ms', 'controls'),
  toggle('controls.gamepad', 'Gamepad API', 'Mengaktifkan gamepad standar.', 'controls'),

  select('gameplay.difficulty', 'Campaign Difficulty', 'Kesulitan aktif untuk kampanye. Dapat diubah tanpa mereset progres.', [
    { id: 'story', label: 'Story Mode' }, { id: 'easy', label: 'Easy' }, { id: 'normal', label: 'Normal' },
    { id: 'hard', label: 'Hard' }, { id: 'nightmare', label: 'Nightmare' }, { id: 'abyssal', label: 'Abyssal' },
  ], 'gameplay'),
  select('gameplay.screenShake', 'Screen Shake', 'Intensitas getaran kamera.', [{ id: 'off', label: 'Off' }, { id: 'low', label: 'Low' }, { id: 'full', label: 'Full' }], 'gameplay'),
  select('gameplay.frameCap', 'Legacy Frame Cap', 'Kompatibilitas batas frame lama; gunakan Frame Rate Limit untuk kontrol baru.', FRAME_LIMITS.map((n) => ({ id: String(n), label: n ? `${n} FPS` : 'Unlimited' })), 'gameplay', { numeric: true }),
  toggle('gameplay.fpsCounter', 'FPS Counter', 'Menampilkan FPS di HUD.', 'gameplay'),
  toggle('gameplay.gamepad', 'Gamepad', 'Mengaktifkan input gamepad.', 'gameplay'),
  toggle('gameplay.autoPickup', 'Auto Pickup', 'Mengambil loot dasar saat menyentuh.', 'gameplay'),
  range('gameplay.damageNumbers', 'Damage Number Scale', 'Ukuran angka damage.', 50, 150, 5, '%', 'gameplay'),

  toggle('scary.enabled', 'Scary Mode', 'Jumpscare dan atmosfer horor saat terkena serangan. Default off dan tidak pernah menambah damage.', 'gameplay'),
  select('scary.intensity', 'Scare Intensity', 'Skala durasi, getaran, dan kekuatan sting.', SCARE_OPTIONS.intensity, 'gameplay'),
  select('scary.frequency', 'Jumpscare Frequency', 'Peluang setiap hit yang sah memicu jumpscare.', SCARE_OPTIONS.frequency, 'gameplay'),
  select('scary.screenEffects', 'Screen Effects', 'Distorsi, flash, dan bayangan layar.', SCARE_OPTIONS.level3, 'gameplay'),
  select('scary.suddenAudio', 'Sudden Audio', 'Sting audio mendadak, mengikuti volume SFX.', SCARE_OPTIONS.level3, 'gameplay'),
  select('scary.cameraShake', 'Camera Shake', 'Getaran kamera saat jumpscare.', SCARE_OPTIONS.level3, 'gameplay'),
  toggle('scary.surpriseEvents', 'Enemy Surprise Events', 'Kemunculan musuh mendadak di area eksplorasi.', 'gameplay'),
  toggle('scary.ambience', 'Horror Ambience', 'Layer ambient horor tanpa jumpscare.', 'gameplay'),
  toggle('scary.warnings', 'Warning Indicators', 'Isyarat sebelum efek menegangkan.', 'gameplay'),
  range('scary.cooldown', 'Scare Cooldown', 'Jeda minimum antar jumpscare.', 2, 60, 1, ' s', 'gameplay'),
  toggle('scary.notifications', 'Scary Mode Notifications', 'Beri tahu saat Scary Mode aktif.', 'gameplay'),

  select('accessibility.colorblind', 'Colorblind Preset', 'Palet indikator untuk kebutuhan penglihatan warna.', COLORBLIND_MODES, 'accessibility'),
  toggle('accessibility.customIndicators', 'Custom Color Indicators', 'Mengaktifkan warna indikator kustom.', 'accessibility'),
  select('accessibility.subtitleSize', 'Subtitle Size', 'Ukuran subtitle.', TEXT_SIZES, 'accessibility'),
  range('accessibility.subtitleBackground', 'Subtitle Background Opacity', 'Opacity latar subtitle.', 0, 100, 5, '%', 'accessibility'),
  toggle('accessibility.highContrast', 'High Contrast UI', 'Mempertegas garis, teks, dan status.', 'accessibility'),
  toggle('accessibility.reduceShake', 'Reduce Screen Shake', 'Mengurangi getaran kamera.', 'accessibility'),
  toggle('accessibility.reduceFlashing', 'Reduce Flashing', 'Menghapus kilatan dan animasi berdenyut.', 'accessibility'),
  toggle('accessibility.reduceCameraMotion', 'Reduce Camera Movement', 'Menenangkan kamera 3D.', 'accessibility'),
  toggle('accessibility.disableMotionBlur', 'Disable Motion Blur', 'Memaksa motion blur off.', 'accessibility'),
  toggle('accessibility.holdToInteract', 'Hold to Interact', 'Interaksi harus ditahan.', 'accessibility'),
  toggle('accessibility.simplifiedQTE', 'Simplified QTE', 'Menyederhanakan input QTE yang ada.', 'accessibility'),
  toggle('accessibility.combatIndicators', 'Combat Indicator Clarity', 'Memperjelas telegraph dan status combat.', 'accessibility'),
  toggle('accessibility.uiNarration', 'UI Narration', 'Narasi UI bila speech synthesis tersedia.', 'accessibility'),
  select('accessibility.textSize', 'Text Size', 'Ukuran teks antarmuka.', TEXT_SIZES, 'accessibility'),
  select('accessibility.profile', 'Accessibility Profile', 'Profil terpisah untuk preferensi aksesibilitas.', [{ id: 'default', label: 'Default' }, { id: 'low-motion', label: 'Low Motion' }, { id: 'high-readability', label: 'High Readability' }], 'accessibility'),

  select('language.interface', 'Interface Language', 'Bahasa menu, HUD, dan pengaturan.', LANGUAGES.map((l) => ({ id: l.id, label: l.name })), 'language'),
  select('language.subtitles', 'Subtitle Language', 'Bahasa subtitle.', LANGUAGES.map((l) => ({ id: l.id, label: l.name })), 'language'),
  select('language.voice', 'Voice Language', 'Hanya bahasa yang memiliki suara tersedia ditandai.', LANGUAGES.map((l) => ({ id: l.id, label: l.id === 'id' || l.id === 'en' ? l.name : `${l.name} (teks)` })), 'language'),
  select('language.dialogue', 'Dialogue Language', 'Bahasa teks dialog.', LANGUAGES.map((l) => ({ id: l.id, label: l.name })), 'language'),

  toggle('performance.dynamicResolution', 'Dynamic Resolution', 'Menyesuaikan render scale terhadap frame time.', 'performance'),
  range('performance.backgroundFps', 'Background FPS Limit', 'Batas FPS saat tab tidak fokus.', 5, 60, 5, ' FPS', 'performance'),
  select('performance.shaderCompilation', 'Shader Compilation', 'Perilaku kompilasi shader/efek.', [{ id: 'auto', label: 'Auto' }, { id: 'background', label: 'Background' }, { id: 'on-demand', label: 'On demand' }], 'performance'),
  select('performance.assetStreaming', 'Asset Streaming Quality', 'Anggaran streaming aset per region.', STREAMING_QUALITY, 'performance'),
  range('performance.particleBudget', 'Particle Budget', 'Batas partikel aktif (hingga 6000 untuk mode penuh efek).', 100, 6000, 100, '', 'performance'),
  range('performance.npcUpdateFrequency', 'NPC Update Frequency', 'Frekuensi update NPC jauh.', 10, 120, 5, ' Hz', 'performance'),
  select('performance.animationQuality', 'Animation Quality', 'Detail interpolasi dan pose.', QUALITY4, 'performance'),
  select('performance.physicsQuality', 'Physics Quality', 'Frekuensi dan presisi fisika.', QUALITY4, 'performance'),
  range('performance.viewDistance3d', '3D View Distance', 'Jarak render khusus 3D.', 40, 150, 5, '%', 'performance'),
  toggle('performance.asyncLoading', 'Async Asset Loading', 'Memuat aset tanpa memblokir frame.', 'performance'),

  toggle('hud.showHealth', 'Health Bar', 'Visibilitas bar kesehatan.', 'interface'),
  toggle('hud.showStamina', 'Stamina Bar', 'Visibilitas bar stamina.', 'interface'),
  toggle('hud.showMana', 'Mana Bar', 'Visibilitas bar mana.', 'interface'),
  toggle('hud.showMinimap', 'Minimap', 'Visibilitas minimap.', 'interface'),
  toggle('hud.showQuest', 'Quest Tracker', 'Visibilitas pelacak quest.', 'interface'),
  toggle('hud.showBoss', 'Boss Health Bar', 'Visibilitas health bar bos.', 'interface'),
  toggle('hud.showDamageNumbers', 'Damage Numbers', 'Angka damage melayang.', 'interface'),
  toggle('hud.showEnemyHealth', 'Enemy Health Bars', 'Health bar musuh biasa.', 'interface'),
  toggle('hud.showStatus', 'Status Effect Indicators', 'Ikon buff dan debuff.', 'interface'),
  toggle('hud.showObjective', 'Objective Indicators', 'Penanda objective dunia.', 'interface'),
  toggle('hud.showPrompts', 'Interaction Prompts', 'Prompt interaksi.', 'interface'),
  toggle('hud.showCrosshair', '3D Crosshair', 'Crosshair saat mode 3D.', 'interface'),
  range('hud.opacity', 'HUD Opacity', 'Opacity seluruh HUD.', 20, 100, 5, '%', 'interface'),
  range('hud.scale', 'HUD Scale', 'Skala HUD terpisah dari UI menu.', 70, 150, 5, '%', 'interface'),
  select('hud.position', 'HUD Position', 'Tata letak dasar HUD.', HUD_POSITIONS, 'interface'),
  toggle('hud.combatNotifications', 'Combat Notifications', 'Notifikasi serangan dan phase bos.', 'interface'),
  toggle('hud.lootNotifications', 'Loot Notifications', 'Notifikasi loot dan item.', 'interface'),
  toggle('hud.floatingDamage', 'Floating Damage Numbers', 'Angka damage melayang saat combat.', 'interface'),

  toggle('notifications.master', 'Notifications Master', 'Saklar utama notifikasi.', 'notifications'),
  toggle('notifications.combat', 'Combat Notifications', 'Serangan, phase, dan status combat.', 'notifications'),
  toggle('notifications.loot', 'Loot Notifications', 'Item, ash, dan hadiah.', 'notifications'),
  toggle('notifications.quests', 'Quest Notifications', 'Progres dan penyelesaian quest.', 'notifications'),
  toggle('notifications.system', 'System Notifications', 'Pengaturan, simpan, dan koneksi.', 'notifications'),
  range('notifications.duration', 'Notification Duration', 'Durasi default notifikasi.', 1, 10, 1, ' s', 'notifications'),

  toggle('privacy.telemetry', 'Telemetry', 'Data telemetri anonim lokal; default off.', 'privacy'),
  toggle('privacy.crashReports', 'Crash Reports', 'Menyimpan laporan runtime secara lokal.', 'privacy'),
  select('privacy.onlineStatus', 'Online Status', 'Visibilitas status online.', [{ id: 'everyone', label: 'Semua orang' }, { id: 'friends', label: 'Teman' }, { id: 'offline', label: 'Selalu offline' }], 'privacy'),
  toggle('privacy.crossplay', 'Crossplay', 'Izin crossplay jika relay mendukung.', 'privacy'),
  toggle('privacy.dataSaver', 'Data Saver', 'Menekan kualitas aset dan sinkronisasi.', 'privacy'),

  select('account.profileName', 'Profile Name', 'Nama profil lokal yang ditampilkan di hub.', [{ id: 'Penjaga', label: 'Penjaga' }, { id: 'SealiusHQ', label: 'SealiusHQ' }, { id: 'Warden', label: 'Warden' }], 'account'),
  toggle('account.cloudSave', 'Cloud Save', 'Sinkronisasi cloud hanya bila layanan tersedia.', 'account'),
  toggle('account.syncSettings', 'Sync Settings', 'Sinkronkan pengaturan per profil.', 'account'),

  toggle('advanced.diagnostics', 'Diagnostics Overlay', 'Menampilkan status penerapan tiap pengaturan.', 'advanced'),
  select('advanced.logging', 'Logging Level', 'Tingkat log runtime.', LOG_LEVELS, 'advanced'),
  range('advanced.maxParticles', 'Max Particles', 'Batas keras partikel aktif (hingga 12000).', 100, 12000, 200, '', 'advanced'),
  range('advanced.physicsHz', 'Physics Frequency', 'Frekuensi langkah fisika.', 30, 240, 10, ' Hz', 'advanced'),
  range('advanced.entityBudget', 'Entity Budget', 'Batas entity yang di-update.', 50, 500, 25, '', 'advanced'),
];

export const SETTING_BY_PATH = Object.fromEntries(SETTING_DEFINITIONS.map((entry) => [entry.path, entry]));

export function defaultAudioSettings() {
  return {
    master: 80, music: 55, sfx: 80, ambient: 55, dialogue: 85, combat: 75, ui: 65,
    footsteps: 55, voiceChat: 70, cinematic: 80, muted: false, muteOnBlur: true,
    outputDevice: 'default', spatial: 'stereo', dynamicRange: 'normal', subtitleOffset: 0,
    dialogueSubtitles: true, combatMusic: true, reduceLoudSfx: false,
    channelMutes: { dialogue: false, voiceChat: false },
  };
}

export function defaultGraphicsSettings() {
  return {
    preset: 'high', brightness: 100, contrast: 100, gamma: 100, hdr: 'auto', hdrCalibration: false,
    ...GRAPHICS_PRESETS.high.values, frameRateLimit: 60, vsync: true,
  };
}

export function defaultExtendedSettings() {
  return {
    audio: defaultAudioSettings(),
    graphics: defaultGraphicsSettings(),
    display: {
      mode: 'windowed', resolution: 'auto', refreshRate: 'auto', monitor: 'primary',
      resolutionScaling: 100, safeArea: 0, uiScale: 100, minimizeOnFocusLoss: false,
      showFps: false, showPerformance: false, screenshotFormat: 'png', screenshotQuality: 92,
    },
    controls: {
      mouseSensitivity: 100, controllerSensitivity: 100, cameraSensitivity: 100, aimSensitivity: 100,
      invertX: false, invertY: false, vibration: true, toggleSprint: false, toggleCrouch: false,
      interaction: 'hold', doubleTapWindow: 280, gamepad: true,
    },
    gameplay: {
      difficulty: 'normal', screenShake: 'full', frameCap: 60, fpsCounter: false, gamepad: true,
      autoPickup: true, damageNumbers: 100,
    },
    scary: sanitizeHorrorSettings({}),
    dread: sanitizeDreadSettings({}),
    veil: sanitizeVeilSettings({}),
    eternal: sanitizeEternalSettings({}),
    accessibility: {
      colorblind: 'off', customIndicators: false, subtitleSize: 'normal', subtitleBackground: 70,
      highContrast: false, reduceShake: false, reduceFlashing: false, reduceCameraMotion: false,
      disableMotionBlur: false, holdToInteract: false, simplifiedQTE: false, combatIndicators: true,
      uiNarration: false, textSize: 'normal', profile: 'default',
    },
    language: { interface: 'id', subtitles: 'id', voice: 'id', dialogue: 'id' },
    performance: {
      dynamicResolution: true, backgroundFps: 15, shaderCompilation: 'auto', assetStreaming: 'high',
      particleBudget: 1200, npcUpdateFrequency: 60, animationQuality: 'high', physicsQuality: 'high',
      viewDistance3d: 100, asyncLoading: true,
    },
    hud: {
      showHealth: true, showStamina: true, showMana: true, showMinimap: true, showQuest: true,
      showBoss: true, showDamageNumbers: true, showEnemyHealth: true, showStatus: true,
      showObjective: true, showPrompts: true, showCrosshair: true, opacity: 100, scale: 100,
      position: 'default', combatNotifications: true, lootNotifications: true, floatingDamage: true,
      layout: {},
    },
    notifications: { master: true, combat: true, loot: true, quests: true, system: true, duration: 4 },
    privacy: { telemetry: false, crashReports: true, onlineStatus: 'friends', crossplay: false, dataSaver: false },
    account: { profileName: 'Penjaga', cloudSave: false, syncSettings: true },
    advanced: { diagnostics: false, logging: 'warn', maxParticles: 2400, physicsHz: 120, entityBudget: 300 },
  };
}

export function getSettingsValue(settings, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), settings);
}

export function setSettingsValue(settings, path, value) {
  const parts = path.split('.');
  let node = settings;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
  return settings;
}

export function applyGraphicsPreset(settings, presetId) {
  const preset = GRAPHICS_PRESETS[presetId] ? presetId : 'high';
  const next = settings;
  next.graphics = next.graphics || defaultGraphicsSettings();
  next.graphics.preset = preset;
  if (preset !== 'custom') {
    next.graphics = { ...next.graphics, ...GRAPHICS_PRESETS[preset].values };
  }
  return next;
}

export function markGraphicsCustom(settings) {
  if (settings?.graphics) settings.graphics.preset = 'custom';
  return settings;
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const num = (v, fallback) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const pick = (value, options, fallback) => options.some((entry) => entry.id === String(value)) ? String(value) : fallback;

export function sanitizeExtendedSettings(raw = {}) {
  const defaults = defaultExtendedSettings();
  const source = raw && typeof raw === 'object' ? raw : {};
  const audioRaw = source.audio && typeof source.audio === 'object' ? source.audio : {};
  const graphicsRaw = source.graphics && typeof source.graphics === 'object' ? source.graphics : {};
  const displayRaw = source.display && typeof source.display === 'object' ? source.display : {};
  const controlsRaw = source.controls && typeof source.controls === 'object' ? source.controls : {};
  const gameplayRaw = source.gameplay && typeof source.gameplay === 'object' ? source.gameplay : {};
  const accessibilityRaw = source.accessibility && typeof source.accessibility === 'object' ? source.accessibility : {};
  const languageRaw = source.language && typeof source.language === 'object' ? source.language : {};
  const performanceRaw = source.performance && typeof source.performance === 'object' ? source.performance : {};
  const hudRaw = source.hud && typeof source.hud === 'object' ? source.hud : {};
  const notificationsRaw = source.notifications && typeof source.notifications === 'object' ? source.notifications : {};
  const privacyRaw = source.privacy && typeof source.privacy === 'object' ? source.privacy : {};
  const accountRaw = source.account && typeof source.account === 'object' ? source.account : {};
  const advancedRaw = source.advanced && typeof source.advanced === 'object' ? source.advanced : {};
  const scaryRaw = source.scary && typeof source.scary === 'object' ? source.scary : {};

  const audio = { ...defaults.audio };
  for (const channel of AUDIO_CHANNELS) audio[channel.id] = clamp(Math.round(num(audioRaw[channel.id], defaults.audio[channel.id])), 0, 100);
  audio.muted = Boolean(audioRaw.muted);
  audio.muteOnBlur = audioRaw.muteOnBlur === undefined ? defaults.audio.muteOnBlur : Boolean(audioRaw.muteOnBlur);
  audio.outputDevice = pick(audioRaw.outputDevice, AUDIO_OUTPUTS, defaults.audio.outputDevice);
  audio.spatial = pick(audioRaw.spatial, AUDIO_SPATIAL, defaults.audio.spatial);
  audio.dynamicRange = pick(audioRaw.dynamicRange, DYNAMIC_RANGES, defaults.audio.dynamicRange);
  audio.subtitleOffset = clamp(Math.round(num(audioRaw.subtitleOffset, 0)), -1000, 1000);
  audio.dialogueSubtitles = audioRaw.dialogueSubtitles === undefined ? true : Boolean(audioRaw.dialogueSubtitles);
  audio.combatMusic = audioRaw.combatMusic === undefined ? true : Boolean(audioRaw.combatMusic);
  audio.reduceLoudSfx = Boolean(audioRaw.reduceLoudSfx);
  audio.channelMutes = {
    dialogue: Boolean(audioRaw.channelMutes?.dialogue),
    voiceChat: Boolean(audioRaw.channelMutes?.voiceChat),
  };

  const preset = GRAPHICS_PRESETS[graphicsRaw.preset] ? graphicsRaw.preset : 'high';
  const presetValues = preset === 'custom' ? GRAPHICS_PRESETS.high.values : GRAPHICS_PRESETS[preset].values;
  const graphics = { ...defaults.graphics, ...presetValues, preset };
  const quality = (key, options, fallback) => pick(graphicsRaw[key], options, fallback);
  graphics.brightness = clamp(Math.round(num(graphicsRaw.brightness, 100)), 0, 200);
  graphics.contrast = clamp(Math.round(num(graphicsRaw.contrast, 100)), 0, 200);
  graphics.gamma = clamp(Math.round(num(graphicsRaw.gamma, 100)), 50, 250);
  graphics.hdr = pick(graphicsRaw.hdr, HDR_MODES, 'auto');
  graphics.hdrCalibration = Boolean(graphicsRaw.hdrCalibration);
  graphics.antiAliasing = quality('antiAliasing', AA_MODES, presetsFallback(presetValues.antiAliasing));
  graphics.shadowQuality = quality('shadowQuality', SHADOW_QUALITY, presetsFallback(presetValues.shadowQuality));
  graphics.textureQuality = quality('textureQuality', QUALITY4, presetsFallback(presetValues.textureQuality));
  graphics.lightingQuality = quality('lightingQuality', QUALITY4, presetsFallback(presetValues.lightingQuality));
  graphics.ambientOcclusion = quality('ambientOcclusion', AO_MODES, presetsFallback(presetValues.ambientOcclusion));
  graphics.reflectionQuality = quality('reflectionQuality', QUALITY4, presetsFallback(presetValues.reflectionQuality));
  graphics.volumetricFog = quality('volumetricFog', [{ id: 'off', label: 'Off' }, ...QUALITY4.slice(0, 3)], presetsFallback(presetValues.volumetricFog));
  graphics.particleQuality = quality('particleQuality', QUALITY4, presetsFallback(presetValues.particleQuality));
  graphics.particleMultiplier = clamp(Math.round(num(graphicsRaw.particleMultiplier, presetValues.particleMultiplier ?? 1) * 4) / 4, 0.5, 4);
  graphics.waterQuality = quality('waterQuality', QUALITY4, presetsFallback(presetValues.waterQuality));
  graphics.foliageQuality = quality('foliageQuality', QUALITY4, presetsFallback(presetValues.foliageQuality));
  graphics.viewDistance = quality('viewDistance', VIEW_DISTANCES, presetsFallback(presetValues.viewDistance));
  graphics.postProcessing = quality('postProcessing', POST_QUALITY, presetsFallback(presetValues.postProcessing));
  graphics.motionBlur = quality('motionBlur', MOTION_BLUR, presetsFallback(presetValues.motionBlur));
  graphics.depthOfField = graphicsRaw.depthOfField === undefined ? presetValues.depthOfField === 'on' : Boolean(graphicsRaw.depthOfField);
  graphics.bloom = quality('bloom', BLOOM, presetsFallback(presetValues.bloom));
  graphics.chromaticAberration = graphicsRaw.chromaticAberration === undefined ? presetValues.chromaticAberration === 'on' : Boolean(graphicsRaw.chromaticAberration);
  graphics.lensFlare = graphicsRaw.lensFlare === undefined ? presetValues.lensFlare === 'on' : Boolean(graphicsRaw.lensFlare);
  graphics.screenSpaceReflections = graphicsRaw.screenSpaceReflections === undefined ? presetValues.screenSpaceReflections === 'on' : Boolean(graphicsRaw.screenSpaceReflections);
  graphics.rayTracing = pick(graphicsRaw.rayTracing, [{ id: 'off', label: 'Off' }, { id: 'auto', label: 'Auto' }], 'off');
  graphics.upscaling = quality('upscaling', UPSCALERS, presetsFallback(presetValues.upscaling));
  graphics.renderScale = clamp(Math.round(num(graphicsRaw.renderScale, presetValues.renderScale)), 50, 200);
  graphics.vsync = graphicsRaw.vsync === undefined ? true : Boolean(graphicsRaw.vsync);
  graphics.frameRateLimit = FRAME_LIMITS.includes(Number(graphicsRaw.frameRateLimit)) ? Number(graphicsRaw.frameRateLimit) : 60;
  graphics.anisotropicFiltering = quality('anisotropicFiltering', ANISO, presetsFallback(presetValues.anisotropicFiltering));

  const display = { ...defaults.display };
  display.mode = pick(displayRaw.mode, DISPLAY_MODES, 'windowed');
  display.resolution = displayRaw.resolution || 'auto';
  display.refreshRate = displayRaw.refreshRate || 'auto';
  display.monitor = displayRaw.monitor || 'primary';
  display.resolutionScaling = clamp(Math.round(num(displayRaw.resolutionScaling, 100)), 50, 200);
  display.safeArea = clamp(Math.round(num(displayRaw.safeArea, 0)), 0, 10);
  display.uiScale = clamp(Math.round(num(displayRaw.uiScale, 100)), 70, 150);
  display.minimizeOnFocusLoss = Boolean(displayRaw.minimizeOnFocusLoss);
  display.showFps = Boolean(displayRaw.showFps);
  display.showPerformance = Boolean(displayRaw.showPerformance);
  display.screenshotFormat = pick(displayRaw.screenshotFormat, [{ id: 'png' }, { id: 'jpeg' }, { id: 'webp' }], 'png');
  display.screenshotQuality = clamp(Math.round(num(displayRaw.screenshotQuality, 92)), 10, 100);

  const controls = { ...defaults.controls };
  for (const key of ['mouseSensitivity', 'controllerSensitivity', 'cameraSensitivity', 'aimSensitivity']) {
    controls[key] = clamp(Math.round(num(controlsRaw[key], 100)), 10, 300);
  }
  for (const key of ['invertX', 'invertY', 'vibration', 'toggleSprint', 'toggleCrouch', 'gamepad']) {
    controls[key] = controlsRaw[key] === undefined ? defaults.controls[key] : Boolean(controlsRaw[key]);
  }
  controls.interaction = pick(controlsRaw.interaction, INTERACTION_MODES, 'hold');
  controls.doubleTapWindow = clamp(Math.round(num(controlsRaw.doubleTapWindow, 280)), 120, 500);

  const gameplay = { ...defaults.gameplay };
  gameplay.difficulty = pick(gameplayRaw.difficulty, ['story', 'easy', 'normal', 'hard', 'nightmare', 'abyssal'].map((id) => ({ id })), 'normal');
  gameplay.screenShake = pick(gameplayRaw.screenShake, ['off', 'low', 'full'].map((id) => ({ id })), 'full');
  gameplay.frameCap = FRAME_LIMITS.includes(Number(gameplayRaw.frameCap)) ? Number(gameplayRaw.frameCap) : 60;
  gameplay.fpsCounter = Boolean(gameplayRaw.fpsCounter);
  gameplay.gamepad = gameplayRaw.gamepad === undefined ? true : Boolean(gameplayRaw.gamepad);
  gameplay.autoPickup = gameplayRaw.autoPickup === undefined ? true : Boolean(gameplayRaw.autoPickup);
  gameplay.damageNumbers = clamp(Math.round(num(gameplayRaw.damageNumbers, 100)), 50, 150);

  const accessibility = { ...defaults.accessibility };
  accessibility.colorblind = pick(accessibilityRaw.colorblind, COLORBLIND_MODES, 'off');
  accessibility.customIndicators = Boolean(accessibilityRaw.customIndicators);
  accessibility.subtitleSize = pick(accessibilityRaw.subtitleSize, TEXT_SIZES, 'normal');
  accessibility.subtitleBackground = clamp(Math.round(num(accessibilityRaw.subtitleBackground, 70)), 0, 100);
  for (const key of ['highContrast', 'reduceShake', 'reduceFlashing', 'reduceCameraMotion', 'disableMotionBlur', 'holdToInteract', 'simplifiedQTE', 'combatIndicators', 'uiNarration']) {
    accessibility[key] = accessibilityRaw[key] === undefined ? defaults.accessibility[key] : Boolean(accessibilityRaw[key]);
  }
  accessibility.textSize = pick(accessibilityRaw.textSize, TEXT_SIZES, 'normal');
  accessibility.profile = pick(accessibilityRaw.profile, [{ id: 'default' }, { id: 'low-motion' }, { id: 'high-readability' }], 'default');

  const language = { ...defaults.language };
  for (const key of ['interface', 'subtitles', 'voice', 'dialogue']) {
    language[key] = LANGUAGE_IDS.includes(languageRaw[key]) ? languageRaw[key] : defaults.language[key];
  }

  const performance = { ...defaults.performance };
  performance.dynamicResolution = performanceRaw.dynamicResolution === undefined ? true : Boolean(performanceRaw.dynamicResolution);
  performance.backgroundFps = clamp(Math.round(num(performanceRaw.backgroundFps, 15)), 5, 60);
  performance.shaderCompilation = pick(performanceRaw.shaderCompilation, [{ id: 'auto' }, { id: 'background' }, { id: 'on-demand' }], 'auto');
  performance.assetStreaming = pick(performanceRaw.assetStreaming, STREAMING_QUALITY, 'high');
  performance.particleBudget = clamp(Math.round(num(performanceRaw.particleBudget, 1200)), 100, 6000);
  performance.npcUpdateFrequency = clamp(Math.round(num(performanceRaw.npcUpdateFrequency, 60)), 10, 120);
  performance.animationQuality = pick(performanceRaw.animationQuality, QUALITY4, 'high');
  performance.physicsQuality = pick(performanceRaw.physicsQuality, QUALITY4, 'high');
  performance.viewDistance3d = clamp(Math.round(num(performanceRaw.viewDistance3d, 100)), 40, 150);
  performance.asyncLoading = performanceRaw.asyncLoading === undefined ? true : Boolean(performanceRaw.asyncLoading);

  const hud = { ...defaults.hud };
  for (const key of Object.keys(defaults.hud)) {
    if (typeof defaults.hud[key] === 'boolean') hud[key] = hudRaw[key] === undefined ? defaults.hud[key] : Boolean(hudRaw[key]);
  }
  hud.opacity = clamp(Math.round(num(hudRaw.opacity, 100)), 20, 100);
  hud.scale = clamp(Math.round(num(hudRaw.scale, 100)), 70, 150);
  hud.position = pick(hudRaw.position, HUD_POSITIONS, 'default');
  hud.layout = hudRaw.layout && typeof hudRaw.layout === 'object' ? { ...hudRaw.layout } : {};

  const notifications = { ...defaults.notifications };
  for (const key of ['master', 'combat', 'loot', 'quests', 'system']) notifications[key] = notificationsRaw[key] === undefined ? defaults.notifications[key] : Boolean(notificationsRaw[key]);
  notifications.duration = clamp(Math.round(num(notificationsRaw.duration, 4)), 1, 10);

  const privacy = { ...defaults.privacy };
  privacy.telemetry = Boolean(privacyRaw.telemetry);
  privacy.crashReports = privacyRaw.crashReports === undefined ? true : Boolean(privacyRaw.crashReports);
  privacy.onlineStatus = pick(privacyRaw.onlineStatus, [{ id: 'everyone' }, { id: 'friends' }, { id: 'offline' }], 'friends');
  privacy.crossplay = Boolean(privacyRaw.crossplay);
  privacy.dataSaver = Boolean(privacyRaw.dataSaver);

  const account = { ...defaults.account };
  account.profileName = ['Penjaga', 'SealiusHQ', 'Warden'].includes(accountRaw.profileName) ? accountRaw.profileName : 'Penjaga';
  account.cloudSave = Boolean(accountRaw.cloudSave);
  account.syncSettings = accountRaw.syncSettings === undefined ? true : Boolean(accountRaw.syncSettings);

  const advanced = { ...defaults.advanced };
  advanced.diagnostics = Boolean(advancedRaw.diagnostics);
  advanced.logging = pick(advancedRaw.logging, LOG_LEVELS, 'warn');
  advanced.maxParticles = clamp(Math.round(num(advancedRaw.maxParticles, 2400)), 100, 12000);
  advanced.physicsHz = clamp(Math.round(num(advancedRaw.physicsHz, 120)), 30, 240);
  advanced.entityBudget = clamp(Math.round(num(advancedRaw.entityBudget, 300)), 50, 500);

  const scary = sanitizeHorrorSettings(scaryRaw);
  const dread = sanitizeDreadSettings(source.dread);
  const veil = sanitizeVeilSettings(source.veil);
  const eternal = sanitizeEternalSettings(source.eternal);

  return { audio, graphics, display, controls, gameplay, scary, dread, veil, eternal, accessibility, language, performance, hud, notifications, privacy, account, advanced };
}

function presetsFallback(value) { return value; }

export function searchSettings(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  return SETTING_DEFINITIONS.filter((entry) =>
    entry.label.toLowerCase().includes(q) || entry.desc.toLowerCase().includes(q) || entry.path.toLowerCase().includes(q),
  );
}

export function settingsForCategory(category) {
  return SETTING_DEFINITIONS.filter((entry) => entry.category === category);
}
