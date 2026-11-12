# Ashen Vow — v0.2.0

> **Sumpah di antara abu.** Simulasi metroidvania medieval 2D dengan combat pedang real-time, relik lompat ganda, **sepuluh penjaga**, **empat belas ruang dan enam boss** (hingga tiga fase), **dialog boss** di awal/fase/akhir pertempuran, **bioma Mycelial Hollow** dengan trampolin spora dan miselium yang bisa dipanjat, **musik prosedural per zona**, **pengaturan + keybind yang bisa diubah**, **peta interaktif**, **indeks sumpah** untuk musuh/senjata/boss/barang, **inventaris Sigil & Ritual**, **catatan update di dalam game**, checkpoint di ambang pertempuran, dan **Warung Abu** dengan delapan belas barang.

Ashen Vow adalah game web tanpa build step: HTML5 Canvas + ES Modules murni. Seluruh simulasi combat berjalan deterministik di `src/core.js`, sehingga bisa diuji otomatis dengan Node tanpa browser.

![Menu utama Ashen Vow](docs/menu.png)

## Trailer sinematik

[![Tonton trailer Ashen Vow](trailer/thumbnail.png)](trailer/ashen-vow-trailer.mp4)

Trailer resmi berdurasi **2 menit** (1280×720, 30 fps) beserta thumbnail tersedia di folder [`trailer/`](trailer/):

- [`trailer/ashen-vow-trailer.mp4`](trailer/ashen-vow-trailer.mp4) — 120 detik, H.264 + AAC.
- [`trailer/thumbnail.png`](trailer/thumbnail.png) — key art 1280×720.

Seluruh footage diambil langsung dari build game ini (bukan mockup): pertarungan Gerbang Abu, traversal Balai Sumpah, duel **Sir Mordrake**, **Warung Abu**, dan pertarungan **Vhael**. Lihat [`trailer/README.md`](trailer/README.md) untuk rincian produksi.

## Cara menjalankan

```bash
npm start
```

Buka <http://127.0.0.1:4300>.

Tidak perlu `npm install` — tidak ada dependensi runtime.

## Alur menu

Game **tidak langsung masuk ke gameplay**. Saat dibuka, yang tampil adalah menu utama:

- **MULAI PERJALANAN** — memulai run baru dari Gerbang Abu.
- **PILIH PENJAGA** — buka layar karakter: pilih salah satu dari sepuluh penjaga, atur ras, warna kulit, warna pakaian, dan gaya armor sebelum berangkat.
- **PILIH LEVEL** — melihat 14 ruang, status terkunci/terbuka/tuntas, dan progres tersimpan.
- **PETA SUMPAH** — peta interaktif perjalanan dengan kabut perang dan pin, bisa dibuka kapan saja dengan `M`.
- **INDEKS SUMPAH** — indeks musuh, senjata, boss, dan barang, bisa dibuka dengan `O`.
- **CATATAN UPDATE** — riwayat rilis di dalam game, dari fondasi pertama sampai **Sigil & Ritual**.
- **PENGATURAN** — audio, keybind, gamepad, dan aksesibilitas.
- **CREDITS** — halaman kredit game.

Progres disimpan otomatis di `localStorage` dengan key `ashen-vow-progress-v1`; pengaturan dan keybind disimpan terpisah di `ashen-vow-settings-v1`. Menyelesaikan sebuah ruang membuka ruang berikutnya. Layar jeda, kematian, dan kemenangan juga punya jalan kembali ke **PILIH LEVEL** dan **MENU UTAMA**.

### Peta dan Indeks

![Peta Sumpah](docs/map.png)

**Peta Sumpah** (`M`) sekarang berupa kanvas interaktif: ruang yang belum dimasuki tertutup kabut, tetangga langsung tampil sebagai garis putus-putus, setiap zona punya warna sendiri, posisi pemain berdenyut, boss yang gugur berubah menjadi tengkorak abu, dan tooltip menampilkan isi ruang. Geser untuk pan, gulir atau `+`/`−` untuk zoom, klik ganda untuk recenter. Klik peta untuk menaruh pin (catatan, air, kunci, kembali nanti; maksimal 10); klik kanan di dekat pin untuk menghapusnya. Pin dan fog tersimpan bersama progres.

Lima zona sudah didefinisikan — Ashen Hall, Mycelial Hollow, Tidewrought Cistern, Frostglass Cathedral, dan Cinder Maw — dan empat belas ruang saat ini dipetakan ke empat di antaranya. Mycelial Hollow kini bisa dimainkan penuh sebagai cabang opsional dari Singgasana Bara. Zona baru akan muncul otomatis di peta dan memakai track musiknya sendiri.

![Indeks Sumpah](docs/codex.png)

