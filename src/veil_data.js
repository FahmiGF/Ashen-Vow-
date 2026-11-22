// Update XIII — The Veil of the Forgotten: static content.
// Pure data only (no DOM, no core imports) so both the shell and the tests can
// use the same tables without a module cycle.

export const VEIL_ARC = 'Update XIII';
export const VEIL_SAVE_KEY = 'ashen-vow-veil-v1';
export const VEIL_SAVE_VERSION = 2;

export const VEIL_TABS = [
  { id: 'campaign', label: 'Kampanye' },
  { id: 'sanity', label: 'Sanity 2.0' },
  { id: 'index', label: 'Ghost Index' },
  { id: 'investigation', label: 'Investigasi' },
  { id: 'hub', label: 'Refuge' },
  { id: 'mind', label: 'Mind & Spirit' },
  { id: 'progress', label: 'Progres' },
  { id: 'settings', label: 'Pengaturan' },
];

const chapter = (id, index, name, subtitle, mechanic, boss, palette, zone, stages, secret) => ({
  id, index, name, subtitle, mechanic, boss, palette, zone, stages, secret, locked: index > 0,
});

export const VEIL_CHAPTERS = [
  chapter('vesper_hollow', 0, 'Vesper Hollow', 'Desa yang Lupa Berpulang', 'shifting_doors', 'pale_mayor',
    { top: '#080a10', mid: '#131a22', low: '#1d2730', glow: '#9fb8c8', fog: '#22303c' }, 'haunted',
    ['Lorong Lonceng Mati', 'Rumah Janda', 'Sumur Tanpa Bayangan', 'Balai Kota Terkubur', 'Jalan Pulang'],
    'the_seventh_bell'),
  chapter('mourning_hospital', 1, 'Mourning Hospital', 'Rumah Sakit yang Menolak Mati', 'flickering_lights', 'silent_surgeon',
    { top: '#080c0c', mid: '#121c1b', low: '#1b2a27', glow: '#9ec9ba', fog: '#1f3330' }, 'haunted',
    ['Ruang Tunggu Beku', 'Koridor Lantai Tiga', 'Kamar Operasi Tua', 'Gudang Rekam Medis', 'Ruang Isolasi'],
    'ward_zero'),
  chapter('blackwood', 2, 'Blackwood', 'Hutan yang Mengingat Namamu', 'hungry_forest', 'forest_widow',
    { top: '#070b07', mid: '#121a10', low: '#1d2a17', glow: '#a7c184', fog: '#26351f' }, 'haunted',
    ['Jejak Pemburu', 'Pohon Tujuh', 'Kemah Kosong', 'Sungai Berlumpur', 'Pintu Keluar Hutan'],
    'hollow_heart'),
  chapter('sunken_cathedral', 3, 'Sunken Cathedral', 'Katedral di Bawah Air', 'rising_water', 'drowned_saint',
    { top: '#060b10', mid: '#0f1a24', low: '#172838', glow: '#8fb6d6', fog: '#1c3042' }, 'flooded',
    ['Tangga Tenggelam', 'Nave Bocor', 'Ruang Relik', 'Menara Lonceng Basah', 'Altar Dalam'],
    'the_drowned_bell'),
  chapter('house_beyond_time', 4, 'House Beyond Time', 'Rumah yang Tidak Pernah Selesai', 'looping_hall', 'unremembered',
    { top: '#0b0810', mid: '#191122', low: '#251a31', glow: '#b79ad6', fog: '#322442' }, 'veil',
    ['Ruang Tamu Berulang', 'Jam Tanpa Jarum', 'Kamar Tidur Terkunci', 'Loteng Cermin', 'Pintu yang Belum Ada'],
    'room_zero_key'),
  chapter('veil_citadel', 5, 'Veil Citadel', 'Benteng di Balik Tabir', 'veil_collapse', 'veil_guardian',
    { top: '#090812', mid: '#151226', low: '#211b38', glow: '#a99be8', fog: '#2c2549' }, 'veil',
    ['Gerbang Tabir', 'Aula Penjaga', 'Arsip Hilang', 'Tangga Tanpa Ujung', 'Puncak Tabir'],
    'citadel_core'),
];

export const VEIL_CHAPTER_IDS = VEIL_CHAPTERS.map((c) => c.id);
export const VEIL_CHAPTERS_BY_ID = Object.fromEntries(VEIL_CHAPTERS.map((c) => [c.id, c]));

const ARCHETYPE_SETS = [
  ['crawler', 'sentinel', 'wraith', 'brute'],
  ['sentinel', 'wraith', 'crawler', 'brute'],
  ['wraith', 'crawler', 'sentinel', 'brute'],
  ['brute', 'sentinel', 'wraith', 'crawler'],
  ['crawler', 'wraith', 'sentinel', 'brute'],
  ['sentinel', 'brute', 'crawler', 'wraith'],
];

const OBJECTIVES = ['Investigasi lokasi', 'Kumpulkan bukti', 'Selamatkan saksi', 'Tutup celah tabir', 'Dokumentasikan entitas'];

export const VEIL_STAGES = VEIL_CHAPTERS.flatMap((chapterDef, ci) =>
  chapterDef.stages.map((name, si) => {
    const localIndex = si;
    const index = ci * 5 + si;
    return {
      id: `${chapterDef.id}_${si + 1}`,
      index,
      localIndex,
      chapter: chapterDef.id,
      chapterIndex: ci,
      chapterName: chapterDef.name,
      number: si + 1,
      name,
      room: 9400 + index,
      archetypes: ARCHETYPE_SETS[ci],
      enemyCount: 20,
      eliteCount: 1,
      objective: OBJECTIVES[(ci + si) % OBJECTIVES.length],
      investigation: si === 2 || si === 4,
      secret: si === 4,
      bossStage: false,
      zone: chapterDef.zone,
      sanityDrain: 1 + ci * 0.15,
      reward: { spiritShards: 40 + ci * 12, veilFragments: 6 + ci * 2, investigationMarks: 1 },
    };
  }),
);

export const VEIL_STAGE_IDS = VEIL_STAGES.map((s) => s.id);
export const VEIL_STAGES_BY_ID = Object.fromEntries(VEIL_STAGES.map((s) => [s.id, s]));

export const stagesForChapter = (chapterId) => VEIL_STAGES.filter((s) => s.chapter === chapterId);

// ---------------------------------------------------------------------------
// Bosses
// ---------------------------------------------------------------------------
const dialogue = (intro, phases, defeat) => {
  // Core's emitBossDialogue expects every entry to be a list of lines.
  const lines = (value) => (Array.isArray(value) ? value : [value]);
  const out = { intro: lines(intro), defeat: lines(defeat) };
  phases.forEach((line, i) => { out[`phase${i + 2}`] = lines(line); });
  return out;
};

const boss = (id, chapterId, name, title, maxHp, maxPhases, thresholds, dialogueData, patterns, extra = {}) => ({
  id, chapterId, name, title, maxHp, maxPhases, phaseThresholds: thresholds, dialogueData, patterns,
  reward: { spiritShards: 250, veilFragments: 40, ancientSeals: 1 }, ...extra,
});

