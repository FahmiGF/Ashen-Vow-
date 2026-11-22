// Update XIV — Eternal Night: static content for Arc X.
// Pure data only. The Arc IX save is never written by these tables.

export const ETERNAL_ARC = 'Update XIV';
export const ETERNAL_SAVE_KEY = 'ashen-vow-eternal-v1';
export const ETERNAL_SAVE_VERSION = 1;
export const ETERNAL_TITLE = 'THE ETERNAL NIGHT';
export const ETERNAL_ROOM_START = 9600;
export const ETERNAL_BOSS_ROOM_START = 9700;

export const ETERNAL_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'campaign', label: 'Arc X' },
  { id: 'index', label: 'Ghost Index' },
  { id: 'sanity', label: 'Sanity 3.0' },
  { id: 'investigation', label: 'Investigasi' },
  { id: 'hunts', label: 'Spectral Pursuit' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'events', label: 'World Events' },
  { id: 'coop', label: 'Expedition' },
  { id: 'progress', label: 'Progres' },
  { id: 'settings', label: 'Pengaturan' },
];

const chapter = (id, index, name, subtitle, mechanic, boss, palette, zone, stages, secret) => ({
  id, index, name, subtitle, mechanic, boss, palette, zone, stages, secret, arc: 'X',
});

export const ETERNAL_CHAPTERS = [
  chapter('midnight_city', 0, 'The Midnight City', 'Kota yang Berhenti pada Pukul 00:00', 'time_cycles', 'clockless_mayor',
    { top: '#07090f', mid: '#111827', low: '#1d2a3a', glow: '#9db8d8', fog: '#1a2636' }, 'haunted',
    ['Jalan Tanpa Jam', 'Halte Terakhir', 'Gedung Walikota', 'Menara Lonceng Kota', 'Fajar yang Tidak Datang'],
    'the_stopped_clock'),
  chapter('carnival_lost_souls', 1, 'Carnival of Lost Souls', 'Karnaval yang Menolak Tutup', 'attractions', 'ringmaster',
    { top: '#100709', mid: '#251016', low: '#381923', glow: '#d89aa8', fog: '#3a1c26' }, 'haunted',
    ['Gerbang Tiket', 'Komedi Cermin', 'Kincir Raksasa', 'Tenda Ramalan', 'Panggung Utama'],
    'the_lost_parade'),
  chapter('forgotten_kingdom', 2, 'The Forgotten Kingdom', 'Kerajaan yang Lupa Rajanya', 'spectral_guardians', 'spectral_monarch',
    { top: '#090b0c', mid: '#161d1f', low: '#222c2f', glow: '#b9c9bb', fog: '#263235' }, 'veil',
    ['Gerbang Kerajaan', 'Aula Singgasana', 'Taman Patung', 'Kripta Raja', 'Menara Penjaga'],
    'the_unmarked_grave'),
  chapter('blackwater_depths', 3, 'The Blackwater Depths', 'Permukiman di Bawah Permukaan', 'water_sound', 'abyssal_bellkeeper',
    { top: '#050c10', mid: '#0b1c26', low: '#12303d', glow: '#7fb7cf', fog: '#14303d' }, 'flooded',
    ['Dermaga Tenggelam', 'Stasiun Pompa', 'Pasar Bawah Air', 'Rumah Sinyal', 'Lonceng Dasar'],
    'the_blackwater_signal'),
  chapter('endless_rooms', 4, 'The House of Endless Rooms', 'Arsitektur yang Tidak Mungkin', 'layout_shift', 'architect_of_rooms',
    { top: '#0b0810', mid: '#191123', low: '#271a34', glow: '#b99ad9', fog: '#332345' }, 'veil',
    ['Pintu Pertama', 'Koridor Terbalik', 'Kamar yang Sama', 'Tangga Dalam', 'Ruang Tanpa Dinding'],
    'the_endless_hall'),
  chapter('astral_graveyard', 5, 'The Astral Graveyard', 'Makam Bintang dan Entitas Langit', 'celestial_patterns', 'starless_keeper',
    { top: '#060812', mid: '#0e1228', low: '#181d3a', glow: '#9fa9e8', fog: '#1e2547' }, 'veil',
    ['Gerbang Bintang', 'Lapangan Meteor', 'Mausoleum Langit', 'Observatorium Buta', 'Makam Tanpa Nama'],
    'the_forgotten_observatory'),
  chapter('unwritten_wing', 6, 'The Unwritten Wing', 'Arsip yang Menulis Ulang Dirinya', 'unwritten_geometry', 'the_unwritten',
    { top: '#0a0906', mid: '#1b1710', low: '#2a2217', glow: '#d8c08a', fog: '#2f271b' }, 'veil',
    ['Lembar Kosong', 'Rak yang Bernapas', 'Tinta yang Mengalir', 'Nama yang Dihapus', 'Pintu Tanpa Halaman'],
    'the_blank_page'),
  chapter('eternal_nightfall', 7, 'The Eternal Nightfall', 'Sumber Malam yang Berulang', 'night_conditions', 'night_sovereign',
    { top: '#05070b', mid: '#0c1018', low: '#151b28', glow: '#9aa7d6', fog: '#1a2133' }, 'veil',
    ['Batas Malam', 'Kota yang Sama', 'Menara Sumber', 'Ruang Malam Pertama', 'Ambang Fajar'],
    'the_last_broadcast'),
];