**Indeks Sumpah** (`O`) memiliki empat tab:

- **MUSUH** — crawler, sentinel, hollow wraith, cinder brute, sporeling, mycelial stalker, brood mother.
- **SENJATA** — Pedang Sumpah, Pike Penjaga, Busur Abu.
- **BOSS** — keenam penjaga, HP, jumlah fase, hadiah abu, dan lokasinya.
- **BARANG** — isi Warung Abu, relik, abu, dan berkah sumpah.

### Dialog Boss

Setiap boss berbicara di awal pertempuran, saat berpindah fase, dan ketika gugur. Dialog membekukan simulasi sampai pemain menekan `Space`/`Enter`, mengklik **LANJUT**, atau menutupnya dengan `Esc`. The Oathbreaker memiliki dialog tambahan untuk fase III.

### Level Select dan Sneak Peek

![Pilih level](docs/levels.png)

Semua ruang tampil di Level Select. Ruang yang belum selesai berstatus **TERKUNCI**:

- tombol **MAINKAN** disembunyikan,
- hanya tersedia **SNEAK PEEK**.

Sneak Peek adalah mode **spectate-only**: kamera menyusuri ruang atau mengitari boss, tanpa pemain, tanpa HUD, dan tanpa combat. Tekan `←` / `→` untuk menggeser kamera, `Esc` untuk kembali.

![Sneak Peek](docs/sneak-peek.png)

### Credits

Halaman credits memuat:

> **MADE BY SealiusHQ**
> with a lot of support from **Contributors**

![Credits](docs/credits.png)

### Pilih Penjaga, Kustomisasi & Keahlian Khusus

Terdapat **sepuluh penjaga/kelas** yang bisa dimainkan, masing-masing dengan statistik dan **Keahlian Khusus (*Active Ability*)**:

| Penjaga | Kelas | Darah | Serangan | Kecepatan | Keahlian Khusus |
| --- | --- | --- | --- | --- | --- |
| **Sera Vayne** | The Knight | 100 | 1.00x | 1.00x | **Tebasan Sumpah** (`U`/`V`) |
| **Lyna Windstrider** | Elf Archer | 88 | 1.04x | 1.08x | **Tembakan Badai** (`U`/`V`) |
| **Kael Shadowstep** | Assassin | 82 | 1.12x | 1.14x | **Langkah Bayangan** (`U`/`V`) |
| **Karn of the Ash** | Brawler | 125 | 1.08x | 0.93x | **Hentakan Bara** (`U`/`V`) |
| **Ignis Pyrewalker** | Mage | 86 | 1.16x | 0.98x | **Ledakan Nova Bara** (`U`/`V`) |
| **Varek the Unbroken** | Gladiator | 115 | 1.06x | 1.02x | **Terjangan Arena** (`U`/`V`) |
| **Neris of the Net** | Netfighter | 90 | 1.02x | 1.06x | **Jaring Penjaga** (`U`/`V`) |
| **Astra Stormcaller** | Stormcaller | 84 | 1.14x | 1.00x | **Rantai Badai** (`U`/`V`) |
| **Bram Ironward** | Sentinel | 120 | 1.00x | 0.94x | **Denyut Aegis** (`U`/`V`) |
| **Maera Thornward** | Warden | 98 | 1.03x | 1.03x | **Voli Duri** (`U`/`V`) |

Di layar **PILIH PENJAGA** kamu bisa mengganti:

- **Karakter / Kelas** — Knight, Archer, Assassin, Brawler, Mage, Gladiator, Netfighter, Stormcaller, Sentinel, Warden.
- **Ras** — Manusia, Elf, Goblin, Orc, Iblis. Setiap ras punya warna kulit, mata, dan ciri wajah sendiri (telinga panjang, taring, tanduk).
- **Pakaian** — Medieval, Modern, Tribal, Royal, Ashen. Gaya menentukan bentuk armor, helm, jubah, dan aksen.
- **Warna kulit** — delapan nada dari pucat sampai hijau goblin dan merah iblis.
- **Warna pakaian** — delapan warna kain, jubah, dan aksen.
- **Efek VFX & Animasi Altar**: Altar berputar, partikel bintang sparkling berkilau (*glitter stars*), dan gelombang kejut transisi (*shockwave pulse*) saat pergantian karakter.

![Layar karakter](docs/character.png)

Pratinjau karakter digambar langsung di Canvas dan ikut berubah setiap kali pilihan diganti. Pilihan disimpan otomatis di `localStorage` dengan key `ashen-vow-character-v1`, jadi tetap ada saat game dibuka lagi. Stat karakter tetap seimbang: Karn lebih tebal dan keras, Sera lebih lincah.

### Prolog Opus (60 detik)