export const VEIL_BOSSES = [
  boss('pale_mayor', 'vesper_hollow', 'Walikota Pucat', 'The Pale Mayor of Vesper Hollow', 2200, 3, [0.66, 0.33],
    dialogue('Kau terlambat empat puluh tahun, Penyidik.', ['Desa ini sudah memilih untuk melupakan.', 'Lonceng terakhir akan memanggilmu juga.'], 'Aku hanya ingin diingat.'),
    ['summon_residents', 'bell_wave', 'door_slam']),
  boss('silent_surgeon', 'mourning_hospital', 'Dokter Tanpa Wajah', 'The Silent Surgeon', 2600, 3, [0.7, 0.4],
    dialogue('Pasien baru. Bagus. Kita kekurangan bagian tubuh.', ['Jangan bergerak. Ini akan terasa seperti kenangan.', 'Meja operasi tidak pernah kehabisan pasien.'], 'Operasi... selesai.'),
    ['scalpel_volley', 'anaesthetic_cloud', 'gurney_charge']),
  boss('forest_widow', 'blackwood', 'Janda Hitam', 'The Blackwood Widow', 3000, 4, [0.75, 0.5, 0.25],
    dialogue('Hutan mencatat setiap nama yang kau lupakan.', ['Akar-akarku hafal langkahmu.', 'Kau akan tumbuh di sini, bersama yang lain.', 'Tidak ada jalan pulang yang benar.'], 'Hutan... tetap mengingat.'),
    ['root_grasp', 'widow_web', 'lantern_swarm', 'canopy_drop']),
  boss('drowned_saint', 'sunken_cathedral', 'Santo Tenggelam', 'The Drowned Saint', 3400, 4, [0.75, 0.5, 0.25],
    dialogue('Air tidak membaptis. Air menyimpan.', ['Naiklah. Setiap anak tangga menambah berat dosamu.', 'Lonceng basah berbunyi untukmu.', 'Tenggelam adalah bentuk pengampunan.'], 'Akhirnya... tenang.'),
    ['tide_surge', 'bell_ripple', 'choir_wave', 'abyss_pull']),
  boss('unremembered', 'house_beyond_time', 'Yang Tak Terkenang', 'The Unremembered', 3800, 4, [0.8, 0.55, 0.3],
    dialogue('Aku sudah menjadi kau sebelum kau lahir.', ['Rumah ini mengulang kesalahanmu.', 'Setiap cermin adalah pintu yang kuciptakan.', 'Kau tidak pernah keluar dari ruang tamu.'], 'Kalau aku dilupakan... apakah aku pernah ada?'),
    ['loop_hall', 'mirror_split', 'clock_reverse', 'guest_swarm']),
  boss('veil_guardian', 'veil_citadel', 'Penjaga Tabir', 'The Veil Guardian', 4200, 4, [0.8, 0.6, 0.35],
    dialogue('Tabir tidak dijaga untuk menahan mereka. Tabir dijaga untuk menahanmu.', ['Kau membawa terlalu banyak ingatan.', 'Setiap bukti yang kau kumpulkan menusuk tabir.', 'Aku adalah pintu terakhir.'], 'Tabir... terbuka.'),
    ['veil_slash', 'threshold_wall', 'warden_summon', 'collapse']),
  boss('veil_architect', 'veil_citadel', 'Arsitek Tabir', 'The Veil Architect', 6000, 5, [0.8, 0.6, 0.4, 0.2],
    dialogue('Kau menyusun arsip tentang hal-hal yang seharusnya tidak bernama.', ['Bab pertama: rasa ingin tahu.', 'Bab kedua: kesombongan.', 'Bab ketiga: kau menyebut namaku.', 'Bab terakhir tidak akan kau tulis.'], 'Tuliskan... bahwa aku pernah ada.'),
    ['veil_lattice', 'name_erase', 'architect_hand', 'forgotten_army', 'final_page'], { final: true, arena: 'veil_citadel' }),
];

export const VEIL_BOSS_IDS = VEIL_BOSSES.map((b) => b.id);
export const VEIL_BOSSES_BY_ID = Object.fromEntries(VEIL_BOSSES.map((b) => [b.id, b]));
export const veilBossProfile = (id) => VEIL_BOSSES_BY_ID[id] || null;
export const FINAL_VEIL_BOSS = 'veil_architect';

// ---------------------------------------------------------------------------
// Sanity 2.0 — never lethal, never takes control away.
// ---------------------------------------------------------------------------
export const SANITY_MAX = 100;
export const SANITY_DEFAULT = 82;

export const SANITY_CONDITIONS = [
  { id: 'veil_touched', label: 'Veil Touched', min: 0, max: 0, band: 0, color: '#b06bd8', safe: false,
    effects: { whisper: true, rescueEncounter: true, recovery: 'veil_anchor', combat: 'normal' } },
  { id: 'critical', label: 'Critical', min: 1, max: 14, band: 1, color: '#c46a5a', safe: false,
    effects: { distortion: 2, audio: 2, hiddenClueChance: 0.25, recovery: 'grounding_station' } },
  { id: 'unsettled', label: 'Unsettled', min: 15, max: 29, band: 2, color: '#c99a5c', safe: false,
    effects: { distortion: 1.5, audio: 1.5, hiddenClueChance: 0.15, recovery: 'breathing' } },
  { id: 'disturbed', label: 'Disturbed', min: 30, max: 49, band: 3, color: '#c8b46a', safe: false,
    effects: { distortion: 1, audio: 1, hiddenClueChance: 0.08, recovery: 'consumable' } },
  { id: 'uneasy', label: 'Uneasy', min: 50, max: 69, band: 4, color: '#9fbf87', safe: true,
    effects: { distortion: 0.5, audio: 0.5, hiddenClueChance: 0.04 } },
  { id: 'stable', label: 'Stable', min: 70, max: 89, band: 5, color: '#86b6c9', safe: true, effects: {} },
  { id: 'clear', label: 'Clear', min: 90, max: 100, band: 6, color: '#8fd0a8', safe: true, effects: {} },
];

export const sanityCondition = (value) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return SANITY_CONDITIONS.find((c) => v >= c.min && v <= c.max) || SANITY_CONDITIONS[0];
};

export const SANITY_ZONES = {
  safe: { id: 'safe', label: 'Refuge', rate: 3.2, kind: 'recovery' },
  neutral: { id: 'neutral', label: 'Netral', rate: -0.25, kind: 'drain' },
  haunted: { id: 'haunted', label: 'Haunted', rate: -0.9, kind: 'drain' },
  haunted_heavy: { id: 'haunted_heavy', label: 'Haunted Berat', rate: -1.6, kind: 'drain' },
  veil: { id: 'veil', label: 'Veil', rate: -2.2, kind: 'drain' },
  flooded: { id: 'flooded', label: 'Flooded', rate: -1.25, kind: 'drain' },
  channel: { id: 'channel', label: 'Saluran', rate: -1.1, kind: 'drain' },
};

export const SANITY_EVENTS = {
  safe_room: { delta: 12, cooldown: 20, label: 'Ruang aman' },
  recovery_zone: { delta: 6, cooldown: 10, label: 'Zona pemulihan' },
  grounding_station: { delta: 18, cooldown: 45, label: 'Grounding station' },
  investigation_complete: { delta: 14, cooldown: 15, label: 'Investigasi selesai' },
  protection_relic: { delta: 20, cooldown: 60, label: 'Relik pelindung' },
  memory_fragment: { delta: 8, cooldown: 12, label: 'Fragmen memori' },
  discovery: { delta: 5, cooldown: 8, label: 'Penemuan' },
  haunted_room: { delta: -8, cooldown: 12, label: 'Ruang berhantu' },
  supernatural_zone: { delta: -6, cooldown: 10, label: 'Zona supernatural' },
  powerful_entity: { delta: -12, cooldown: 18, label: 'Entitas kuat' },
  chapter_objective: { delta: -7, cooldown: 15, label: 'Objek bab' },
  boss_encounter: { delta: -15, cooldown: 40, label: 'Pertemuan bos' },
  veil_encounter: { delta: -10, cooldown: 20, label: 'Pertemuan tabir' },
  consumable: { delta: 0, cooldown: 0, label: 'Konsumsi' },
};

export const SANITY_CONSUMABLES = [
  { id: 'breathing_tonic', name: 'Tonik Napas', restore: 18, cooldown: 20, stack: 8, cost: { spiritShards: 30 }, description: 'Menstabilkan napas dan mengurangi distorsi selama 20 detik.' },
  { id: 'memory_salt', name: 'Garam Memori', restore: 12, cooldown: 15, stack: 10, cost: { spiritShards: 22 }, clearsCondition: 'whisper', description: 'Menyerap bisikan halus di sekitar penyidik.' },
  { id: 'lantern_oil', name: 'Minyak Lentera', restore: 22, cooldown: 30, stack: 6, cost: { veilFragments: 6 }, description: 'Menerangi sudut gelap dan memulihkan ketenangan.' },
  { id: 'warm_tea', name: 'Teh Hangat', restore: 10, cooldown: 10, stack: 12, cost: { spiritShards: 14 }, description: 'Pemulihan kecil yang bisa dipakai sering.' },
  { id: 'grounding_charm', name: 'Jimat Grounding', restore: 30, cooldown: 45, stack: 4, cost: { investigationMarks: 3 }, description: 'Jangkar spiritual sekali pakai; sangat kuat di zona tabir.' },
  { id: 'veil_anchor', name: 'Jangkar Tabir', restore: 55, cooldown: 90, stack: 2, cost: { veilFragments: 18 }, description: 'Mengembalikan penyidik dari kondisi Veil Touched tanpa kehilangan kontrol.' },
];
export const SANITY_CONSUMABLES_BY_ID = Object.fromEntries(SANITY_CONSUMABLES.map((c) => [c.id, c]));