export const ETERNAL_CHAPTER_IDS = ETERNAL_CHAPTERS.map((c) => c.id);
export const ETERNAL_CHAPTERS_BY_ID = Object.fromEntries(ETERNAL_CHAPTERS.map((c) => [c.id, c]));

const ARCHETYPES = [
  ['wraith', 'crawler', 'sentinel', 'brute'],
  ['sentinel', 'wraith', 'brute', 'crawler'],
  ['brute', 'sentinel', 'crawler', 'wraith'],
  ['wraith', 'sentinel', 'brute', 'crawler'],
  ['crawler', 'brute', 'wraith', 'sentinel'],
  ['sentinel', 'crawler', 'wraith', 'brute'],
  ['brute', 'wraith', 'sentinel', 'crawler'],
  ['wraith', 'brute', 'sentinel', 'crawler'],
];

const OBJECTIVES = [
  'Identifikasi sumber distorsi waktu',
  'Dokumentasikan atraksi yang bergerak sendiri',
  'Bebaskan penjaga spectral dari sumpah',
  'Rekam sinyal bawah air',
  'Petakan ruangan yang berubah',
  'Kumpulkan pecahan energi langit',
  'Tulis ulang halaman yang belum pernah ada',
  'Tutup sumber Malam Abadi',
];

export const ETERNAL_STAGES = ETERNAL_CHAPTERS.flatMap((chapterDef, ci) =>
  chapterDef.stages.map((name, si) => {
    const index = ci * 5 + si;
    return {
      id: `${chapterDef.id}_${si + 1}`,
      index,
      localIndex: si,
      chapter: chapterDef.id,
      chapterIndex: ci,
      chapterName: chapterDef.name,
      number: si + 1,
      name,
      room: ETERNAL_ROOM_START + index,
      archetypes: ARCHETYPES[ci],
      enemyCount: 20,
      eliteCount: 1,
      objective: OBJECTIVES[ci],
      investigation: si === 2 || si === 4,
      secret: si === 4,
      stageType: chapterDef.mechanic === 'unwritten_geometry' ? 'anomaly' : 'standard',
      bossStage: false,
      zone: chapterDef.zone,
      sanityDrain: 1.1 + ci * 0.12,
      reward: { spiritShards: 55 + ci * 15, veilFragments: 8 + ci * 3, investigationMarks: 1 },
      arc: 'X',
    };
  }),
);

export const ETERNAL_STAGE_IDS = ETERNAL_STAGES.map((s) => s.id);
export const ETERNAL_STAGES_BY_ID = Object.fromEntries(ETERNAL_STAGES.map((s) => [s.id, s]));
export const eternalStagesForChapter = (chapterId) => ETERNAL_STAGES.filter((s) => s.chapter === chapterId);

const lines = (value) => (Array.isArray(value) ? value : [value]);
const dialogue = (intro, phases, defeat) => {
  const out = { intro: lines(intro), defeat: lines(defeat) };
  phases.forEach((line, i) => { out[`phase${i + 2}`] = lines(line); });
  return out;
};

const boss = (id, chapterId, name, title, maxHp, maxPhases, thresholds, dialogueData, patterns, mechanic, extra = {}) => ({
  id, chapterId, name, title, maxHp, maxPhases, phaseThresholds: thresholds, dialogueData, patterns, mechanic,
  reward: { spiritShards: 320, veilFragments: 55, ancientSeals: 1 }, arc: 'X', ...extra,
});