Saat memulai perjalanan baru dari menu utama atau layar karakter, game memutar **prolog sinematik satu menit** sebelum ruang pertama. Prolog menceritakan:

1. Kemegahan **Kerajaan Opus** di atas tujuh bukit.
2. Sumpah para raja dan kemakmuran yang menarik perhatian dunia lain.
3. **Serangan Iblis** yang membelah langit dan membuka gerbang neraka.
4. **Pengkhianatan Elf Kegelapan** yang menyerang dari bayangan.
5. Kehancuran Opus, ladang abu, dan sumpah yang masih berdiri.

![Prolog Opus](docs/prologue.png)

Prolog terdiri dari **12 babak × 5 detik**. Setiap babak punya narasi suara (Web Speech API, `id-ID`) dan **subtitle** yang selalu tampil, sehingga cerita tetap terbaca meskipun browser tidak punya suara. Musik prolog dimainkan lewat WebAudio.

- **LEWATI** atau `Esc` — langsung memulai permainan.
- `Space` / `Enter` — maju ke babak berikutnya.
- **SUARA: AKTIF/MATI** atau `N` — menyalakan atau mematikan narasi.

Prolog hanya diputar untuk perjalanan baru; memulai dari **PILIH LEVEL** atau tombol coba lagi tidak memutarnya kembali.

## Kontrol

| Aksi | Keyboard (bawaan) |
| --- | --- |
| Bergerak | `A` / `D` atau `←` / `→` |
| Lompat | `Space` / `W` |
| Lompat ganda | Tekan lompat lagi setelah **Relik Bulu Bara** |
| Serang (kombo 3 hit) | `J` atau `Z` |
| Keahlian Khusus (Ability) | `U` atau `V` |
| Ganti senjata | `Q` atau `C` |
| Lempar item cepat | `K` atau `X` |
| Ganti item cepat | `R` |
| Buka/tutup Warung Abu | `F` atau `Enter` (dekat pedagang) |
| Dash (i-frame) | `L` atau `Shift` |
| Minum flask | `E` atau `H` |
| Jeda / Pengaturan | `Esc` atau `P` |
| Peta Sumpah | `M` atau `Tab` |
| Indeks Sumpah | `O` |
| Inventaris | `I` |
| Suara | `N` |
| Pilih berkah | `1` / `2` / `3` |

Semua aksi di atas dapat diubah dari **Pengaturan → Kontrol** (satu atau dua slot per aksi). Perubahan langsung tersimpan dan dipakai gameplay. Di menu: `Enter` memulai run, `P` membuka layar karakter, `L` membuka Level Select, `C` membuka Credits, `U` membuka Catatan Update.
Di perangkat sentuh, tombol kiri/kanan, lompat, serang, dash, flask, ganti senjata (`⇄`), dan item cepat (`✦`) muncul otomatis.

## Fondasi v0.0.8 — Milestone A

Milestone A dari masterplan sudah mendarat. Semua fitur di bawah ini berjalan nyata di build, bukan tombol hiasan:

- **Audio engine prosedural** (`src/music.js`) — satu AudioContext dengan bus master, musik, dan SFX terpisah. Track menu, Ashen Hall, Mycelial Hollow, Tidewrought Cistern, Frostglass Cathedral, Cinder Maw, boss, dan victory disintesis langsung dari osilator; crossfade 1,7 detik antar ruang/zona dan layer combat yang memudar masuk saat musuh dekat. Audio baru aktif setelah klik/keypress pertama.
- **Pengaturan (menu utama & jeda)** — tab Audio (master/music/SFX, mute, mute saat tab blur), Kontrol (dua slot per aksi, deteksi konflik dengan Tukar/Batal, reset per aksi dan reset semua, Gamepad API), serta Gameplay & Aksesibilitas (screen shake Off/Low/Full, kurangi kilatan, kontras tinggi, mode buta warna, ukuran teks, batas 60/120/uncapped FPS, penghitung FPS).
- **Penyimpanan terpisah** — pengaturan dan keybind disimpan di `ashen-vow-settings-v1`, tidak pernah terhapus saat progres (`ashen-vow-progress-v1`) di-reset.
- **Peta interaktif v1** (`src/map.js`) — digambar dari konfigurasi ruang yang sama dengan game: fog of war, outline tetangga, warna per zona, marker pemain berdenyut, tengkorak boss yang menjadi abu setelah gugur, tooltip, legenda, pan/zoom, recenter, hingga 10 pin (catatan/air/kunci/kembali) yang tersimpan.
- **Input yang bisa diubah** — semua aksi gameplay membaca binding dari Settings; `Esc` selalu menutup satu lapis menu.
- **Migrasi save v0.0.7** — save lama tetap dimuat; ruang yang sudah tuntas otomatis ditandai ditemukan di peta baru.
- **Zona siap diperluas** — `src/zones.js` memetakan setiap ruang ke zona dan menyimpan palette, partikel, warna peta, serta ID musik. Menambah ruang/zona baru tidak menyentuh kode audio atau peta.
- **Tes baru** — `tests/foundations.test.js` menguji settings, konflik keybind, persistensi, gamepad, fog of war, pin, statistik peta, pemetaan zona, dan keamanan MusicManager tanpa AudioContext.