export const TEMP_CONDITIONS = [
  { id: 'whisper', label: 'Bisikan', duration: 18, stack: false, effect: 'audio' },
  { id: 'chill', label: 'Hawa Dingin', duration: 24, stack: true, maxStacks: 3, effect: 'slow' },
  { id: 'blurred_vision', label: 'Pandangan Kabur', duration: 15, stack: false, effect: 'distortion' },
  { id: 'tremor', label: 'Gemetar', duration: 12, stack: false, effect: 'aim' },
  { id: 'heartbeat', label: 'Jantung Berdebar', duration: 20, stack: false, effect: 'audio' },
  { id: 'veil_static', label: 'Statik Tabir', duration: 10, stack: true, maxStacks: 2, effect: 'distortion' },
];

export const MIND_UPGRADES = [
  { id: 'mental_anchor', name: 'Jangkar Mental', branch: 'spirit', maxRank: 3, cost: 1, requires: [], effect: 'sanityDrain', perRank: 0.06, description: 'Mengurangi pengurasan sanity 6% per rank.' },
  { id: 'calm_presence', name: 'Kehadiran Tenang', branch: 'spirit', maxRank: 3, cost: 1, requires: ['mental_anchor'], effect: 'sanityRecovery', perRank: 0.08, description: 'Pemulihan sanity +8% per rank.' },
  { id: 'memory_keeper', name: 'Penjaga Memori', branch: 'mind', maxRank: 3, cost: 1, requires: [], effect: 'indexXp', perRank: 0.1, description: 'XP Ghost Index +10% per rank.' },
  { id: 'ghost_scholar', name: 'Sarjana Hantu', branch: 'mind', maxRank: 2, cost: 2, requires: ['memory_keeper'], effect: 'evidenceRadius', perRank: 1.2, description: 'Jangkauan deteksi bukti +20% per rank.' },
  { id: 'veil_resistance', name: 'Resistensi Tabir', branch: 'spirit', maxRank: 2, cost: 2, requires: ['calm_presence'], effect: 'veilDamage', perRank: -0.1, description: 'Efek zona tabir -10% per rank.' },
  { id: 'investigators_focus', name: 'Fokus Penyidik', branch: 'mind', maxRank: 3, cost: 1, requires: [], effect: 'attackCooldown', perRank: -0.05, description: 'Cooldown serangan hantu terhadapmu +5% lebih lambat.' },
  { id: 'guardian_bond', name: 'Ikatan Penjaga', branch: 'spirit', maxRank: 2, cost: 2, requires: ['veil_resistance'], effect: 'ghostCalm', perRank: 0.08, description: 'Peluang hantu menjadi pasif +8% per rank.' },
  { id: 'archive_instinct', name: 'Naluri Arsip', branch: 'mind', maxRank: 2, cost: 2, requires: ['ghost_scholar'], effect: 'missionReward', perRank: 0.1, description: 'Hadiah misi +10% per rank.' },
];
export const MIND_UPGRADE_IDS = MIND_UPGRADES.map((u) => u.id);

// ---------------------------------------------------------------------------
// Ghost Index 2.0 — 36 standard + 6 secret records.
// ---------------------------------------------------------------------------
export const GHOST_CLASSIFICATIONS = [
  { id: 'wraith', label: 'Wraiths', color: '#c46a5a', icon: 'flame' },
  { id: 'apparition', label: 'Apparitions', color: '#9ec9ba', icon: 'veil' },
  { id: 'phantom', label: 'Phantoms', color: '#b79ad6', icon: 'mask' },
  { id: 'shade', label: 'Shades', color: '#7f92a8', icon: 'shadow' },
  { id: 'lost_spirit', label: 'Lost Spirits', color: '#c8b46a', icon: 'lantern' },
  { id: 'ancient_entity', label: 'Ancient Entities', color: '#d08a5a', icon: 'sigil' },
  // Update XIV classifications.
  { id: 'revenant', label: 'Revenants', color: '#b08a7a', icon: 'blade' },
  { id: 'wisp', label: 'Wisps', color: '#e0d08a', icon: 'spark' },
  { id: 'aberration', label: 'Aberrations', color: '#c37ad0', icon: 'fracture' },
  { id: 'spectral_beast', label: 'Spectral Beasts', color: '#8ab08a', icon: 'claw' },
  { id: 'mimic', label: 'Mimics', color: '#b0a090', icon: 'mirror' },
  { id: 'primordial', label: 'Primordial Spirits', color: '#d0b070', icon: 'void' },
];
export const GHOST_CLASSIFICATION_IDS = GHOST_CLASSIFICATIONS.map((c) => c.id);
export const GHOST_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'unknown'];
export const GHOST_VARIANTS = ['forgotten', 'ancient', 'corrupted', 'guardian', 'echo', 'seasonal'];
export const GHOST_RESEARCH_STAGES = ['rumored', 'encountered', 'identified', 'investigated', 'documented', 'mastered'];
export const EVIDENCE_TYPES = [
  { id: 'visual', label: 'Visual', icon: 'eye' },
  { id: 'audio', label: 'Audio', icon: 'wave' },
  { id: 'environmental', label: 'Environmental', icon: 'leaf' },
  { id: 'document', label: 'Document', icon: 'page' },
  { id: 'trace', label: 'Trace', icon: 'dust' },
  { id: 'witness', label: 'Witness', icon: 'person' },
  { id: 'behavior', label: 'Behavior', icon: 'path' },
  { id: 'boss_record', label: 'Boss Record', icon: 'crown' },
];
export const EVIDENCE_TYPE_IDS = EVIDENCE_TYPES.map((e) => e.id);

const ghost = (id, name, classification, chapterId, rarity, location, behavior, weakness, extra = {}) => ({
  id, name, classification, chapter: chapterId, rarity, location, behavior, weakness,
  variant: null, secret: false, xp: 30, ...extra,
});

