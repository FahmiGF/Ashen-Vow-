// Ashen Vow — PETA KISAH (storyline map).
//
// Pure data + helpers: no DOM, no storage, no gameplay mutation. The shell
// renders this list in the main menu so the whole story — from the first vow
// to the current arc — can be read without starting a run.
//
// Arc numerals follow the canonical campaign numbering used by the credit
// scenes (Arc I, II, III, VI, VIII, IX, X) plus Arc XI for The Lanternwake.
// Arc IV exists only as a locked teaser; Arc V and Arc VII are unused numbers
// reserved by MASTERPLAN.md. Side sagas carry no numeral on purpose.

export const STORY_CURRENT_ID = 'arc11';

export const STORY_ARCS = [
  {
    id: 'hearthfall',
    kind: 'prolog',
    numeral: 'PROLOG',
    title: 'HEARTHFALL',
    subtitle: 'The Hollow Court — sumpah pertama di bawah Opus.',
    color: '#a89078',
    era: 'v0.8.0',
    scope: '6 zona · 60 ruang',
    chapters: 6,
    bosses: 12,
    summary:
      'Sebelum ada puncak, ada perapian. Hearthfall mencatat sumpah paling tua: sebuah istana yang menyala hanya selama ada yang mengingatnya. Enam zona, dua belas penjaga, dan satu The First Vow yang menolak dipadamkan.',
    beats: [
      'Perapian Agung di Hollow Court mendingin; enam rumah menyimpan abu penghuninya.',
      'Dua belas bos berjaga di zona-zona istana, dari mini-boss tiga fase sampai penjaga zona empat fase.',
      'Rumah, sepuluh penghuni, dan delapan perabot membangun kembali perapian di antara run.',
      'The First Vow jatuh; perapian menyala lagi, tetapi sumpahnya sudah berpindah tangan.',
    ],
    cast: ['The First Vow', 'Nara Ashwright', 'Elowen Hearthkeeper', 'Ione Glassblade'],
    note: 'Kronologi paling awal yang tercatat. Berdiri sendiri — tidak wajib ditamatkan sebelum Arc I.',
  },
  {
    id: 'arc1',
    kind: 'main',
    numeral: 'ARC I',
    title: 'THE ASHEN VOW',
    subtitle: 'Sumpah yang dibawa pulang dari puncak.',
    color: '#d07a35',
    era: 'v0.1.0',
    scope: '14 ruang · 0–13',
    chapters: 8,
    bosses: 6,
    summary:
      'Gerbang Abu terbuka di kerajaan yang sudah lama lupa siapa yang berkuasa. Para penjaga mengunci jalan menuju puncak, dan satu sumpah menuntut darah untuk setiap langkah. Ini awal mula semua arc: pedang, relik, dan mahkota bara.',
    beats: [
      'Sir Mordrake, The Fallen Warden, jatuh di Singgasana Bara; gerbang baratnya membuka Mycelial Hollow.',
      'Vhael sang Wyrm, The Hollow Choir, dan jalan tulang menuju Menara Lonceng.',
      'Mycelial Hollow: The Sporebound dan Root of the First Vow yang memberi satu flask permanen.',
      'The Oathbreaker gugur di Puncak Sumpah — abu pertama akhirnya punya nama.',
    ],
    cast: ['Sir Mordrake', 'Vhael', 'The Hollow Choir', 'The Sporebound', 'The Oathbreaker'],
    note: 'Enam bos: Warden, Wyrm, Choir, Sporebound, Root, dan Oathbreaker. Tiga di antaranya tiga fase.',
  },
  {
    id: 'echoes',
    kind: 'interlude',
    numeral: 'GEMA',
    title: 'ECHOES OF THE FORGOTTEN WORLD',
    subtitle: 'Seratus level, sepuluh bab, satu nama yang diingat.',
    color: '#8a86e8',
    era: 'v0.3.0',
    scope: '100 level · 10 bab',
    chapters: 10,
    bosses: 30,
    summary:
      'Setelah mahkota bara jatuh, dunia mengingat hal-hal yang seharusnya dilupakan. Sepuluh biome, seratus level, dan tiga puluh bos mengantar ke Yang Terlupakan — nama yang terlalu lama tidak diucapkan.',
    beats: [
      'Sepuluh bab, masing-masing tujuh level standar, satu level lingkungan, satu mini-boss, dan satu bos besar.',
      'Thornveil Haven tumbuh di antara run: sepuluh NPC tetap, delapan upgrade, dua belas quest.',
      'Enam event musiman dan 120 koleksi mencatat setiap sudut dunia yang sempat dilihat.',
      'Yang Terlupakan gugur; gema terakhir tidak lagi sendirian.',
    ],
    cast: ['Yang Terlupakan', 'Penghuni Thornveil Haven', 'Dua puluh mini-boss'],
    note: 'Saga sisi terbesar: 100 level dan 30 bos, terpisah dari penomoran arc utama.',
  },
  {
    id: 'faewood',
    kind: 'side',
    numeral: 'TAMAN PERI',
    title: 'FAEWOOD',
    subtitle: 'Sayap spektral, langit yang retak, dan raja iblis yang jatuh.',
    color: '#9edc9a',
    era: 'v0.10.0',
    scope: '12 ruang · 414–425',
    chapters: 10,
    bosses: 2,
    summary:
      'Di bawah akar raksasa, peri-peri kecil menjaga taman yang tumbuh dari sisa sumpah. Sepuluh tahap jamur berujung pada dua arena: Slime Magma yang mendidih, lalu Sylvara — naga spektral yang berubah wujud setiap fase.',
    beats: [
      'Sepuluh tahap berurutan dari Lubang Masuk sampai Altar Spora, ditemani Pipp, Nia, Moss, dan Wick.',
      'Gelora, Slime Magma, jatuh di arena magma dengan empat fase.',
      'Sylvara, Peri Naga Spektral, berubah menjadi seraph di fase tiga dan Vharos, Demon Lord, di fase empat.',
      'Kerajaan Opus bebas; epilog tiga puluh detik menutup kisah Taman Peri.',
    ],
    cast: ['Gelora, Slime Magma', 'Sylvara, Peri Naga Spektral', 'Vharos, Demon Lord'],
    note: 'Dua bos, empat fase masing-masing, dua form surgawi dan neraka.',
  },
  {
    id: 'fallen',
    kind: 'main',
    numeral: 'ARC II',
    title: 'THE FALLEN ONES',
    subtitle: 'Langit yang tidak pernah berhenti memanggil.',
    color: '#d8c890',
    era: 'v0.13.0',
    scope: '59 ruang · 426–484',
    chapters: 11,
    bosses: 15,
    summary:
      'Setelah Puncak Sumpah, langit membuka diri. Sebelas wilayah surgawi, lima belas bos, dan tiga akhiran menunggu: berpihak pada tuan rumah, membebaskan Yang Terjatuh, atau menyerap kekuatan Seraphiel sendiri.',
    beats: [
      'Radiance, Judgment Mark, dan Shadow Stance menggantikan ritme pedang biasa.',
      'Purity Shield menahan damage mentah; hanya serangan yang tepat yang menyentuh HP aslinya.',
      'Empat bos opsional — Weeping Cherub, Throne of Thorns, Auditor Vael, The Fallen Mirror — membuka Eclipse.',
      'Seraphiel, The Dawn That Breaks, jatuh dari singgasananya; tiga jalan menunggu.',
    ],
    cast: ['Seraphiel', 'The Choir of Seven', 'Ophanim Prime', 'Mother Sorrow'],
    note: 'Tiga akhiran: Dawn, Dusk, dan Eclipse. Eclipse butuh keempat bos opsional.',
  },
  {
    id: 'crusade',
    kind: 'main',
    numeral: 'ARC III',
    title: 'THE RADIANT CRUSADE',
    subtitle: 'Zirah kosong di Gerbang Penghakiman.',
    color: '#e8c46a',
    era: 'v0.14.0',
    scope: '20 ruang · 485–504',
    chapters: 5,
    bosses: 5,
    summary:
      'Perang salib bergerak di antara reruntuhan langit. Lima tingkat pengepungan, dua puluh satu musuh, dan Valor Chain yang menuntut agresi: setiap pukulan mengisi rantai, setiap luka mengosongkannya.',
    beats: [
      'Kemah Perang menjadi checkpoint; lima panji permanen dan tiga jalur upgrade Sigil.',
      'Marshal Aurion, The Ballista Choir, Lady Vesperine, dan Warden Ophelion jatuh satu per satu.',
      'Crusader Strike menghabiskan empat langkah rantai untuk menghancurkan zirah.',
      'The Giant Paladin Templar Knight gugur dalam tiga fase; celah di langit terbuka.',
    ],
    cast: ['Marshal Aurion', 'Lady Vesperine', 'Warden Ophelion', 'The Giant Paladin Templar Knight'],
    note: 'Kemenangannya membuka celah menuju Arc IV — The Rift — yang masih terkunci.',
  },
  {
    id: 'rift',
    kind: 'locked',
    numeral: 'ARC IV',
    title: 'THE RIFT',
    subtitle: 'The Devilish Scum — celah yang belum dirancang.',
    color: '#b04a5a',
    era: 'teaser',
    scope: 'belum ada ruang',
    chapters: 0,
    bosses: 0,
    summary:
      'Celah di langit bukan gerbang. Untuk sekarang The Rift hanya jejak: satu Hollow Crusader yang membawa petunjuk, satu kartu terkunci di kemah perang, dan satu nama yang belum ditulis. Tidak ada ruang, bos, atau progres yang bisa dimainkan.',
    beats: [
      'Kartu The Rift tampil di menu Perang Salib dengan status TERKUNCI.',
      'Hollow Crusader menyimpan petunjuk pertama tentang The Devilish Scum.',
      'Tidak ada save, hadiah, atau pencapaian yang bisa diperoleh dari arc ini.',
    ],
    cast: ['The Devilish Scum (nama sementara)'],
    note: 'Sengaja kosong. Arc V dan Arc VII juga masih berupa nomor cadangan di MASTERPLAN.md.',
  },
  {
    id: 'astral',
    kind: 'main',
    numeral: 'ARC VI',
    title: 'THE ASTRAL DOMINION',
    subtitle: 'Tahta di antara bintang dan kehampaan.',
    color: '#9fc8ff',
    era: 'v0.17.0',
    scope: '20 ruang · 505–524',
    chapters: 5,
    bosses: 5,
    summary:
      'Di luar celah, dominion astral menjaga sisa hukum yang belum runtuh. Lima wilayah, dua puluh stage, dan satu aturan yang tidak berubah: setiap hall standar berisi tepat dua puluh musuh, empat archetype, satu elite.',
    beats: [
      'Starfall Passage, Nebula Gardens, The Astral Observatory, Voidbound Citadel, The Eternal Throne.',
      'Star-Eaten Sentinel, Nebula Harvester, Clockwork Oracle, dan Gravity Tyrant berjaga.',
      'The Architect of Eternity bertarung dalam empat fase di singgasana terakhir.',
      'Dominion berpindah tangan; The Unwritten Expanse tetap terkunci di baliknya.',
    ],
    cast: ['The Architect of Eternity', 'The Clockwork Oracle', 'The Gravity Tyrant'],
    note: 'The Unwritten Expanse adalah teaser terkunci, bukan konten yang bisa dimainkan.',
  },
  {
    id: 'atlas',
    kind: 'side',
    numeral: 'ATLAS',
    title: 'THE SUNDERED ATLAS',
    subtitle: 'Delapan wilayah, satu halaman terakhir.',
    color: '#c8a2e8',
    era: 'v0.6.0',
    scope: '240 ruang · 114–353',
    chapters: 8,
    bosses: 16,
    summary:
      'Peta dunia itu sendiri pecah, dan setiap pecahannya menyimpan satu wilayah lengkap dengan penjaganya. Delapan zona, 240 ruang, dan empat akhiran menunggu di ujung Perpustakaan yang terbakar.',
    beats: [
      'Vael Gardens, Gilded Aviary, Starfall Observatory, Witherwood, Sandglass Wastes, Catacombs of the Faithless, Abyssal Deep, Clockwork Foundry.',
      'Delapan penjaga zona dan delapan guardian menjaga tiap pecahan atlas.',
      'Aureus, The Prime Engine, adalah mesin pertama yang menempa waktu menjadi roda gigi.',
      'Empat akhiran: The Mended Vow, The Blank Page, The New Cartographer, The Broken Compass.',
    ],
    cast: ['Aureus, The Prime Engine', 'Sylva Vael', 'Corvus, The Withering King', 'Nyx, The Leviathan Below'],
    note: 'Saga sisi terbesar setelah Echoes. Tidak memakai nomor arc dan tidak memblokir arc utama.',
  },
  {
    id: 'eclipse',
    kind: 'main',
    numeral: 'ARC VIII',
    title: 'ECLIPSE OF THE FORGOTTEN GODS',
    subtitle: 'Nama di balik segel, dan tangan yang menulis hukum.',
    color: '#c86ad8',
    era: 'v0.18.0',
    scope: '37 ruang + 100 lantai · 525–661',
    chapters: 6,
    bosses: 7,
    summary:
      'Enam biome, tiga puluh stage, dan satu Forgotten Pantheon. Gerhana bukan cuaca: ia sidang. Setiap stage standar tetap memuat dua puluh musuh, empat archetype, dan satu elite, sementara tujuh encounter menutup jalan menuju The First Author.',
    beats: [
      'Obsidian Kingdom, Celestial Graveyard, Shattered Clockwork, Hollow Divinity, Eternal Eclipse, Throne Beyond Creation.',
      'The Obsidian King, Gravekeeper of Eternity, First Chronomancer, Silent Divinity, Eclipse Monarch, Forgotten High God.',
      'Godfall Ascension membuka seratus lantai dan lima kelas baru; guild serta tiga raid berjalan di sisinya.',
      'The First Author — bos rahasia opsional — hanya terbuka lewat enam pecahan penjaga.',
    ],
    cast: ['The Forgotten High God', 'The First Author', 'The Obsidian King', 'The First Chronomancer'],
    note: 'Tujuh bos; The First Author opsional dan tidak memblokir kampanye.',
  },
  {
    id: 'veil',
    kind: 'main',
    numeral: 'ARC IX',
    title: 'THE VEIL OF THE FORGOTTEN',
    subtitle: 'Arsip yang menulis ulang dirinya sendiri.',
    color: '#7fa6c8',
    era: 'v0.24.0',
    scope: '30 stage · 6 bab',
    chapters: 6,
    bosses: 7,
    summary:
      'Tabir bukan dinding, melainkan halaman. Scary Mode membuka arsip yang mencatat setiap nama yang pernah dihapus, dan Sanity bukan nyawa: ia hanya menentukan seberapa jelas kau melihat halaman itu.',
    beats: [
      'Tiga puluh stage di enam bab, semuanya memakai kontrak dua puluh musuh: sembilan belas normal dan satu elite.',
      'Ghost Index mencatat delapan puluh entitas dalam dua belas klasifikasi, dari Revenant sampai Primordial.',
      'Investigasi, refuge, dan Mind & Spirit membangun ulang cara bertahan tanpa menambah damage.',
      'Arsitek Tabir gugur; halaman terakhir akhirnya ditulis.',
    ],
    cast: ['The Veil Architect', 'The Choir of Witnesses', 'Penghuni Ghost Index'],
    note: 'Arsip dan Sanity punya save sendiri; tidak menimpa progres kampanye utama.',
  },
  {
    id: 'eternal',
    kind: 'main',
    numeral: 'ARC X',
    title: 'THE ETERNAL NIGHT',
    subtitle: 'Malam pertama, dan nama yang tidak boleh dilupakan.',
    color: '#5f7bd3',
    era: 'v0.25.0',
    scope: '40 stage · 8 bab',
    chapters: 8,
    bosses: 9,
    summary:
      'Malam tidak turun; ia diputuskan. Delapan bab, empat puluh stage, dan sembilan bos menuntun ke The First Forgotten — nama yang menjadi alasan semua malam ini ada. The Unwritten Wing menambah satu bab penuh berisi anomali.',
    beats: [
      'Investigasi deterministik, Spectral Hunt, workshop, world events, dan ekspedisi ko-op lokal.',
      'Sembilan bos, dari The Clockless Mayor sampai The Night Sovereign.',
      'The Unwritten Wing menambah lima stage anomali dan The Unwritten sebagai penjaga baru.',
      'The First Forgotten bertarung dalam lima fase; fajar tidak lagi meminta izin.',
    ],
    cast: ['The First Forgotten', 'The Night Sovereign', 'The Unwritten', 'The Abyssal Bellkeeper'],
    note: 'Arc X punya save sendiri (ashen-vow-eternal-v1) dan membaca Ghost Index Arc IX secara langsung.',
  },
  {
    id: 'cistern',
    kind: 'side',
    numeral: 'BAB IX',
    title: 'TIDEWROUGHT CISTERN',
    subtitle: 'Air yang berhenti menghakimi.',
    color: '#5fd3c2',
    era: 'v0.35.0',
    scope: '7 ruang · 662–668',
    chapters: 4,
    bosses: 1,
    summary:
      'Di bawah Puncak Sumpah, sistem penampungan menampung setiap sumpah yang gagal. Empat hall, dua relung rahasia, dan satu bangsawan yang sudah tenggelam seratus tahun. Tidak ada yang naik dari sini tanpa membawa basah.',
    beats: [
      'Empat hall berurutan, masing-masing dengan kontrak dua puluh musuh dan satu elite.',
      'Dua relung rahasia di balik dinding: Sunken Alcove dan Low Cave Whisper.',
      'Vasska, The Tidebound Regent, memakai pasang sebagai senjata dalam tiga fase.',
      'Sistem katup dibuka; jalan menuju The Lanternwake mulai menyala.',
    ],
    cast: ['Vasska, The Tidebound Regent', 'Drowned Thrall', 'Tide Acolyte'],
    note: 'Butuh Arc I tuntas (The Oathbreaker) sebelum bisa dibuka.',
  },
  {
    id: 'arc11',
    kind: 'main',
    numeral: 'ARC XI',
    title: 'THE LANTERNWAKE',
    subtitle: 'Api sembilan sumbu, dan nama yang menjaga nyala.',
    color: '#ffb85c',
    era: 'v0.36.0',
    scope: '5 ruang · 669–673',
    chapters: 5,
    bosses: 1,
    summary:
      'Arc terakhir yang bisa dimainkan sekarang. Setelah katup Cistern dibuka, cahaya kecil bergerak di lorong yang seharusnya kosong. Empat hall penuh wick-moth, lantern-wisp, taper-hound, dan ash-bearer menuntun ke Orsella, The Wickbearer.',
    beats: [
      'Empat hall, dua puluh musuh per hall: sembilan belas normal dan satu elite wickbearer_acolyte.',
      'Setiap hall disusun deterministik, jadi tidak ada dua lorong yang sama persis.',
      'Orsella memakai mesin tide-regent: sapuan, kipas, gelombang tanah, dan summons wick_moth.',
      'Empat fase, 1.180 HP, dan satu syarat: Cistern harus sudah dibuka sebelum nyala ini muncul.',
    ],
    cast: ['Orsella, The Wickbearer', 'Wick Moth', 'Lantern Wisp', 'Taper Hound'],
    note: 'Titik cerita paling jauh saat ini (v0.41.0). Arc XII — The Last Vow — baru rencana di MASTERPLAN.md.',
  },
];