## Mycelial Hollow — Milestone B (v0.1.0)

Milestone B menambahkan bioma opsional penuh yang bisa dimasuki dari **Singgasana Bara** setelah Warden gugur, lalu kembali ke sana lewat gerbang akhir:

- **Enam ruang baru** — Lubang Masuk, Taman Spora, Jembatan Gantung, Sarang Induk, Relung Tersembunyi (rahasia), dan Altar Spora.
- **Trampolin spora** — topi spora memantulkan pemain dengan kekuatan berbeda di tiap ruang.
- **Miselium yang bisa dipanjat** — tahan lompat di strip akar untuk naik.
- **Tiga musuh baru** — Sporeling yang melompat, Mycelial Stalker yang menggali lalu menerjang, dan Brood Mother yang menetaskan Sporeling.
- **The Sporebound** — boss tiga fase dengan 780 HP; fase II menambah spora, fase III mempercepat pola dan memanggil brood.
- **Root of the First Vow** — mini-boss opsional di balik dinding miselium yang harus dihancurkan (120 damage). Hadiahnya **+1 flask maksimum permanen** untuk run tersebut plus isi ulang penuh.
- **Gerbang bercabang** — ruang 2 memakai gerbang timur dan barat; ruang 11 memakai gerbang rahasia ke relung tersembunyi dan gerbang timur ke arena bos. Progres baru menyimpan penemuan ruang rahasia, tetapi menyelesaikan ruang 12 tetap menandainya tuntas di Level Select.
- **Musik mycelial** — track zona dan boss baru di `src/music.js`.
- **Peta 14 simpul** — Mycelial Hollow tampil sebagai cabang simetris dengan warna zona sendiri; kartu Level Select ruang 12 tetap tersembunyi sampai ditemukan.
- **Tes dan smoke test** — 79 tes Node dan smoke test CDP 36 pemeriksaan mencakup trampolin, panjat, dinding rahasia, fase Sporebound, hadiah flask Root, gerbang kembali, serta persistensi setelah reload.

Zona yang belum bisa dimainkan dan direncanakan di milestone berikutnya: Tidewrought Cistern, Frostglass Cathedral, Cinder Maw, plus cerita/ending, bahasa Inggris, fast travel, dan boss tambahan. Lihat [`MASTERPLAN.md`](MASTERPLAN.md).

## Sigil & Ritual — v0.2.0

Update konten pertama setelah fondasi dan Mycelial Hollow. Semua sistem di bawah ini aktif di build:

- **Lima penjaga baru** — Gladiator (Terjangan Arena), Netfighter (Jaring Penjaga), Stormcaller (Rantai Badai), Sentinel (Denyut Aegis), dan Warden (Voli Duri), lengkap dengan statistik, penampilan, dan kemampuan sendiri.
- **Empat Sigil permanen** — dibeli sekali di Warung Abu dan bertahan sampai run berakhir:
  - **Sigil Bara** (45 abu) — +18% damage.
  - **Sigil Besi** (40 abu) — +25 HP maksimum dan langsung memulihkan 25 HP.
  - **Sigil Angin** (40 abu) — +8% kecepatan gerak dan cooldown dash 12% lebih singkat.
  - **Sigil Sumpah** (60 abu) — +1 charge flask dan isi ulang penuh.
- **Empat Item Ritual** — tersimpan sebagai stok dan dipakai dari inventaris:
  - **Ritus Penyucian** (50 abu) — 60 damage ke semua musuh dan melenyapkan proyektil lawan.
  - **Ritus Penjagaan** (40 abu) — kebal 6 detik dan +15 HP.
  - **Ritus Bara** (45 abu) — 12 bola api ke segala arah.
  - **Ritus Pemulihan** (35 abu) — +50 HP dan +1 charge flask.