const GHOST_SEED = [
  ghost('pale_resident', 'Penduduk Pucat', 'lost_spirit', 'vesper_hollow', 'common', 'Vesper Hollow', 'Berjalan pelan di jalan yang sama', 'Mendengar namanya disebut'),
  ghost('window_watcher', 'Pengintai Jendela', 'apparition', 'vesper_hollow', 'uncommon', 'Rumah Janda', 'Mengamati dari balik kaca', 'Cahaya lentera'),
  ghost('forgotten_child', 'Anak yang Terlupa', 'lost_spirit', 'vesper_hollow', 'common', 'Sumur Tanpa Bayangan', 'Bersembunyi lalu menghilang', 'Mainan tua'),
  ghost('hollow_walker', 'Pejalan Kosong', 'wraith', 'vesper_hollow', 'common', 'Lorong Lonceng Mati', 'Mengikuti tanpa suara', 'Lonceng perak'),
  ghost('bell_ringer', 'Penabuh Lonceng', 'wraith', 'vesper_hollow', 'uncommon', 'Menara Lonceng', 'Menabuh pola berulang', 'Memotong pola bunyi'),
  ghost('empty_chair', 'Kursi Kosong', 'apparition', 'vesper_hollow', 'rare', 'Balai Kota Terkubur', 'Duduk diam sampai didekati', 'Menawarkan kursi lain'),
  ghost('silent_physician', 'Dokter Bisu', 'phantom', 'mourning_hospital', 'rare', 'Kamar Operasi Tua', 'Mengikuti prosedur usang', 'Rekam medis lengkap'),
  ghost('empty_patient', 'Pasien Kosong', 'apparition', 'mourning_hospital', 'uncommon', 'Ruang Tunggu Beku', 'Menunggu panggilan tak ada', 'Menyebut nomor antrean'),
  ghost('corridor_shade', 'Bayangan Koridor', 'shade', 'mourning_hospital', 'common', 'Koridor Lantai Tiga', 'Memanjang di sudut pandang', 'Lampu darurat'),
  ghost('night_nurse', 'Perawat Malam', 'lost_spirit', 'mourning_hospital', 'rare', 'Ruang Isolasi', 'Memeriksa ranjang kosong', 'Jadwal jaga asli'),
  ghost('grinning_tenant', 'Penyewa Menyeringai', 'phantom', 'mourning_hospital', 'rare', 'Gudang Rekam Medis', 'Menghadang di pintu', 'Berkas yang menyebut namanya'),
  ghost('anaesthetic_echo', 'Gema Anestesi', 'lost_spirit', 'mourning_hospital', 'uncommon', 'Ruang Pemulihan', 'Membuat kantuk mendadak', 'Suara detak jantung'),
  ghost('forest_widow', 'Janda Hitam', 'ancient_entity', 'blackwood', 'legendary', 'Pohon Tujuh', 'Mengawasi dari kanopi', 'Nama yang diucapkan benar'),
  ghost('rootbound_spirit', 'Roh Terikat Akar', 'wraith', 'blackwood', 'uncommon', 'Jejak Pemburu', 'Menyeret kaki di tanah', 'Memutus akar pusat'),
  ghost('wandering_lantern', 'Lentera Berjalan', 'apparition', 'blackwood', 'rare', 'Sungai Berlumpur', 'Menuntun ke arah salah', 'Membalik arah lentera'),
  ghost('hollow_stag', 'Rusa Berongga', 'phantom', 'blackwood', 'rare', 'Kemah Kosong', 'Berlari tanpa suara', 'Menabuh genderang'),
  ghost('bark_watcher', 'Pengawas Kulit Kayu', 'shade', 'blackwood', 'uncommon', 'Hutan Dalam', 'Melebur dengan batang', 'Menandai batang asli'),
  ghost('lost_trail_spirit', 'Roh Jejak Hilang', 'lost_spirit', 'blackwood', 'common', 'Jejak Pemburu', 'Mengulang rute lama', 'Peta pemburu'),
  ghost('drowned_saint', 'Santo Tenggelam', 'ancient_entity', 'sunken_cathedral', 'legendary', 'Altar Dalam', 'Berdiri di air pasang', 'Lonceng kering'),
  ghost('sunken_choir', 'Paduan Suara Tenggelam', 'lost_spirit', 'sunken_cathedral', 'rare', 'Nave Bocor', 'Bernyanyi di bawah air', 'Nada sumbang'),
  ghost('broken_priest', 'Pendeta Patah', 'phantom', 'sunken_cathedral', 'uncommon', 'Ruang Relik', 'Berdoa terbalik', 'Relik yang tidak dicemari'),
  ghost('deepwater_shade', 'Bayangan Air Dalam', 'shade', 'sunken_cathedral', 'uncommon', 'Tangga Tenggelam', 'Bergerak di bawah permukaan', 'Menguras genangan'),
  ghost('altar_wraith', 'Wraith Altar', 'wraith', 'sunken_cathedral', 'rare', 'Altar Dalam', 'Menjaga relik terkutuk', 'Memindahkan relik'),
  ghost('drowned_bell_apparition', 'Gema Lonceng Basah', 'apparition', 'sunken_cathedral', 'common', 'Menara Lonceng Basah', 'Berbunyi saat dilihat', 'Menyumbat lonceng'),
  ghost('unremembered', 'Yang Tak Terkenang', 'ancient_entity', 'house_beyond_time', 'legendary', 'Ruang Tamu Berulang', 'Mengulang percakapan lama', 'Menyebut tanggal kelahiranmu'),
  ghost('mirror_guest', 'Tamu Cermin', 'apparition', 'house_beyond_time', 'rare', 'Loteng Cermin', 'Meniru gerakanmu', 'Memecahkan cermin sumber'),
  ghost('clockbound_spirit', 'Roh Terikat Jam', 'wraith', 'house_beyond_time', 'rare', 'Jam Tanpa Jarum', 'Muncul tiap menit ganjil', 'Memutar jarum cadangan'),
  ghost('forgotten_twin', 'Kembaran Terlupa', 'phantom', 'house_beyond_time', 'epic', 'Kamar Tidur Terkunci', 'Mengambil wujudmu', 'Memanggil nama aslimu'),
  ghost('guest_of_room_zero', 'Tamu Kamar Nol', 'lost_spirit', 'house_beyond_time', 'uncommon', 'Pintu yang Belum Ada', 'Mengetuk dari sisi lain', 'Kunci kamar nol'),
  ghost('unlit_chandelier', 'Lampu Gantung Padam', 'shade', 'house_beyond_time', 'common', 'Ruang Tamu Berulang', 'Meredupkan ruangan', 'Menyalakan lilin keenam'),
  ghost('veil_guardian', 'Penjaga Tabir', 'ancient_entity', 'veil_citadel', 'legendary', 'Aula Penjaga', 'Menghadang di ambang', 'Segel penjaga'),
  ghost('black_herald', 'Pembawa Kabar Hitam', 'wraith', 'veil_citadel', 'epic', 'Gerbang Tabir', 'Mengumumkan kedatanganmu', 'Memotong kalimatnya'),
  ghost('silent_observer', 'Pengamat Diam', 'apparition', 'veil_citadel', 'rare', 'Arsip Hilang', 'Mencatat setiap gerak', 'Menutup buku catatan'),
  ghost('lost_knight', 'Ksatria Hilang', 'phantom', 'veil_citadel', 'epic', 'Tangga Tanpa Ujung', 'Berbaris tanpa henti', 'Mengembalikan lambangnya'),
  ghost('veil_archivist', 'Arsiparis Tabir', 'lost_spirit', 'veil_citadel', 'rare', 'Arsip Hilang', 'Menyortir berkas tak ada', 'Menyerahkan berkas kunci'),
  ghost('threshold_shade', 'Bayangan Ambang', 'shade', 'veil_citadel', 'uncommon', 'Puncak Tabir', 'Menutup pintu yang terbuka', 'Membuka dua pintu sekaligus'),
  // Update XVI — The Unwritten Wing.
  ghost('ink_scholar', 'Cendekia Tinta', 'lost_spirit', 'unwritten_wing', 'rare', 'Lembar Kosong', 'Menulis di udara tanpa pena', 'Menyebut judul halaman'),
  ghost('margin_stalker', 'Pemburu Margin', 'aberration', 'unwritten_wing', 'epic', 'Rak yang Bernapas', 'Bergerak di sela baris', 'Menutup buku sumber'),
  ghost('erased_reader', 'Pembaca Terhapus', 'lost_spirit', 'unwritten_wing', 'uncommon', 'Nama yang Dihapus', 'Membaca nama yang tak ada', 'Mengembalikan nama aslinya'),
  ghost('footnote_wisp', 'Api Catatan Kaki', 'wisp', 'unwritten_wing', 'common', 'Pintu Tanpa Halaman', 'Berkedip mengikuti nomor halaman', 'Membalik halaman terakhir'),
  ghost('blank_archivist', 'Arsiparis Kosong', 'mimic', 'unwritten_wing', 'rare', 'Rak yang Bernapas', 'Menyamar sebagai katalog', 'Meminta nomor arsip yang salah'),
  ghost('redaction_hound', 'Anjing Redaksi', 'spectral_beast', 'unwritten_wing', 'rare', 'Tinta yang Mengalir', 'Memburu tinta yang lolos', 'Menutup tinta sumber'),
  ghost('seventh_draft', 'Draf Ketujuh', 'revenant', 'unwritten_wing', 'epic', 'Pintu Tanpa Halaman', 'Mengulang draf yang sama', 'Menyerahkan draf pertama'),
  ghost('unwritten_choir', 'Paduan Tak Tertulis', 'primordial', 'unwritten_wing', 'legendary', 'Pintu Tanpa Halaman', 'Bernyanyi tanpa teks', 'Menutup seluruh halaman'),
];

