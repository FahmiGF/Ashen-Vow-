// Ashen Vow — release history shown in the in-game Update Log.
// Keep the newest entry first. `GAME_VERSION` is the single source of truth
// for the version shown by the Update Log screen and the debug hooks.
export const GAME_VERSION = '0.3.0';

export const UPDATE_LOG = [
  {
    version: '0.3.0',
    date: '12 November 2026',
    title: 'ECHOES OF THE FORGOTTEN WORLD',
    tag: 'MAJOR EXPANSION',
    summary:
      'Ekspansi besar: seratus level baru dalam sepuluh bab, Thornveil Haven yang tumbuh permanen, Ashen Chronicle dengan event dan kulit eksklusif, serta jurnal koleksi yang menyimpan setiap penemuan.',
    highlights: [
      '100 level baru dalam 10 bab — 7 level standar, 1 level lingkungan, 1 elite, dan 1 boss besar di setiap bab.',
      '10 biome baru dengan parallax bergerak, cuaca dinamis, kondisi wilayah, hazard, dan musik prosedural sendiri.',
      '100 tipe musuh dasar dengan 300 varian, 20 mini-boss, dan 10 boss besar dengan pola serangan baru.',
      'Thornveil Haven: 10 NPC tetap, 12 quest bercabang, 8 fasilitas permanen, dan evolusi visual permukiman.',
      '8 permukiman dan 52 NPC yang tersebar di seluruh kampanye, masing-masing dengan dialog dan layanan.',
      '5 tingkat kesulitan, 6 modifier tantangan opsional, 5 tingkat New Game Plus, 8 mode berulang, dan 4 ujian akhir.',
      'Ashen Chronicle: 6 tema event musiman, misi, jalur hadiah, toko event, dan 20+ kulit eksklusif yang permanen.',
      'Lemari kulit dengan pratinjau dan Jurnal Koleksi berisi 12 kategori serta 120 koleksi.',
      'Progres ekspansi disimpan di save yang sama; save lama tetap utuh dan semua hadiah event tidak pernah hilang.',
    ],
    fixes: [
      'Wraith kembali terbang dengan benar setelah pemisahan arsitektur musuh ekspansi.',
      'Peta, level select, dan Indeks Sumpah lama tetap berisi 14 ruang dan 6 boss tanpa perubahan.',
      'Kulit hanya mengubah tampilan — tidak ada bonus tempur atau mekanisme bayar-untuk-menang.',
    ],
  },
  {
    version: '0.2.0',
    date: '11 November 2026',
    title: 'SIGIL & RITUAL',
    tag: 'CONTENT UPDATE',
    summary:
      'Perjalanan baru di antara abu: empat Sigil pasif, empat Ritus sekali pakai, enam konsumabel baru, lima penjaga tambahan, dan inventaris yang bisa dibuka kapan saja.',
    highlights: [
      '5 penjaga baru: Gladiator, Retiarius, Stormcaller, Sentinel, dan Warden — masing-masing dengan keahlian unik.',
      '4 Sigil permanen: Bara, Besi, Angin, dan Sumpah. Efeknya bertahan sampai run berakhir.',
      '4 Item Ritual: Penyucian, Penjagaan, Bara, dan Pemulihan. Simpan untuk momen yang tepat.',
      '6 konsumabel baru: Pisau Lempar, Bom Bara, Tonik Abu, Vial Asap, Batu Asah, dan Shuriken.',
      'Inventaris in-run: tekan I untuk melihat Sigil, Ritual, dan konsumabel yang kau bawa.',
      'Item cepat: tekan R untuk berganti antara Shuriken, Pisau Lempar, dan Bom Bara.',
      'Update Log baru di menu utama — catatan rilis ini bisa dibaca kapan saja.',
    ],
    fixes: [
      'Slot kedua keahlian dipindah dari I ke V agar I bisa dipakai untuk Inventaris.',
      'Indeks Sumpah kini dibuka dengan O dari keyboard; tombol menu dan jeda tetap tersedia.',
      'HUD menampilkan item cepat yang sedang dipilih beserta sisa jumlahnya.',
    ],
  },
  {
    version: '0.1.0',
    date: '10 November 2026',
    title: 'FONDASI ABU',
    tag: 'MILESTONE',
    summary:
      'Lapisan sistem yang membuat Ashen Vow bisa dimainkan dari awal sampai akhir: pengaturan, peta interaktif, musik adaptif, dan pengujian otomatis.',
    highlights: [
      'Lima penjaga awal dengan statistik, kemampuan aktif, ras, warna, dan pakaian yang bisa diubah.',
      'Pengaturan audio, keybind yang bisa diubah, dan opsi aksesibilitas.',
      'Peta Sumpah interaktif dengan kabut perang, pin, dan legenda zona.',
      'Musik adaptif per zona serta efek suara prosedural.',
      'Suite pengujian Node untuk gameplay, peta, pengaturan, dan musik.',
    ],
    fixes: [
      'Penyimpanan progres, karakter, dan pengaturan dipisah agar tidak saling menimpa.',
      'Respawn checkpoint mempertahankan abu, senjata, dan berkah.',
    ],
  },
  {
    version: '0.0.7',
    date: '9 November 2026',
    title: 'PILIH PENJAGA',
    tag: 'FEATURE',
    summary:
      'Character select dan kustomisasi penjaga: pilih tubuh, ras, pakaian, dan warna sebelum mengucapkan sumpah.',
    highlights: [
      'Layar karakter dengan pratinjau canvas dan statistik hidup.',
      'Kustomisasi ras, pakaian, warna kulit, dan warna kain.',
      'Prolog satu menit yang memperkenalkan kehancuran Opus.',
      'Kemampuan aktif pertama untuk setiap penjaga.',
    ],
    fixes: [
      'Tampilan penjaga tersimpan otomatis di browser.',
      'Pratinjau karakter memakai warna tema masing-masing penjaga.',
    ],
  },
  {
    version: '0.0.6',
    date: '8 November 2026',
    title: 'GEMA DI KEDALAMAN',
    tag: 'CONTENT',
    summary:
      'Delapan ruang, empat boss, dialog boss, peta, dan indeks lengkap. Perjalanan menuju puncak Opus mulai terbentuk.',
    highlights: [
      'Delapan ruang utama dengan gerbang, jebakan, dan relik.',
      'Empat boss dengan fase, dialog, dan pola serangan berbeda.',
      'Indeks Sumpah untuk musuh, senjata, boss, dan barang.',
      'Peta perjalanan dan checkpoint di ruang menjelang boss.',
    ],
    fixes: [
      'Dialog boss tidak lagi terpotong saat fase berganti.',
      'Gerbang rahasia Miselium bisa dibuka setelah boss tertentu gugur.',
    ],
  },
  {
    version: '0.0.5',
    date: '7 November 2026',
    title: 'JALAN ABU',
    tag: 'FOUNDATION',
    summary:
      'Ekonomi abu, Warung Abu, checkpoint, senjata kedua, dan amunisi. Kematian mulai terasa seperti bagian dari perjalanan.',
    highlights: [
      'Abu sebagai mata uang dari musuh dan boss.',
      'Warung Abu dengan senjata, amunisi, shuriken, dan isi ulang flask.',
      'Checkpoint yang menyimpan abu dan perlengkapan.',
      'Pike dan Busur Abu sebagai pilihan senjata.',
    ],
    fixes: [
      'Pembelian yang gagal tidak lagi memotong abu.',
      'Respawn mengembalikan flask ke kapasitas penuh.',
    ],
  },
];

export const LATEST_UPDATE = UPDATE_LOG[0];