- **Enam konsumabel** — Shuriken ×3 (14), Pisau Lempar ×5 (18), Bom Bara ×2 (24), Tonik Abu (16), Vial Asap (20), dan Batu Asah (22). Pisau terbang lebih cepat dan menusuk, bom meledak di area, tonik memulihkan 30 HP instan, asap memberi kebal 2,5 detik, dan batu asah memberi +30% damage selama 25 detik.
- **Inventaris in-run (`I`)** — layar baru yang mengelompokkan Sigil, Ritual, dan Konsumabel. Ritual/konsumabel bisa langsung dipakai dari sini; Sigil ditandai **AKTIF** karena efeknya pasif.
- **Item cepat (`R`)** — HUD menampilkan item cepat terpilih (Shuriken, Pisau, atau Bom) beserta sisa jumlahnya. `K`/`X` melempar item yang sedang dipilih.
- **Catatan Update** — layar riwayat rilis di menu utama, berisi ringkasan, sorotan, dan perbaikan setiap versi. Data rilis disimpan di `src/updates.js`.
- **Keybind yang dirapikan** — ability kini `U`/`V`, `I` menjadi inventaris, `O` membuka Indeks, `R` mengganti item cepat, dan gamepad memakai Select untuk inventaris, L3 untuk item cepat, serta R3 untuk peta.
- **Perbaikan HUD dan toko** — ikon, label tipe, status sigil aktif, dan tata letak grid toko diperluas untuk 18 barang.

## Isi v0.2.0

- **10 penjaga yang bisa dipilih** — Sera Vayne, Lyna Windstrider, Kael Shadowstep, Karn of the Ash, Ignis Pyrewalker, Varek the Unbroken, Neris of the Net, Astra Stormcaller, Bram Ironward, dan Maera Thornward.
- **Kustomisasi karakter** — ras (manusia, elf, goblin, orc, iblis), 5 gaya armor, 8 warna kulit, dan 8 warna pakaian, dengan pratinjau Canvas langsung.
- **Inventaris (`I`) dan Update Log** — Sigil, Ritual, dan konsumabel tersimpan per run; riwayat rilis bisa dibaca dari menu utama.
- **Prolog sinematik 60 detik** — 12 babak naratif tentang kejatuhan Opus, lengkap dengan voice-over dan subtitle, dapat dilewati.

- **Menu awal, Level Select, Credits, dan progres tersimpan** — tidak langsung masuk gameplay.
- **14 ruang** yang terhubung: Gerbang Abu → Balai Sumpah → Singgasana Bara → Sarang Wyrm → Jembatan Tulang → Katedral Sunyi → Menara Lonceng → Puncak Sumpah, ditambah cabang **Mycelial Hollow** (Lubang Masuk → Taman Spora → Jembatan Gantung → Sarang Induk → Relung Tersembunyi / Altar Spora) yang kembali ke Singgasana Bara.
- **6 boss** dengan dialog dan fase:
  - **Sir Mordrake, the Fallen Warden** (340 HP, 2 fase) — telegraf tebasan, ground slam, gelombang kejut. Fase II mempercepat gerak, mempersingkat windup, dan menambah gelombang kejut.
  - **Vhael, the Ashen Wyrm** (480 HP, 2 fase) — volley bola api dan dive attack. Fase II menambah **pilar api**.
  - **The Hollow Choir** (560 HP, 2 fase) — koor tanpa suara yang melayang, menembakkan **note** spiral dan **beam** vertikal. Fase II mempercepat pola dan menambah gema.
  - **The Oathbreaker** (720 HP, 3 fase) — final boss dengan tebasan, dash, volley, dan nova. Fase II dan III membuka pola tambahan; mengalahkannya menyelesaikan run.
  - **The Sporebound** (780 HP, 3 fase) — boss Mycelial Hollow dengan spora, cloud, dan panggilan brood; fase III mempercepat semuanya.
  - **Root of the First Vow** (360 HP, 2 fase, opsional) — mini-boss di balik dinding rahasia; hadiah **+1 flask maksimum** dan isi ulang penuh.
- **Dialog boss** untuk intro, setiap fase, dan akhir pertempuran; simulasi berhenti selama dialog.
- **Peta Sumpah (`M`)** — terbuka dari menu, jeda, atau saat bermain.
- **Indeks Sumpah (`O`)** — tab musuh, senjata, boss, dan barang.
- **Lima musuh baru**:
  - **Hollow Wraith** — melayang, menjaga jarak, dan melepas wisp.
  - **Cinder Brute** — lambat dan besar; hentakan lantainya memancarkan gelombang kejut.
  - **Sporeling** — tunas miselium yang melompat dan pecah menjadi awan spora.
  - **Mycelial Stalker** — menggali, muncul di bawah pemain, lalu menerjang.
  - **Brood Mother** — menetaskan Sporeling selama pertarungan.