const SECRET_GHOST_SEED = [
  ghost('pale_courtier', 'Bangsawan Pucat', 'wraith', 'vesper_hollow', 'mythic', 'Balai Kota Terkubur', 'Menyapa dengan nama masa lalu', 'Menyebut sumpah yang belum terjadi', { secret: true, variant: 'forgotten', xp: 120 }),
  ghost('surgeon_without_shadow', 'Dokter Tanpa Bayangan', 'phantom', 'mourning_hospital', 'legendary', 'Kamar Operasi Tua', 'Beroperasi pada bayangan', 'Cahaya penuh dari empat sisi', { secret: true, variant: 'corrupted', xp: 120 }),
  ghost('the_seventh_tree', 'Pohon Ketujuh', 'ancient_entity', 'blackwood', 'mythic', 'Pohon Tujuh', 'Tumbuh di tempat yang salah', 'Menghitung pohon dengan benar', { secret: true, variant: 'guardian', xp: 140 }),
  ghost('tidebound_guardian', 'Penjaga Terikat Pasang', 'ancient_entity', 'sunken_cathedral', 'epic', 'Ruang Relik', 'Menjaga pintu yang tak terlihat', 'Memindahkan relik penjaga', { secret: true, variant: 'ancient', xp: 140 }),
  ghost('the_hour_without_hand', 'Jam Tanpa Jarum', 'apparition', 'house_beyond_time', 'mythic', 'Jam Tanpa Jarum', 'Mengulang satu menit', 'Memberi jam itu jarum', { secret: true, variant: 'echo', xp: 150 }),
  ghost('first_veil_walker', 'Pejalan Tabir Pertama', 'ancient_entity', 'veil_citadel', 'unknown', 'Puncak Tabir', 'Berjalan di luar urutan waktu', 'Menyebut namanya sendiri', { secret: true, variant: 'seasonal', xp: 200 }),
  // Update XIV — six new classifications, five records each.
  ghost('ash_guardian', 'Penjaga Abu', 'revenant', 'midnight_city', 'rare', 'Gedung Walikota', 'Berpatroli di koridor yang sama', 'Lambang yang dikembalikan'),
  ghost('oathbound_knight', 'Ksatria Terikat Sumpah', 'revenant', 'forgotten_kingdom', 'epic', 'Aula Singgasana', 'Menjaga takhta tanpa raja', 'Menyebut sumpah aslinya'),
  ghost('tolling_sentinel', 'Penjaga Lonceng', 'revenant', 'midnight_city', 'uncommon', 'Menara Lonceng Kota', 'Berbaris mengikuti bunyi lonceng', 'Memotong pola bunyi'),
  ghost('last_warden', 'Penjaga Terakhir', 'revenant', 'blackwater_depths', 'rare', 'Stasiun Pompa', 'Menutup pintu air berulang', 'Membuka semua katup'),
  ghost('kingless_blade', 'Bilah Tanpa Raja', 'revenant', 'eternal_nightfall', 'epic', 'Menara Sumber', 'Menebas bayangan yang lewat', 'Menunjukkan mahkota asli'),
  ghost('lantern_wisp', 'Api Lentera', 'wisp', 'midnight_city', 'common', 'Jalan Tanpa Jam', 'Menuntun ke arah cahaya', 'Membalik arah lentera'),
  ghost('memory_mote', 'Butir Memori', 'wisp', 'endless_rooms', 'uncommon', 'Koridor Terbalik', 'Berkumpul di sudut ruangan', 'Menyebut satu memori benar'),
  ghost('signal_wisp', 'Api Sinyal', 'wisp', 'blackwater_depths', 'rare', 'Rumah Sinyal', 'Berkedip mengikuti frekuensi', 'Menyetel radio ke nol'),
  ghost('hearthlight', 'Cahaya Perapian', 'wisp', 'forgotten_kingdom', 'uncommon', 'Taman Patung', 'Menghangatkan ruangan dingin', 'Menawarkan abu perapian'),
  ghost('grave_lantern', 'Lentera Makam', 'wisp', 'astral_graveyard', 'epic', 'Makam Tanpa Nama', 'Melayang di antara bintang mati', 'Menyebut nama bintang'),
  ghost('unstitched_hour', 'Jam yang Terurai', 'aberration', 'midnight_city', 'rare', 'Halte Terakhir', 'Mengulang detik yang sama', 'Memberi jam itu jarum'),
  ghost('crooked_room', 'Ruangan Miring', 'aberration', 'endless_rooms', 'epic', 'Ruang Tanpa Dinding', 'Membengkokkan sudut ruangan', 'Mengukur sudut sebenarnya'),
  ghost('static_choir', 'Paduan Statik', 'aberration', 'blackwater_depths', 'rare', 'Pasar Bawah Air', 'Menyiarkan suara tanpa sumber', 'Memutus frekuensi'),
  ghost('wrong_angle', 'Sudut yang Salah', 'aberration', 'astral_graveyard', 'legendary', 'Observatorium Buta', 'Bergerak di luar geometri', 'Menandai tiga titik asli'),
  ghost('borrowed_sky', 'Langit Pinjaman', 'aberration', 'eternal_nightfall', 'mythic', 'Ambang Fajar', 'Mengganti langit di atasmu', 'Menatap cakrawala asli'),
  ghost('hound_of_night', 'Anjing Malam', 'spectral_beast', 'midnight_city', 'uncommon', 'Jalan Tanpa Jam', 'Melacak jejak dan menggerombol', 'Mematahkan jejak aroma'),
  ghost('glass_moth', 'Ngengat Kaca', 'spectral_beast', 'carnival_lost_souls', 'rare', 'Tenda Ramalan', 'Terbang menuju cahaya', 'Memadamkan semua lampu'),
  ghost('drowned_stag', 'Rusa Tenggelam', 'spectral_beast', 'blackwater_depths', 'epic', 'Dermaga Tenggelam', 'Berlari di bawah permukaan', 'Menguras jalur air'),
  ghost('carnival_lion', 'Singa Karnaval', 'spectral_beast', 'carnival_lost_souls', 'legendary', 'Panggung Utama', 'Mengawasi wilayah panggung', 'Menutup tirai utama'),
  ghost('starless_owl', 'Burung Hantu Tanpa Bintang', 'spectral_beast', 'astral_graveyard', 'rare', 'Lapangan Meteor', 'Mengikuti gerak dari atas', 'Menyalakan satu bintang'),
  ghost('false_door', 'Pintu Palsu', 'mimic', 'endless_rooms', 'rare', 'Pintu Pertama', 'Menyamar sebagai pintu keluar', 'Mengetuk tiga kali'),
  ghost('borrowed_voice', 'Suara Pinjaman', 'mimic', 'forgotten_kingdom', 'epic', 'Kripta Raja', 'Meniru suara rekan tim', 'Meminta kalimat sandi'),
  ghost('mannequin_guest', 'Tamu Manekin', 'mimic', 'carnival_lost_souls', 'uncommon', 'Komedi Cermin', 'Berdiri diam di antara properti', 'Memberi properti yang salah'),
  ghost('echo_porter', 'Porter Gema', 'mimic', 'blackwater_depths', 'rare', 'Dermaga Tenggelam', 'Membawa barang yang tak ada', 'Menanyakan nomor kamar'),
  ghost('weeping_statue', 'Patung Menangis', 'mimic', 'astral_graveyard', 'legendary', 'Mausoleum Langit', 'Menangis saat tidak diamati', 'Menyeka air matanya'),
  ghost('first_night', 'Malam Pertama', 'primordial', 'eternal_nightfall', 'mythic', 'Ruang Malam Pertama', 'Menutupi seluruh cahaya', 'Menyebut fajar pertama'),
  ghost('root_of_stars', 'Akar Bintang', 'primordial', 'astral_graveyard', 'unknown', 'Gerbang Bintang', 'Menghubungkan makam bintang', 'Memotong satu akar'),
  ghost('the_old_dark', 'Kegelapan Tua', 'primordial', 'eternal_nightfall', 'mythic', 'Batas Malam', 'Mengisi ruang tanpa bayangan', 'Menyalakan lilin pertama'),
  ghost('tide_mother', 'Ibu Pasang', 'primordial', 'blackwater_depths', 'legendary', 'Lonceng Dasar', 'Mengatur pasang dan sinyal', 'Menyebut nama dermaga'),
  ghost('eternal_witness', 'Saksi Abadi', 'primordial', 'eternal_nightfall', 'unknown', 'Menara Sumber', 'Mengamati seluruh siklus malam', 'Menunjukkan catatan pertama'),
];

const THREAT_BY_RARITY = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 5, unknown: 5 };
const SANITY_BY_RARITY = { common: 2, uncommon: 3, rare: 4, epic: 6, legendary: 8, mythic: 9, unknown: 10 };

const GHOST_ALL = [...GHOST_SEED, ...SECRET_GHOST_SEED].map((entry, i) => {
  const evidence = entry.secret
    ? [EVIDENCE_TYPE_IDS[i % 8], EVIDENCE_TYPE_IDS[(i + 2) % 8], EVIDENCE_TYPE_IDS[(i + 4) % 8], EVIDENCE_TYPE_IDS[(i + 6) % 8]]
    : [EVIDENCE_TYPE_IDS[i % 8], EVIDENCE_TYPE_IDS[(i + 3) % 8], EVIDENCE_TYPE_IDS[(i + 5) % 8]];
  const variants = entry.secret ? [entry.variant || 'forgotten'] : GHOST_VARIANTS.slice(0, 2 + (i % 4));
  return {
    ...entry,
    evidence,
    requiredEvidence: evidence,
    // Update XIV advanced research fields supported for every record.
    subclassification: `${entry.classification}:${entry.location.split(' ')[0].toLowerCase()}`,
    threat: THREAT_BY_RARITY[entry.rarity] || 1,
    sanityInfluence: SANITY_BY_RARITY[entry.rarity] || 2,
    preferredEnvironment: entry.location,
    activeConditions: [entry.secret ? 'veil' : 'night', entry.rarity === 'common' ? 'neutral' : 'haunted'],
    behaviorProfile: entry.behavior,
    abilities: [entry.behavior, entry.secret ? 'Distorsi memori' : 'Manifestasi terkendali'],
    weaknesses: [entry.weakness, 'Bukti lengkap dari tiga jenis berbeda'],
    variants,
    masteryChallenges: [
      `Dokumentasikan ${entry.name} tanpa kehilangan sanity.`,
      `Kumpulkan seluruh bukti ${entry.name} dalam satu sesi.`,
      `Catat empat fragmen lore ${entry.name}.`,
    ],
    description: `${entry.name} adalah ${entry.classification.replace(/_/g, ' ')} yang tercatat di ${entry.location}.`,
    lore: [
      `Catatan pertama berasal dari ${entry.location}.`,
      `Pola perilaku: ${entry.behavior}.`,
      `Kelemahan yang tercatat: ${entry.weakness}.`,
      `Tingkat ancaman arsip: ${entry.rarity}.`,
    ],
    researchReward: { indexXp: entry.xp, spiritShards: entry.secret ? 120 : 40 },
  };
});