export const ETERNAL_BOSSES = [
  boss('clockless_mayor', 'midnight_city', 'The Clockless Mayor', 'Walikota Tanpa Jarum', 2800, 3, [0.66, 0.33],
    dialogue('Kota ini sudah memilih pukul dua belas. Selamanya.', ['Jam tidak berhenti. Kau yang bergerak terlalu cepat.', 'Setiap menit yang kau habiskan menjadi milikku.'], 'Akhirnya... waktu untuk berhenti.'),
    ['hour_hand', 'stop_clock', 'minute_volley'], 'time_cycles'),
  boss('ringmaster', 'carnival_lost_souls', 'The Ringmaster', 'Pemilik Atraksi Terkutuk', 3200, 4, [0.75, 0.5, 0.25],
    dialogue('Tiketmu sudah dibayar. Pertunjukan tidak bisa dibatalkan.', ['Para penonton menunggu.', 'Atraksi kedua: cermin dan darah.', 'Tepuk tangan terakhir untukmu.'], 'Pertunjukan... selalu berakhir.'),
    ['mirror_tent', 'carousel_charge', 'confetti_volley', 'final_act'], 'attractions'),
  boss('spectral_monarch', 'forgotten_kingdom', 'The Spectral Monarch', 'Raja yang Lupa Wajahnya', 3600, 4, [0.8, 0.55, 0.3],
    dialogue('Sebut namaku, dan kerajaanku kembali.', ['Para penjaga mengenal darahmu.', 'Takhta ini dibangun dari nama yang dilupakan.', 'Kau akan menjadi penjaga berikutnya.'], 'Kerajaan... boleh jatuh.'),
    ['guardian_call', 'crown_wave', 'throne_slam', 'royal_decree'], 'spectral_guardians'),
  boss('abyssal_bellkeeper', 'blackwater_depths', 'The Abyssal Bellkeeper', 'Penjaga Lonceng Dasar', 4000, 4, [0.8, 0.6, 0.35],
    dialogue('Sinyal di bawah selalu berbunyi. Kau hanya belum mendengarnya.', ['Air membawa suara lebih jauh dari teriakanmu.', 'Setiap riak memanggil sesuatu.', 'Lonceng terakhir berbunyi dari dalam dirimu.'], 'Sinyal... berhenti.'),
    ['sonic_tide', 'bell_undertow', 'flood_pillar', 'abyss_resonance'], 'water_sound'),
  boss('architect_of_rooms', 'endless_rooms', 'The Architect of Rooms', 'Perancang Ruang Tanpa Ujung', 4400, 4, [0.8, 0.55, 0.3],
    dialogue('Kau sudah masuk ke ruangan ini tiga kali. Atau baru sekali?', ['Dinding mengingat setiap arah yang kau pilih.', 'Aku menambah satu pintu untuk setiap jawabanmu.', 'Tidak ada ruangan terakhir.'], 'Ruang... akhirnya tertutup.'),
    ['shift_walls', 'loop_corridor', 'ceiling_drop', 'room_collapse'], 'layout_shift'),
  boss('starless_keeper', 'astral_graveyard', 'The Starless Keeper', 'Penjaga Langit Tanpa Bintang', 4800, 5, [0.82, 0.62, 0.42, 0.2],
    dialogue('Bintang-bintang mati jauh sebelum kau lahir. Aku hanya menjaga kuburnya.', ['Setiap pola adalah nama yang padam.', 'Kau berdiri di atas makam cahaya.', 'Gravitasi adalah doa terakhir mereka.', 'Langit tidak akan mengenangmu.'], 'Malam... boleh turun.'),
    ['starfall', 'gravity_well', 'constellation_lance', 'eclipse_ring', 'dead_sky'], 'celestial_patterns'),
  boss('the_unwritten', 'unwritten_wing', 'The Unwritten', 'Halaman yang Belum Pernah Ditulis', 4600, 4, [0.8, 0.55, 0.3],
    dialogue('Setiap arsip punya halaman yang tidak boleh dibaca. Kau baru saja membukanya.', ['Tinta mengingat tangan yang menulisnya.', 'Aku menghapus nama agar halaman tetap kosong.', 'Kau menambahkan dirimu ke daftar isi.'], 'Halaman ini... bukan milikku.'),
    ['ink_surge', 'margin_grasp', 'erasure_wave', 'blank_page'], 'unwritten_geometry'),
  boss('night_sovereign', 'eternal_nightfall', 'The Night Sovereign', 'Penguasa Malam Berulang', 5400, 4, [0.8, 0.55, 0.3],
    dialogue('Malam tidak kembali. Kalian yang terus kembali ke malam.', ['Setiap fajar hanyalah jeda.', 'Aku menjaga malam tetap jujur.', 'Kau akan berterima kasih pada kegelapan.'], 'Fajar... bukan milikku.'),
    ['night_wave', 'condition_shift', 'umbral_court', 'endless_dark'], 'night_conditions'),
  boss('first_forgotten', 'eternal_nightfall', 'The First Forgotten', 'Yang Pertama Dilupakan', 7200, 5, [0.84, 0.66, 0.48, 0.26],
    dialogue('Sebelum tabir, sebelum malam, sebelum nama: ada aku.', ['Kau menyebutku sebagai fenomena.', 'Kau menyebutku sebagai bencana.', 'Kau menyebutku sebagai dewa yang mati.', 'Kau menyebutku sebagai kenangan.', 'Sekarang sebut namaku.'], 'Kalau kau mengingatku, malam tidak perlu kembali.'),
    ['first_dark', 'name_unmaking', 'forgotten_legion', 'nightfall', 'eternal_void'], 'all', { final: true, arena: 'eternal_nightfall' }),
];