- **Combat real-time**: kombo 3 hit, hitbox aktif per frame, hit-stop, screen shake, knockback, dan partikel.
- **AI pengejaran platform-aware** — crawler dan sentinel mengejar pemain, mendeteksi tepi platform, melompat ke pemain yang lebih tinggi, dan melintasi jurang. Patroli hanya aktif saat pemain di luar jangkauan.
- **Checkpoint Warung Abu** di ambang setiap ruang bos. Mati setelah checkpoint membangkitkan pemain di ruang bos dengan HP/flask penuh; abu, senjata, amunisi, dan berkah tetap tersimpan.
- **Mata uang Abu (`ash`)** — didapat dari crawler (8), sentinel (15), wraith (16), brute (22), sporeling (10), stalker (20), brood mother (32), Warden (60), Wyrm (90), Choir (110), Sporebound (150), Root (80), dan Oathbreaker (160). Ditampilkan di HUD.
- **Warung Abu** — toko di samping checkpoint ruang bos. Buka dengan `F` saat dekat pedagang atau dari menu jeda. Menjual 18 barang:
  - **Pike Penjaga** (35 abu) — jangkauan 118, windup lambat, damage 29.
  - **Busur Abu** (55 abu) — menembak anak panah, amunisi terbatas; termasuk 8 anak panah.
  - **Sigil Bara / Besi / Angin / Sumpah** (45/40/40/60 abu) — upgrade pasif permanen per run.
  - **Ritus Penyucian / Penjagaan / Bara / Pemulihan** (50/40/45/35 abu) — item ritual sekali pakai.
  - **Shuriken ×3** (14 abu), **Pisau Lempar ×5** (18 abu), **Bom Bara ×2** (24 abu) — item cepat, tombol `K` dan `R`.
  - **Tonik Abu** (16 abu), **Vial Asap** (20 abu), **Batu Asah** (22 abu) — konsumabel inventaris.
  - **Anak Panah ×6** (12 abu) — amunisi busur.
  - **Isi Ulang Flask** (10 abu).
  Mulai langsung dari Level Select di ruang 2–14 memberi stipend abu bertingkat (45 hingga 240) agar toko tetap bisa dipakai.
- **Tiga senjata** dengan animasi berbeda: Pedang Sumpah (kombo), Pike Penjaga (jangkauan), Busur Abu (proyektil). Berganti dengan `Q`.
- **Dash dengan i-frame** dan cooldown.
- **Relik Bulu Bara** — membuka lompat ganda dan menyegel gerbang Balai Sumpah.
- **Jurang** sebagai hazard: jatuh mengurangi HP dan mengembalikan pemain ke titik aman.
- **Tiga berkah** setelah setiap boss non-final: Max HP, damage, atau dash.
- **Flask penyembuh** (3 charge) dengan waktu minum yang bisa diganggu.
- **HUD** HP, flask, status relik, abu, senjata/amunisi, item cepat terpilih, bar boss dengan label **FASE I / II / III**, petunjuk gerbang, banner ruang.
- **Audio prosedural** WebAudio — tanpa file audio.
- Layar judul, jeda, berkah, kematian, dan kemenangan.

## Tangkapan layar

| Gerbang Abu | Warden fase II |
| --- | --- |
| ![Gameplay](docs/gameplay.png) | ![Warden](docs/warden.png) |

| Wyrm menembak | Sneak Peek |
| --- | --- |
| ![Wyrm](docs/wyrm.png) | ![Sneak Peek](docs/sneak-peek.png) |

## Verifikasi mekanik

```bash
npm test
```

**93 tes deterministik, semuanya lulus.** Cakupannya:

- gravitasi dan pendaratan di platform,
- pergerakan dan batas dunia,
- lompat tunggal vs lompat ganda setelah relik,
- registrasi hitbox pedang sampai crawler mati,
- i-frame saat terkena dan saat dash,
- konsumsi flask,
- gerbang terkunci/terbuka dan transisi ruang,
- pengambilan relik,
- damage jurang dan respawn,
- siklus serangan sentinel,
- **pengejaran crawler dan lompatan ke platform yang lebih tinggi**,
- **posisi musuh yang mengejar tidak dipaksa kembali ke batas patroli saat terkena pukulan**,
- **checkpoint ruang bos, respawn yang mempertahankan abu/senjata/berkah**,
- **hadiah abu dari musuh dan boss**,
- **pembelian Warung Abu, validasi amunisi, dan penolakan pembelian ganda**,
- **jangkauan/windup Pike, panah Busur yang menghabiskan amunisi, lempar Shuriken**,
- **siklus ganti senjata dan interaksi pedagang berbasis jarak**,
- transisi fase Warden dan gelombang kejut fase II,
- kematian Warden → pilihan berkah → gerbang terbuka,
- pengaruh berkah damage,
- proyektil Wyrm melukai pemain,
- siklus dive Wyrm dan bola api,
- **transisi fase II Wyrm dan serangan pilar api**,
- **kemenangan setelah Wyrm — kini berlanjut ke bab V, bukan mengakhiri run**,
- **14 ruang dan 6 boss: warden, wyrm, choir, oathbreaker, sporebound, root**,
- **dialog intro, fase II, dan kekalahan untuk setiap boss; fase III khusus The Oathbreaker dan The Sporebound**,
- **wraith yang melayang dan menembak wisp, brute yang menghentak lantai**,
- **sporeling yang melompat, stalker yang menggali dan menerjang, brood mother yang menetaskan adds**,
- **trampolin spora meluncurkan pemain dan miselium bisa dipanjat**,
- **dinding miselium menyerap damage pedang/proyektil dan membuka gerbang rahasia**,
- **gerbang barat ruang 2 menuju Mycelial Hollow setelah Warden gugur**,
- **tiga fase The Sporebound, gerbang kembali ke ruang 2, dan persistensi penemuan ruang rahasia**,
- **Root of the First Vow memberi +1 flask maksimum dan isi ulang penuh**,
- **serangan note dan beam The Hollow Choir serta gerbangnya**,
- **tiga fase The Oathbreaker dan kemenangan akhir**,
- **isi indeks: 7 musuh, 3 senjata, 6 boss, dan seluruh barang**,
- **gerbang boss memakai ruang saat ini, bukan indeks hardcoded**,
- **10 penjaga dengan statistik seimbang, penampilan valid, dan ability unik**,
- **lima ability baru: Terjangan Arena, Jaring Penjaga, Rantai Badai, Denyut Aegis, dan Voli Duri**,
- **Sigil permanen: beli sekali, efek langsung, dan pembelian ganda ditolak**,
- **Ritual: stok berkurang saat dipakai dan efek damage/heal/kebal berlaku**,
- **item cepat: siklus Shuriken → Pisau → Bom, lemparan, dan ledakan area**,
- **konsumabel Tonik, Asap, dan Batu Asah beserta durasi buff-nya**,
- **katalog Warung Abu berisi 18 barang dengan tipe, glyph, dan efek lengkap**,
- **Update Log: versi terbaru di atas, tidak ada duplikat, dan cocok dengan `GAME_VERSION`**,
- **settings: satu atau dua slot unik per aksi, sanitasi nilai, persistensi, dan pemulihan JSON rusak**,
- **rebinding menukar aksi yang berkonflik tanpa meninggalkan tombol ganda**,
- **pemetaan gamepad dengan deadzone sumbu**,
- **peta: layout dua arah, fog of war, statistik, pin (maks. 10), dan pemetaan zona**,
- **setiap ruang punya zona, track, palette, dan partikel yang valid**,
- **MusicManager aman tanpa AudioContext**,
- state kematian membekukan simulasi.

Smoke test browser dijalankan lewat Chrome DevTools Protocol untuk memastikan:

- menu awal tampil dan HUD tersembunyi,
- Level Select menampilkan 14 kartu dengan status terkunci yang benar dan kartu rahasia yang tetap tersembunyi sampai ditemukan,
- indeks memiliki 4 tab dengan entri yang benar,
- peta interaktif menampilkan fog of war, statistik, legenda, dan alat pin; klik peta menyimpan pin ke progres,
- pengaturan terbuka dari menu dan jeda: 3 tab, 3 slider audio, 27 tombol binding, dan 3 pilihan gameplay,
- slider musik langsung tersimpan ke `ashen-vow-settings-v1` tanpa menyentuh progres,
- konflik keybind menampilkan **TUKAR/BATAL**; menukar Jump ke `L` memindahkan Dash ke `Space`, dan reset mengembalikan bawaan,
- audio ter-unlock lewat gesture pertama, membuat AudioContext, memutar `menu`, lalu crossfade ke `ashen` saat run dimulai,
- dialog boss muncul untuk intro, fase, dan kekalahan; `Space`/`Enter` melanjutkannya,
- HUD menampilkan FASE II / FASE III dengan benar,
- ruang 5, 6, dan 8 (choir, oathbreaker, wraith/brute) berjalan tanpa exception,
- Sneak Peek menyembunyikan pemain dan HUD,
- teks credits sesuai,
- progres tersimpan setelah reload,
- **Warung Abu terbuka, menampilkan 18 kartu, dan pembelian memperbarui abu/HUD**,
- **inventaris menampilkan Sigil/Ritual/Konsumabel, memakai item, dan menutup dengan `I`/`Esc`**,
- **Catatan Update terbuka dari menu utama dan menampilkan versi terbaru**,
- **checkpoint respawn mempertahankan abu dan senjata serta memulihkan HP/flask/boss**,
- **AI mengejar dan melompat, senjata berganti, dan busur tanpa amunisi ditolak**,
- **Mycelial Hollow: gerbang barat ruang 2, trampolin spora, panjat miselium, dan rangkaian ruang 8→9→10→11**,
- **dinding rahasia hancur oleh tebasan sungguhan, membuka Relung Tersembunyi; Root memberi +1 flask dan gerbang kembali**,
- **The Sporebound mencapai fase II/III, gerbang akhir kembali ke Singgasana Bara, dan Warden tetap gugur**,
- **penemuan serta penyelesaian enam ruang mycelial tersimpan ke localStorage dan bertahan setelah reload; kartu rahasia terbuka**,
- tidak ada error console,
- layout desktop dan mobile portrait (390×844) tidak memiliki overflow horizontal, termasuk peta dan indeks.