export const GHOSTS = GHOST_ALL;
export const GHOST_LIST = GHOST_ALL;
export const GHOST_IDS = GHOST_ALL.map((g) => g.id);
export const GHOSTS_BY_ID = Object.fromEntries(GHOST_ALL.map((g) => [g.id, g]));
export const ghostProfile = (id) => GHOSTS_BY_ID[id] || null;
export const standardGhosts = () => GHOSTS.filter((g) => !g.secret);
export const secretGhosts = () => GHOSTS.filter((g) => g.secret);
export const ghostsForChapter = (chapterId) => GHOSTS.filter((g) => g.chapter === chapterId);

// ---------------------------------------------------------------------------
// Investigation
// ---------------------------------------------------------------------------
export const INVESTIGATION_TOOLS = [
  { id: 'spectral_detector', name: 'Spectral Detector', category: 'detection', unlock: 'chapter1', masteryMax: 5, baseRange: 220, description: 'Menemukan jejak energi dan arah entitas.', upgrades: ['radius', 'discrimination', 'ping_rate'] },
  { id: 'spirit_camera', name: 'Spirit Camera', category: 'capture', unlock: 'chapter1', masteryMax: 5, baseRange: 180, description: 'Mengambil bukti visual dan foto entitas.', upgrades: ['exposure', 'burst', 'spectral_filter'] },
  { id: 'echo_recorder', name: 'Echo Recorder', category: 'audio', unlock: 'chapter2', masteryMax: 5, baseRange: 200, description: 'Merekam audio residual dan suara hantu.', upgrades: ['gain', 'isolation', 'playback'] },
  { id: 'veil_lens', name: 'Veil Lens', category: 'veil', unlock: 'chapter3', masteryMax: 5, baseRange: 160, description: 'Melihat lapisan tabir dan entitas tersembunyi.', upgrades: ['clarity', 'depth', 'stability'] },
  { id: 'investigator_journal', name: 'Investigator Journal', category: 'archive', unlock: 'chapter1', masteryMax: 5, baseRange: 0, description: 'Menyusun bukti menjadi catatan yang sah.', upgrades: ['deduction', 'cross_reference', 'archive_speed'] },
];
export const INVESTIGATION_TOOL_IDS = INVESTIGATION_TOOLS.map((t) => t.id);
export const toolProfile = (id) => INVESTIGATION_TOOLS.find((t) => t.id === id) || null;

export const INVESTIGATION_STEPS = [
  'detect', 'identify', 'record', 'analyze', 'compare', 'document', 'archive', 'master',
];

export const CASE_STATUS = ['active', 'completed', 'failed', 'archived'];

export const DAILY_MISSIONS = [
  { id: 'daily_scan', name: 'Pindai Tiga Jejak', kind: 'daily', metric: 'evidence', target: 3, reward: { spiritShards: 60, investigationMarks: 1 } },
  { id: 'daily_photo', name: 'Abadikan Entitas', kind: 'daily', metric: 'photos', target: 2, reward: { spiritShards: 45, veilFragments: 4 } },
  { id: 'daily_record', name: 'Rekam Gema', kind: 'daily', metric: 'audio', target: 2, reward: { spiritShards: 45, memoryTokens: 3 } },
  { id: 'daily_survive', name: 'Bertahan di Zona Berat', kind: 'daily', metric: 'hauntedTime', target: 120, reward: { spiritShards: 70, investigationMarks: 2 } },
  { id: 'daily_document', name: 'Dokumentasikan Satu Entitas', kind: 'daily', metric: 'documented', target: 1, reward: { indexXp: 80, spiritShards: 50 } },
  { id: 'daily_ground', name: 'Kunjungi Grounding Station', kind: 'daily', metric: 'grounding', target: 1, reward: { spiritShards: 30, memoryTokens: 2 } },
];

export const WEEKLY_MISSIONS = [
  { id: 'weekly_boss', name: 'Kalahkan Satu Bos Bab', kind: 'weekly', metric: 'bosses', target: 1, reward: { spiritShards: 300, ancientSeals: 1 } },
  { id: 'weekly_index', name: 'Dokumentasikan Lima Entitas', kind: 'weekly', metric: 'documented', target: 5, reward: { indexXp: 300, veilFragments: 25 } },
  { id: 'weekly_stages', name: 'Selesaikan Sepuluh Tahap', kind: 'weekly', metric: 'stages', target: 10, reward: { spiritShards: 260, investigationMarks: 6 } },
  { id: 'weekly_case', name: 'Selesaikan Tiga Kasus', kind: 'weekly', metric: 'cases', target: 3, reward: { spiritShards: 240, memoryTokens: 20 } },
  { id: 'weekly_clean', name: 'Tanpa Kehilangan Sanity', kind: 'weekly', metric: 'cleanStages', target: 3, reward: { veilFragments: 30, ancientSeals: 1 } },
];

export const SPECIAL_CONTRACTS = [
  { id: 'contract_veil_echo', name: 'Kontrak: Gema Tabir', kind: 'contract', chapter: 'house_beyond_time', metric: 'evidence', target: 6, reward: { ancientSeals: 1, veilFragments: 20 }, description: 'Kumpulkan enam bukti dari rumah yang mengulang.' },
  { id: 'contract_drowned_bells', name: 'Kontrak: Lonceng Basah', kind: 'contract', chapter: 'sunken_cathedral', metric: 'bosses', target: 1, reward: { ancientSeals: 1, spiritShards: 220 }, description: 'Hadapi Santo Tenggelam dan catat hasilnya.' },
  { id: 'contract_seventh_tree', name: 'Kontrak: Pohon Ketujuh', kind: 'contract', chapter: 'blackwood', metric: 'secrets', target: 1, reward: { ancientSeals: 2, memoryTokens: 25 }, description: 'Temukan lokasi rahasia di Blackwood.' },
  { id: 'contract_ward_zero', name: 'Kontrak: Bangsal Nol', kind: 'contract', chapter: 'mourning_hospital', metric: 'index', target: 6, reward: { veilFragments: 35 }, description: 'Dokumentasikan enam entitas rumah sakit.' },
  { id: 'contract_architect', name: 'Kontrak: Halaman Terakhir', kind: 'contract', chapter: 'veil_citadel', metric: 'bosses', target: 1, reward: { ancientSeals: 3, veilFragments: 50 }, description: 'Tutup arsip Arsitek Tabir.' },
  { id: 'contract_clean_sweep', name: 'Kontrak: Sapuan Bersih', kind: 'contract', chapter: 'vesper_hollow', metric: 'stages', target: 5, reward: { spiritShards: 180, investigationMarks: 4 }, description: 'Selesaikan lima tahap Vesper Hollow.' },
];

export const MISSION_LIBRARY = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS, ...SPECIAL_CONTRACTS];
export const MISSION_IDS = MISSION_LIBRARY.map((m) => m.id);
export const missionById = (id) => MISSION_LIBRARY.find((m) => m.id === id) || null;