export const ETERNAL_BOSS_IDS = ETERNAL_BOSSES.map((b) => b.id);
export const ETERNAL_BOSSES_BY_ID = Object.fromEntries(ETERNAL_BOSSES.map((b) => [b.id, b]));
export const eternalBossProfile = (id) => ETERNAL_BOSSES_BY_ID[id] || null;
export const FINAL_ETERNAL_BOSS = 'first_forgotten';

// ---------------------------------------------------------------------------
// Spectral Pursuit and procedural investigation
// ---------------------------------------------------------------------------
export const HUNT_VARIANTS = [
  { id: 'standard', name: 'Standard Hunt', entities: 1, duration: 240, evidence: 3, description: 'Identifikasi dan dokumentasikan satu entitas.' },
  { id: 'advanced', name: 'Advanced Hunt', entities: 1, duration: 300, evidence: 4, description: 'Kombinasi bukti yang lebih rumit.' },
  { id: 'multi', name: 'Multi-Entity Hunt', entities: 3, duration: 420, evidence: 3, description: 'Selidiki beberapa entitas yang saling terhubung.' },
  { id: 'ancient', name: 'Ancient Hunt', entities: 1, duration: 360, evidence: 4, rarities: ['legendary', 'mythic', 'unknown'], description: 'Entitas Legendary atau Mythic.' },
  { id: 'endless', name: 'Endless Hunt', entities: 5, duration: 600, evidence: 3, description: 'Rangkaian investigasi berurutan.' },
  { id: 'coop', name: 'Co-op Hunt', entities: 2, duration: 420, evidence: 3, players: [2, 3, 4], description: 'Investigasi tim dengan peran penyidik.' },
  { id: 'custom', name: 'Custom Hunt', entities: 1, duration: 300, evidence: 3, description: 'Pengaturan pertemuan yang dikonfigurasi pemain.' },
];

export const HUNT_CONFIG_DEFAULTS = {
  variant: 'standard',
  chapter: 'midnight_city',
  classification: 'all',
  rarity: 'all',
  duration: 300,
  evidenceDifficulty: 'normal',
  sanityRules: 'standard',
  equipmentRestrictions: 'none',
  environmentalEvents: true,
  difficulty: 'normal',
  antiJumpscare: true,
};