## Struktur proyek

```
ashen-vow/
├── index.html          # shell, menu, HUD, level select, map, codex, inventory, update log, dialogue
├── styles.css          # tema medieval, layout responsif, touch controls, peta/indeks/inventaris
├── server.js           # static server port 4300
├── CLAUDE.md           # master plan / handoff untuk Claude
├── MASTERPLAN.md       # roadmap v0.1.0 → v1.0 (zona, boss, cerita, rilis)
├── src/
│   ├── core.js         # simulasi murni: player, musuh, boss, dialog, indeks, senjata, toko, sigil, ritual
│   ├── render.js       # renderer Canvas prosedural + mode spectate, proyektil baru, opsi aksesibilitas
│   ├── audio.js        # SFX WebAudio prosedural + bus master/music/SFX
│   ├── music.js        # MusicManager prosedural: track zona, crossfade, layer combat
│   ├── settings.js     # pengaturan, keybind satu/dua slot, konflik, gamepad, persistensi
│   ├── updates.js      # riwayat rilis + GAME_VERSION untuk Update Log
│   ├── zones.js        # konfigurasi zona: palette, partikel, warna peta, ID musik
│   ├── map.js          # model peta (fog, pin, statistik) + renderer canvas peta
│   └── main.js         # loop fixed-timestep, menu, progres, input, HUD, peta, pengaturan, dialog, inventaris
├── tests/
│   ├── core.test.js
│   ├── foundations.test.js  # settings, keybind, peta, zona, musik
│   └── updates.test.js      # urutan dan kelengkapan Update Log
└── docs/               # tangkapan layar
```

### Desain simulasi

`AshenGame.update(dt, input)` memakai fixed timestep `1/120` detik. Logika tidak menyentuh DOM sehingga hasilnya sama di Node dan browser. Renderer dan audio hanya membaca state/event; event gameplay dikumpulkan di `game.events` untuk dipetakan ke SFX, UI, dan progres.

Event penting:

- `gatePass { from, to }` — ruang selesai dan ruang berikutnya dimasuki.
- `bossDown { room, kind, name }` — boss dikalahkan.
- `bossPhase { name, phase }` — transisi fase boss.
- `bossDialogue { kind, phase, name, title, lines }` — dialog boss untuk `intro`, `phase2`, `phase3`, atau `defeat`.
- `bossSpawn`, `bossTelegraph`, `bossSlash`, `bossSlam`, `bossDie`, `note`, `beam`.
- `wallHit`, `wallBroken` — dinding miselium menyerap damage / hancur dan membuka gerbang rahasia.
- `flaskReward { maxFlasks }` — Root of the First Vow memberi flask maksimum tambahan.
- `bounce`, `spore`, `sporeCloud` — trampolin spora dan serangan spora.
- `checkpoint { room, name }` — checkpoint aktif saat memasuki ruang bos.
- `checkpointRespawn { room }` — pemain bangkit di checkpoint.
- `ashGain { amount, total }` — abu diperoleh dari musuh/boss.
- `shopBuy { id, name, cost }` — pembelian Warung Abu berhasil.
- `weaponSwitch`, `arrowShot`, `shurikenThrow`, `noAmmo` — umpan balik senjata/konsumabel.

Debug hook `window.__ashen` tersedia untuk smoke test (`snap()`, `step()`, `enterRoom()`, `damageBoss()`, `chooseBlessing()`, `startSpectate()`, `openShop()`, `buyShopItem()`, `respawnAtCheckpoint()`, `giveAsh()`, `openMap()`, `closeMap()`, `openCodex()`, `closeCodex()`, `openInventory()`, `closeInventory()`, `useInventoryItem()`, `showUpdates()`, `advanceDialogue()`, `showSettings()`, `closeSettings()`, `clearProgress()`, serta getter `settings`, `mapData`, `musicTrack`, `audioState`, `inventoryOpen`, dan `version`).

## Master plan

Ringkasan arsitektur, keputusan desain, status verifikasi, dan roadmap lengkap ada di [`CLAUDE.md`](CLAUDE.md) dan [`MASTERPLAN.md`](MASTERPLAN.md).

## Lisensi

Proyek demo pribadi. Aset visual dan audio dibuat secara prosedural di dalam kode.