// ---------------------------------------------------------------------------
// Progression, currencies, achievements, leaderboards
// ---------------------------------------------------------------------------
export const VEIL_CURRENCIES = [
  { id: 'spiritShards', name: 'Spirit Shards', icon: 'shard', color: '#9ec9ba', cap: 999999 },
  { id: 'veilFragments', name: 'Veil Fragments', icon: 'fragment', color: '#b79ad6', cap: 9999 },
  { id: 'memoryTokens', name: 'Memory Tokens', icon: 'token', color: '#c8b46a', cap: 9999 },
  { id: 'investigationMarks', name: 'Investigation Marks', icon: 'mark', color: '#c46a5a', cap: 999 },
  { id: 'ancientSeals', name: 'Ancient Seals', icon: 'seal', color: '#e0b070', cap: 99 },
];
export const CURRENCY_IDS = VEIL_CURRENCIES.map((c) => c.id);

export const INVESTIGATOR_MAX_LEVEL = 100;
// Update XIV raises the Ghost Index cap from 50 to 100.
export const INDEX_MAX_RANK = 100;
export const MASTERY_MAX = 25;

export const xpForInvestigatorLevel = (level) => Math.round(90 + Math.pow(Math.max(1, level), 1.45) * 34);

export const VEIL_ACHIEVEMENTS = [
  { id: 'first_contact', name: 'Kontak Pertama', description: 'Temui entitas pertamamu.', metric: 'encounters', target: 1, reward: { spiritShards: 50 } },
  { id: 'index_ten', name: 'Arsip Pemula', description: 'Dokumentasikan 10 entitas.', metric: 'documented', target: 10, reward: { veilFragments: 10 } },
  { id: 'index_thirty', name: 'Arsip Serius', description: 'Dokumentasikan 30 entitas.', metric: 'documented', target: 30, reward: { ancientSeals: 1 } },
  { id: 'index_complete', name: 'Arsip Lengkap', description: 'Dokumentasikan 36 entitas standar.', metric: 'standardDocumented', target: 36, reward: { ancientSeals: 2, veilFragments: 40 } },
  { id: 'secret_hunter', name: 'Pemburu Rahasia', description: 'Temukan semua 6 entitas rahasia.', metric: 'secrets', target: 6, reward: { ancientSeals: 3 } },
  { id: 'chapter_one', name: 'Vesper Selesai', description: 'Selesaikan Vesper Hollow.', metric: 'chapterClears', target: 1, reward: { spiritShards: 200 } },
  { id: 'chapter_all', name: 'Enam Bab', description: 'Selesaikan keenam bab.', metric: 'chapterClears', target: 6, reward: { ancientSeals: 2 } },
  { id: 'architect_down', name: 'Halaman Terakhir', description: 'Kalahkan Arsitek Tabir.', metric: 'finalBoss', target: 1, reward: { veilFragments: 60 } },
  { id: 'calm_mind', name: 'Pikiran Tenang', description: 'Selesaikan tahap tanpa turun ke Critical.', metric: 'cleanStages', target: 5, reward: { memoryTokens: 20 } },
  { id: 'case_closed', name: 'Kasus Tertutup', description: 'Selesaikan 10 investigasi.', metric: 'cases', target: 10, reward: { investigationMarks: 10 } },
  { id: 'master_ten', name: 'Ahli Sepuluh', description: 'Master 10 entitas.', metric: 'mastered', target: 10, reward: { veilFragments: 25 } },
  { id: 'no_scares', name: 'Tanpa Lompatan', description: 'Selesaikan bab dengan anti-jumpscare aktif.', metric: 'safeClears', target: 5, reward: { spiritShards: 300 } },
  { id: 'collector', name: 'Kolektor Tabir', description: 'Temukan 8 koleksi.', metric: 'collectibles', target: 8, reward: { memoryTokens: 15 } },
  { id: 'relic_keeper', name: 'Penjaga Relik', description: 'Temukan 8 lokasi rahasia.', metric: 'secretsFound', target: 8, reward: { ancientSeals: 2 } },
];

export const VEIL_REWARDS = [
  { id: 'relic_lantern', name: 'Lentera Penyidik', type: 'relic', source: 'index_ten' },
  { id: 'relic_lens', name: 'Lensa Tabir', type: 'relic', source: 'chapter_all' },
  { id: 'outfit_field', name: 'Jas Lapangan', type: 'cosmetic', source: 'case_closed' },
  { id: 'outfit_veil', name: 'Mantel Tabir', type: 'cosmetic', source: 'architect_down' },
  { id: 'title_archivist', name: 'Gelar: Arsiparis', type: 'title', source: 'index_complete' },
  { id: 'title_witness', name: 'Gelar: Saksi', type: 'title', source: 'first_contact' },
];

export const LEADERBOARDS = [
  { id: 'fastest_clear', name: 'Waktu Tercepat', metric: 'timeMs', unit: 'ms', direction: 'asc' },
  { id: 'highest_sanity', name: 'Sanity Tertinggi', metric: 'minSanity', unit: 'sanity', direction: 'desc' },
  { id: 'most_indexed', name: 'Index Terbanyak', metric: 'documented', unit: 'entri', direction: 'desc' },
  { id: 'most_cases', name: 'Kasus Terbanyak', metric: 'cases', unit: 'kasus', direction: 'desc' },
  { id: 'hardest_stage', name: 'Tahap Tersulit', metric: 'stageIndex', unit: 'tahap', direction: 'desc' },
  { id: 'boss_rush', name: 'Boss Rush', metric: 'timeMs', unit: 'ms', direction: 'asc' },
  { id: 'collection', name: 'Koleksi Terlengkap', metric: 'collectibles', unit: 'item', direction: 'desc' },
];
export const LEADERBOARD_IDS = LEADERBOARDS.map((b) => b.id);
export const DIFFICULTIES = ['story', 'easy', 'normal', 'hard', 'nightmare'];

// ---------------------------------------------------------------------------
// Hub, secrets, collectibles
// ---------------------------------------------------------------------------
export const VEIL_FACILITIES = [
  { id: 'case_board', name: 'Papan Kasus', tab: 'investigation', action: 'global', description: 'Menerima kontrak harian dan mingguan.' },
  { id: 'archive', name: 'Arsip Hantu', tab: 'index', action: 'global', description: 'Menyimpan seluruh catatan Ghost Index.' },
  { id: 'equipment_bench', name: 'Meja Peralatan', tab: 'investigation', action: 'equipment', description: 'Merawat dan meningkatkan lima peralatan investigasi.' },
  { id: 'sanity_ward', name: 'Bangsal Ketenangan', tab: 'sanity', action: 'recover', description: 'Memulihkan sanity dan menerapkan kondisi sementara.' },
  { id: 'mind_shrine', name: 'Kuil Pikiran', tab: 'mind', action: 'global', description: 'Membelanjakan poin Mind & Spirit.' },
  { id: 'relic_vault', name: 'Gudang Relik', tab: 'progress', action: 'relics', description: 'Menyimpan relik dan koleksi investigasi.' },
  { id: 'mission_desk', name: 'Meja Misi', tab: 'investigation', action: 'missions', description: 'Melacak misi harian, mingguan dan kontrak.' },
  { id: 'map_table', name: 'Meja Peta', tab: 'campaign', action: 'map', description: 'Menandai lokasi rahasia dan jalur bab.' },
  { id: 'training_hall', name: 'Aula Latihan', tab: 'campaign', action: 'training', description: 'Menguji ulang taktik melawan entitas yang sudah tercatat.' },
  { id: 'leaderboard', name: 'Papan Peringkat', tab: 'progress', action: 'leaderboards', description: 'Tujuh papan peringkat terpisah per kesulitan.' },
];

export const VEIL_NPCS = [
  { id: 'ilse', name: 'Keeper Ilse', role: 'Penjaga Refugium', facility: 'case_board', lines: ['Kasus tidak pernah benar-benar tutup, hanya diarsipkan.', 'Bawa pulang bukti, bukan hanya cerita.'] },
  { id: 'noor', name: 'Archivist Noor', role: 'Arsiparis Tabir', facility: 'archive', lines: ['Setiap nama yang kau tulis mengikat sesuatu.', 'Jangan dokumentasikan yang belum kau pahami.'] },
  { id: 'tal', name: 'Warden Tal', role: 'Penjaga Peralatan', facility: 'equipment_bench', lines: ['Detektormu berisik. Itu bukan selalu pertanda buruk.', 'Kalibrasi lensa sebelum tabir terbuka.'] },
  { id: 'osric', name: 'Ferryman Osric', role: 'Pengantar Misi', facility: 'mission_desk', lines: ['Kontrak dibayar di muka. Keselamatan tidak.', 'Tim yang baik pulang dengan cerita yang sama.'] },
];