export const INVESTIGATION_TEMPLATES = [
  { id: 'entity_identification', name: 'Entity Identification', objective: 'Identifikasi entitas tak dikenal', evidenceGoal: 3, minLevel: 1, steps: ['detect', 'identify', 'record', 'analyze', 'document'] },
  { id: 'missing_evidence', name: 'Missing Evidence', objective: 'Temukan beberapa catatan yang hilang', evidenceGoal: 4, minLevel: 3, steps: ['detect', 'record', 'compare', 'analyze', 'document'] },
  { id: 'haunted_location', name: 'Haunted Location', objective: 'Selidiki aktivitas supernatural', evidenceGoal: 3, minLevel: 2, steps: ['detect', 'record', 'analyze', 'document'] },
  { id: 'ancient_relic', name: 'Ancient Relic', objective: 'Temukan dan dokumentasikan objek supernatural', evidenceGoal: 4, minLevel: 4, steps: ['detect', 'identify', 'analyze', 'document'] },
  { id: 'memory_reconstruction', name: 'Memory Reconstruction', objective: 'Rekonstruksi masa lalu entitas', evidenceGoal: 4, minLevel: 6, steps: ['detect', 'identify', 'compare', 'analyze', 'document'] },
  { id: 'guardian_encounter', name: 'Guardian Encounter', objective: 'Selesaikan lokasi yang dijaga', evidenceGoal: 5, minLevel: 8, steps: ['detect', 'identify', 'record', 'analyze', 'document'] },
  { id: 'multi_ghost', name: 'Multi-Ghost Case', objective: 'Dokumentasikan beberapa entitas terkait', evidenceGoal: 5, minLevel: 10, steps: ['detect', 'identify', 'record', 'compare', 'document'] },
  { id: 'lost_recording', name: 'Lost Recording', objective: 'Temukan dan pulihkan rekaman audio', evidenceGoal: 3, minLevel: 5, steps: ['detect', 'record', 'analyze', 'document'] },
  { id: 'emergency', name: 'Investigation Emergency', objective: 'Selesaikan investigasi berbatas waktu', evidenceGoal: 4, minLevel: 12, timed: 180, steps: ['detect', 'identify', 'record', 'document'] },
  { id: 'ancient_research', name: 'Ancient Entity Research', objective: 'Investigasi entitas tingkat lanjut', evidenceGoal: 6, minLevel: 15, steps: ['detect', 'identify', 'record', 'analyze', 'compare', 'archive', 'master'] },
];

export const INVESTIGATION_DIFFICULTY = {
  easy: { evidence: 2, time: 360, reward: 0.75 },
  normal: { evidence: 3, time: 300, reward: 1 },
  hard: { evidence: 4, time: 240, reward: 1.35 },
  nightmare: { evidence: 5, time: 180, reward: 1.7 },
};

// ---------------------------------------------------------------------------
// Equipment Workshop 2.0
// ---------------------------------------------------------------------------
export const EQUIPMENT_CATEGORIES = [
  { id: 'detection', name: 'Detection' },
  { id: 'recording', name: 'Recording' },
  { id: 'protection', name: 'Protection' },
  { id: 'investigation', name: 'Investigation' },
  { id: 'exploration', name: 'Exploration' },
  { id: 'utility', name: 'Utility' },
];

const equipment = (id, name, category, description, benefits, cost, essential = false) => ({
  id, name, category, description, benefits, essential,
  tiers: [
    { tier: 1, name: 'Standard', cost: null, benefit: benefits[0] },
    { tier: 2, name: 'Improved', cost: cost * 1, benefit: benefits[1] },
    { tier: 3, name: 'Advanced', cost: cost * 2, benefit: benefits[2] },
    { tier: 4, name: 'Expert', cost: cost * 3.5, benefit: benefits[3] },
    { tier: 5, name: 'Masterwork', cost: cost * 5, benefit: benefits[4] },
  ],
});