export const STORY_ARC_BY_ID = Object.fromEntries(STORY_ARCS.map((arc) => [arc.id, arc]));

export const STORY_KIND_LABELS = {
  prolog: 'PROLOG',
  main: 'ARC UTAMA',
  interlude: 'INTERLUDE',
  side: 'SAGA SISI',
  locked: 'CELAH TERKUNCI',
};

export function storyArcFor(id) {
  return STORY_ARC_BY_ID[id] || null;
}

export function sanitizeStoryArcId(id) {
  return STORY_ARC_BY_ID[id] ? id : STORY_ARCS[0].id;
}

export function storyArcIndex(id) {
  return STORY_ARCS.findIndex((arc) => arc.id === id);
}

export function adjacentStoryArc(id, delta) {
  const index = storyArcIndex(id);
  if (index < 0) return null;
  const next = index + delta;
  if (next < 0 || next >= STORY_ARCS.length) return null;
  return STORY_ARCS[next];
}

export function storyStatusLabel(arc) {
  if (!arc) return '';
  if (arc.kind === 'locked') return 'TERKUNCI';
  return arc.id === STORY_CURRENT_ID ? 'TERBARU' : 'RILIS';
}

export function storyKindLabel(arc) {
  if (!arc) return '';
  return STORY_KIND_LABELS[arc.kind] || 'ARC';
}

export function storyMapSummary() {
  const shipped = STORY_ARCS.filter((arc) => arc.kind !== 'locked');
  const locked = STORY_ARCS.length - shipped.length;
  const main = STORY_ARCS.filter((arc) => arc.kind === 'main').length;
  return {
    total: STORY_ARCS.length,
    shipped: shipped.length,
    locked,
    main,
    bosses: STORY_ARCS.reduce((sum, arc) => sum + (arc.bosses || 0), 0),
    current: STORY_CURRENT_ID,
    currentArc: storyArcFor(STORY_CURRENT_ID),
    currentIndex: storyArcIndex(STORY_CURRENT_ID),
  };
}