export const SECRET_LOCATIONS = [
  { id: 'the_seventh_bell', name: 'Lonceng Ketujuh', chapter: 'vesper_hollow', stage: 'vesper_hollow_5', clue: 'Dengarkan lonceng yang berbunyi enam kali.', reward: { veilFragments: 12 } },
  { id: 'ward_zero', name: 'Bangsal Nol', chapter: 'mourning_hospital', stage: 'mourning_hospital_5', clue: 'Cari ranjang tanpa nomor.', reward: { veilFragments: 14 } },
  { id: 'hollow_heart', name: 'Jantung Berongga', chapter: 'blackwood', stage: 'blackwood_5', clue: 'Pohon ketujuh memiliki ruang di dalamnya.', reward: { veilFragments: 16 } },
  { id: 'the_drowned_bell', name: 'Lonceng Tenggelam', chapter: 'sunken_cathedral', stage: 'sunken_cathedral_5', clue: 'Selam di bawah altar dalam.', reward: { veilFragments: 18 } },
  { id: 'room_zero_key', name: 'Kunci Kamar Nol', chapter: 'house_beyond_time', stage: 'house_beyond_time_5', clue: 'Pintu yang belum ada menyimpan kuncinya.', reward: { veilFragments: 20 } },
  { id: 'citadel_core', name: 'Inti Citadel', chapter: 'veil_citadel', stage: 'veil_citadel_5', clue: 'Tabir berdenyut di puncak.', reward: { veilFragments: 24 } },
  { id: 'quiet_stair', name: 'Tangga Sunyi', chapter: 'mourning_hospital', stage: 'mourning_hospital_3', clue: 'Tangga yang tidak ada di denah.', reward: { memoryTokens: 12 } },
  { id: 'nameless_gallery', name: 'Galeri Tanpa Nama', chapter: 'veil_citadel', stage: 'veil_citadel_3', clue: 'Potret tanpa nama di arsip hilang.', reward: { ancientSeals: 1 } },
];

export const VEIL_COLLECTIBLES = [
  { id: 'relics', name: 'Relik', count: 10 },
  { id: 'documents', name: 'Dokumen', count: 12 },
  { id: 'photographs', name: 'Foto', count: 12 },
  { id: 'recordings', name: 'Rekaman', count: 12 },
  { id: 'artifacts', name: 'Artefak', count: 10 },
  { id: 'memories', name: 'Memori', count: 12 },
  { id: 'keys', name: 'Kunci', count: 8 },
  { id: 'sigils', name: 'Sigil', count: 8 },
];

// ---------------------------------------------------------------------------
// Settings — independent from Easy/Normal/Hard.
// ---------------------------------------------------------------------------
export const VEIL_SETTING_DEFINITIONS = [
  { path: 'veil.sanity.enabled', tab: 'sanity', label: 'Aktifkan Sanity', type: 'toggle', value: true },
  { path: 'veil.sanity.drainMultiplier', tab: 'sanity', label: 'Laju pengurasan', type: 'range', min: 0.2, max: 2, step: 0.05, value: 1 },
  { path: 'veil.sanity.recoveryMultiplier', tab: 'sanity', label: 'Laju pemulihan', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1 },
  { path: 'veil.sanity.hudEnabled', tab: 'sanity', label: 'Tampilkan bar sanity', type: 'toggle', value: true },
  { path: 'veil.sanity.warningThreshold', tab: 'sanity', label: 'Ambang peringatan', type: 'range', min: 5, max: 60, step: 1, value: 30 },
  { path: 'veil.sanity.environmentalIntensity', tab: 'sanity', label: 'Intensitas lingkungan', type: 'range', min: 0, max: 1, step: 0.05, value: 0.6 },
  { path: 'veil.sanity.cameraEffects', tab: 'sanity', label: 'Efek kamera', type: 'toggle', value: true },
  { path: 'veil.sanity.visualDistortion', tab: 'sanity', label: 'Distorsi visual', type: 'toggle', value: true },
  { path: 'veil.sanity.unexpectedAudio', tab: 'sanity', label: 'Audio tak terduga', type: 'toggle', value: true },
  { path: 'veil.sanity.safeRoomStrength', tab: 'sanity', label: 'Kekuatan ruang aman', type: 'range', min: 0.5, max: 2, step: 0.1, value: 1 },
  { path: 'veil.sanity.temporaryConditions', tab: 'sanity', label: 'Kondisi sementara', type: 'toggle', value: true },
  // Update XIV Sanity 3.0 attributes.
  { path: 'veil.sanity.exposureEnabled', tab: 'sanity', label: 'Aktifkan Veil Exposure', type: 'toggle', value: true },
  { path: 'veil.sanity.exposureGain', tab: 'sanity', label: 'Laju Veil Exposure', type: 'range', min: 0, max: 2, step: 0.05, value: 1 },
  { path: 'veil.sanity.exposureDecay', tab: 'sanity', label: 'Peluruhan Veil Exposure', type: 'range', min: 0, max: 2, step: 0.05, value: 1 },
  { path: 'veil.sanity.focusRecovery', tab: 'sanity', label: 'Pemulihan Mental Focus', type: 'range', min: 0.2, max: 2, step: 0.05, value: 1 },
  { path: 'veil.ghosts.encounterRate', tab: 'campaign', label: 'Frekuensi pertemuan', type: 'range', min: 0, max: 2, step: 0.05, value: 1 },
  { path: 'veil.ghosts.maxConcurrent', tab: 'campaign', label: 'Hantu bersamaan', type: 'range', min: 1, max: 5, step: 1, value: 3 },
  { path: 'veil.ghosts.manifestationQuality', tab: 'campaign', label: 'Kualitas manifestasi', type: 'select', options: ['low', 'medium', 'high'], value: 'high' },
  { path: 'veil.investigation.hintMarkers', tab: 'investigation', label: 'Penanda petunjuk', type: 'toggle', value: true },
  { path: 'veil.investigation.autoDetect', tab: 'investigation', label: 'Deteksi otomatis', type: 'toggle', value: false },
  { path: 'veil.investigation.evidencePings', tab: 'investigation', label: 'Ping bukti', type: 'toggle', value: true },
  { path: 'veil.index.pageSize', tab: 'index', label: 'Entri per halaman', type: 'select', options: ['12', '24', '48'], value: '24' },
  { path: 'veil.index.spoilerMode', tab: 'index', label: 'Tampilkan entri belum ditemukan', type: 'toggle', value: false },
  { path: 'veil.fog.distanceLoad', tab: 'campaign', label: 'Muat berdasarkan jarak', type: 'toggle', value: true },
  { path: 'veil.audio.hrtf', tab: 'settings', label: 'Audio spasial HRTF', type: 'toggle', value: true },
  { path: 'veil.audio.ambience', tab: 'settings', label: 'Ambience tabir', type: 'range', min: 0, max: 1, step: 0.05, value: 0.55 },
  { path: 'veil.accessibility.reducedMotion', tab: 'settings', label: 'Kurangi gerakan', type: 'toggle', value: false },
  { path: 'veil.accessibility.highContrast', tab: 'settings', label: 'Kontras tinggi', type: 'toggle', value: false },
  { path: 'veil.accessibility.subtitles', tab: 'settings', label: 'Subtitle', type: 'toggle', value: true },
  { path: 'veil.accessibility.screenReader', tab: 'settings', label: 'Mode pembaca layar', type: 'toggle', value: false },
  { path: 'veil.antiJumpscare.enabled', tab: 'settings', label: 'Anti-jumpscare', type: 'toggle', value: false },
  { path: 'veil.antiJumpscare.audioSoftening', tab: 'settings', label: 'Pelunakan audio', type: 'range', min: 0, max: 1, step: 0.05, value: 0.8 },
  { path: 'veil.coop.enabled', tab: 'settings', label: 'Co-op investigasi', type: 'toggle', value: true },
  { path: 'veil.coop.maxPlayers', tab: 'settings', label: 'Pemain maksimum', type: 'select', options: ['2', '3', '4'], value: '4' },
];

export const VEIL_DEFAULTS = Object.fromEntries(VEIL_SETTING_DEFINITIONS.map((d) => [d.path, d.value]));

export const VEIL_DIFFICULTY_SCALING = {
  story: { enemyHp: 0.8, enemyDamage: 0.7, sanityDrain: 0.7 },
  easy: { enemyHp: 0.9, enemyDamage: 0.85, sanityDrain: 0.85 },
  normal: { enemyHp: 1, enemyDamage: 1, sanityDrain: 1 },
  hard: { enemyHp: 1.2, enemyDamage: 1.2, sanityDrain: 1.2 },
  nightmare: { enemyHp: 1.45, enemyDamage: 1.45, sanityDrain: 1.4 },
};