export const ETERNAL_EQUIPMENT = [
  equipment('resonance_scanner', 'Resonance Scanner', 'detection', 'Deteksi sumber resonansi supernatural.', ['Deteksi dasar', 'Jangkauan +20%', 'Petunjuk klasifikasi', 'Deteksi multi-sumber', 'Visualisasi bukti lanjutan'], 180, true),
  equipment('veil_compass', 'Veil Compass', 'detection', 'Menunjuk arah gangguan tabir terdekat.', ['Arah umum', 'Jarak kasar', 'Arah + jenis entitas', 'Tiga sumber sekaligus', 'Peta tabir lokal'], 240, false),
  equipment('spirit_microphone', 'Spirit Microphone', 'recording', 'Merekam suara residual yang tak terdengar.', ['Rekaman dasar', 'Gain +25%', 'Isolasi frekuensi', 'Pembersihan noise', 'Transkripsi otomatis'], 150, true),
  equipment('memory_camera', 'Memory Camera', 'recording', 'Memotret memori yang tertinggal di lokasi.', ['Foto dasar', 'Eksposur +1', 'Filter spektral', 'Burst 3 frame', 'Rekonstruksi memori'], 220, false),
  equipment('guardian_pendant', 'Guardian Pendant', 'protection', 'Mengurangi paparan tabir saat investigasi.', ['Paparan -10%', 'Paparan -18%', 'Pemulihan focus +15%', 'Perlindungan kondisi', 'Jangkar darurat'], 200, true),
  equipment('ancient_seal', 'Ancient Seal', 'protection', 'Segel tua yang menahan manifestasi agresif.', ['Manifestasi -8%', 'Manifestasi -15%', 'Sanity drain -12%', 'Tolak satu kondisi', 'Segel pemulihan'], 300, false),
  equipment('spectral_lens', 'Spectral Lens', 'investigation', 'Melihat lapisan bukti yang tersembunyi.', ['Bukti tersembunyi dasar', 'Kedalaman +1', 'Analisis focus -20%', 'Bukti lintas lapisan', 'Klasifikasi instan'], 260, true),
  equipment('rune_reader', 'Rune Reader', 'investigation', 'Membaca simbol dan prasasti supernatural.', ['Baca simbol dasar', 'Kamus rune +20%', 'Terjemahan konteks', 'Rantai simbol', 'Rekonstruksi prasasti'], 320, false),
  equipment('portable_lantern', 'Portable Lantern', 'exploration', 'Lentera portabel untuk ruang gelap.', ['Cahaya dasar', 'Radius +25%', 'Cahaya stabil', 'Mengungkap jalur', 'Menerangi bukti tersembunyi'], 120, true),
  equipment('echo_beacon', 'Echo Beacon', 'exploration', 'Menandai jalur dan memanggil gema.', ['Penanda dasar', 'Dua penanda', 'Gema pemandu', 'Jalur pulang', 'Peta gema'], 210, false),
  equipment('portable_generator', 'Portable Generator', 'utility', 'Menyalakan perangkat investigasi di lapangan.', ['Daya dasar', 'Durasi +30%', 'Dua perangkat', 'Pemulihan daya', 'Daya tanpa batas lokal'], 280, false),
  equipment('signal_relay', 'Signal Relay', 'utility', 'Menjaga komunikasi tim dan sinyal misi.', ['Relay dasar', 'Jangkauan +40%', 'Sinkronisasi tim', 'Pemulihan koneksi', 'Relay server-validated'], 340, false),
];

export const ETERNAL_EQUIPMENT_BY_ID = Object.fromEntries(ETERNAL_EQUIPMENT.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------
// Dynamic world events
// ---------------------------------------------------------------------------
const event = (id, name, chapter, kind, objectives, rewards, extra = {}) => ({
  id, name, chapter, kind, objectives, rewards, duration: 3600, replay: 'rotation',
  accessibility: { antiJumpscare: true, reducedMotion: true }, ...extra,
});

export const WORLD_EVENTS = [
  event('midnight_disturbance', 'The Midnight Disturbance', 'midnight_city', 'incident',
    ['Selidiki sinyal aneh', 'Dokumentasikan entitas baru', 'Tutup sumber gangguan'],
    { spiritShards: 280, veilFragments: 25, ancientSeals: 1 }),
  event('carnival_returns', 'The Carnival Returns', 'carnival_lost_souls', 'limited',
    ['Masuki karnaval', 'Selesaikan tiga atraksi', 'Dokumentasikan Ringmaster'],
    { spiritShards: 320, veilFragments: 30, ancientSeals: 1 }),
  event('forgotten_gathering', 'The Forgotten Gathering', 'forgotten_kingdom', 'shared',
    ['Kumpulkan tiga klasifikasi', 'Dokumentasikan pertemuan', 'Laporkan ke Refuge'],
    { veilFragments: 35, memoryTokens: 20 }),
  event('broken_clock', 'The Broken Clock', 'midnight_city', 'incident',
    ['Temukan jam rusak', 'Rekam pola waktu', 'Stabilkan menit terakhir'], { spiritShards: 200, memoryTokens: 15 }),
  event('empty_station', 'The Empty Station', 'blackwater_depths', 'incident',
    ['Periksa peron kosong', 'Rekam sinyal kereta', 'Pulihkan jadwal'], { spiritShards: 220, veilFragments: 18 }),
  event('blackwater_signal', 'The Blackwater Signal', 'blackwater_depths', 'limited',
    ['Lacak sinyal bawah air', 'Selami rumah sinyal', 'Dokumentasikan sumber'], { veilFragments: 28, investigationMarks: 5 }),
  event('lost_parade', 'The Lost Parade', 'carnival_lost_souls', 'rotation',
    ['Ikuti parade', 'Hitung peserta', 'Dokumentasikan pemimpin parade'], { spiritShards: 240, memoryTokens: 18 }),
  event('forgotten_observatory', 'The Forgotten Observatory', 'astral_graveyard', 'limited',
    ['Buka observatorium', 'Kalibrasi lensa', 'Catat satu bintang mati'], { veilFragments: 32, ancientSeals: 1 }),
  event('unmarked_grave', 'The Unmarked Grave', 'eternal_nightfall', 'incident',
    ['Temukan makam', 'Baca prasasti', 'Kembalikan nama'], { memoryTokens: 25, ancientSeals: 1 }),
  event('ancient_bell', 'The Ancient Bell', 'forgotten_kingdom', 'rotation',
    ['Cari lonceng tua', 'Bedakan nada asli', 'Hentikan gema'], { spiritShards: 260, veilFragments: 22 }),
  event('last_broadcast', 'The Last Broadcast', 'eternal_nightfall', 'finale',
    ['Putar rekaman terakhir', 'Identifikasi suara', 'Tutup siaran'], { spiritShards: 400, veilFragments: 45, ancientSeals: 2 }),
];

export const WORLD_EVENTS_BY_ID = Object.fromEntries(WORLD_EVENTS.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------
// Multiplayer expedition
// ---------------------------------------------------------------------------
export const EXPEDITION_ROLES = [
  { id: 'lead', name: 'Lead Investigator', ability: 'Menentukan target prioritas dan memulai voting.', sanity: 0.95 },
  { id: 'archivist', name: 'Archivist', ability: 'Membuka catatan bersama dan berbagi temuan.', sanity: 1 },
  { id: 'tech', name: 'Field Technician', ability: 'Memperbaiki perangkat dan relay sinyal.', sanity: 1 },
  { id: 'guardian', name: 'Guardian', ability: 'Menahan manifestasi dan melindungi perangkat.', sanity: 1.1 },
  { id: 'medium', name: 'Medium', ability: 'Membaca entitas dan membuka dialog supernatural.', sanity: 0.9 },
];

export const COOP_TASKS = [
  { id: 'mechanisms', name: 'Aktifkan mekanisme lingkungan', players: 2 },
  { id: 'patterns', name: 'Dokumentasikan pola serangan bos', players: 1 },
  { id: 'source', name: 'Identifikasi sumber supernatural', players: 1 },
  { id: 'device', name: 'Lindungi perangkat investigasi', players: 2 },
  { id: 'puzzle', name: 'Selesaikan puzzle bersama', players: 2 },
];

export const COOP_DIFFICULTIES = ['story', 'easy', 'normal', 'hard', 'nightmare'];

// ---------------------------------------------------------------------------
// Index rank milestones and rewards
// ---------------------------------------------------------------------------
export const INDEX_RANK_MILESTONES = [
  { rank: 10, id: 'rank_10', name: 'Bingkai Profil Penyidik', type: 'profile', reward: { spiritShards: 150 } },
  { rank: 20, id: 'rank_20', name: 'Skin Peralatan Spektral', type: 'equipment_skin', reward: { veilFragments: 20 } },
  { rank: 30, id: 'rank_30', name: 'Peningkatan Alat Investigasi', type: 'tool_upgrade', reward: { investigationMarks: 8 } },
  { rank: 40, id: 'rank_40', name: 'Dekorasi Ghost Archive', type: 'archive', reward: { memoryTokens: 25 } },
  { rank: 50, id: 'rank_50', name: 'Gelar Master Researcher', type: 'title', reward: { ancientSeals: 1 } },
  { rank: 60, id: 'rank_60', name: 'Kosmetik Ancient Entity', type: 'cosmetic', reward: { veilFragments: 35 } },
  { rank: 70, id: 'rank_70', name: 'Tampilan Jurnal Eksklusif', type: 'journal', reward: { memoryTokens: 35 } },
  { rank: 80, id: 'rank_80', name: 'Skin Pendamping Spektral', type: 'companion', reward: { ancientSeals: 1 } },
  { rank: 90, id: 'rank_90', name: 'Outfit Penyidik Legendaris', type: 'outfit', reward: { veilFragments: 50 } },
  { rank: 100, id: 'rank_100', name: 'Gelar Eternal Archivist & Koleksi Kosmetik', type: 'title', reward: { ancientSeals: 3, veilFragments: 80 } },
];

export const ETERNAL_ACHIEVEMENTS = [
  { id: 'eternal_first', name: 'Malam Pertama', description: 'Masuki Arc X.', metric: 'runs', target: 1 },
  { id: 'eternal_chapter_one', name: 'Kota yang Berhenti', description: 'Selesaikan Midnight City.', metric: 'chapterClears', target: 1 },
  { id: 'eternal_all_chapters', name: 'Delapan Malam', description: 'Selesaikan kedelapan bab Arc X.', metric: 'chapterClears', target: 8 },
  { id: 'eternal_final', name: 'Nama Pertama', description: 'Kalahkan The First Forgotten.', metric: 'finalBoss', target: 1 },
  { id: 'eternal_hunter', name: 'Pemburu Spektral', description: 'Selesaikan 10 Spectral Pursuit.', metric: 'hunts', target: 10 },
  { id: 'eternal_workshop', name: 'Tangan Terampil', description: 'Capai Tier V pada satu peralatan.', metric: 'masterworks', target: 1 },
  { id: 'eternal_events', name: 'Saksi Dunia', description: 'Selesaikan 5 world event.', metric: 'events', target: 5 },
  { id: 'eternal_coop', name: 'Ekspedisi Bersama', description: 'Selesaikan satu ekspedisi co-op.', metric: 'coopClears', target: 1 },
  { id: 'eternal_index_72', name: 'Arsip Malam', description: 'Dokumentasikan 80 entitas.', metric: 'documented', target: 80 },
  { id: 'eternal_rank_100', name: 'Eternal Archivist', description: 'Capai Index Rank 100.', metric: 'indexRank', target: 100 },
];

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const ETERNAL_SETTING_DEFINITIONS = [
  { path: 'eternal.sanity.exposureEnabled', tab: 'sanity', label: 'Aktifkan Veil Exposure', type: 'toggle', value: true },
  { path: 'eternal.sanity.exposureGain', tab: 'sanity', label: 'Laju paparan', type: 'range', min: 0, max: 2, step: 0.05, value: 1 },
  { path: 'eternal.sanity.exposureDecay', tab: 'sanity', label: 'Peluruhan paparan', type: 'range', min: 0, max: 2, step: 0.05, value: 1 },
  { path: 'eternal.sanity.focusRecovery', tab: 'sanity', label: 'Pemulihan Mental Focus', type: 'range', min: 0.2, max: 2, step: 0.05, value: 1 },
  { path: 'eternal.hunts.duration', tab: 'hunts', label: 'Durasi hunt (detik)', type: 'select', options: ['180', '240', '300', '420', '600'], value: '300' },
  { path: 'eternal.hunts.antiJumpscare', tab: 'hunts', label: 'Hunt bebas jumpscare', type: 'toggle', value: true },
  { path: 'eternal.events.enabled', tab: 'events', label: 'World events aktif', type: 'toggle', value: true },
  { path: 'eternal.events.intensity', tab: 'events', label: 'Intensitas event', type: 'range', min: 0, max: 1, step: 0.05, value: 0.7 },
  { path: 'eternal.coop.roles', tab: 'coop', label: 'Peran investigator', type: 'toggle', value: true },
  { path: 'eternal.coop.sharedIndex', tab: 'coop', label: 'Bagikan penemuan Index', type: 'toggle', value: true },
  { path: 'eternal.coop.allowSpectators', tab: 'coop', label: 'Izinkan spectator', type: 'toggle', value: true },
  { path: 'eternal.performance.overlay', tab: 'settings', label: 'Overlay performa (dev)', type: 'toggle', value: false },
  { path: 'eternal.performance.adaptive', tab: 'settings', label: 'Adaptive performance (izin)', type: 'toggle', value: false },
  { path: 'eternal.performance.warnFrameMs', tab: 'settings', label: 'Ambang frame (ms)', type: 'range', min: 8, max: 50, step: 1, value: 20 },
  { path: 'eternal.accessibility.reducedMotion', tab: 'settings', label: 'Kurangi gerakan', type: 'toggle', value: false },
  { path: 'eternal.accessibility.highContrast', tab: 'settings', label: 'Kontras tinggi', type: 'toggle', value: false },
];

export const ETERNAL_DEFAULTS = Object.fromEntries(ETERNAL_SETTING_DEFINITIONS.map((d) => [d.path, d.value]));

export const PERFORMANCE_THRESHOLDS = {
  frameMs: 20,
  fps: 50,
  activeGhosts: 8,
  aiUpdates: 24,
  pathRequests: 6,
  particles: 240,
  audioEmitters: 24,
  loadedSections: 6,
  heapMb: 512,
  latencyMs: 180,
  replicationKb: 64,
  saveMs: 40,
};
