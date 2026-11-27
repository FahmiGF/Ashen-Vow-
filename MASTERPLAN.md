# Ashen Vow — Masterplan 4.0

**27 November 2026 · Baseline kerja v0.41.0 · Roadmap menuju v1.0**

Prioritas rilis berikutnya adalah mengamankan snapshot v0.41.0, memulihkan verifikasi browser, lalu mempercepat jalur dari startup ke permainan. Optimasi berjalan per mode dengan pengukuran sebelum dan sesudah. Roadmap konten dari `MASTERPLAN.md` 3.0 tetap menjadi rujukan untuk desain, roster, dan alokasi ruang, dengan urutan rilis yang diperbarui di bawah.

## Status pelaksanaan

Pekerjaan berjalan di `C:\Users\ASUS\OneDrive\Documents\ChatGPT\Ashen-Vow`, salinan 238 file sumber dari snapshot yang diaudit. Riwayat Git dan data admin dari sumber berada di checkout asal. Ledger konten 3.0 tersedia di [`docs/archive/MASTERPLAN-3.0.md`](docs/archive/MASTERPLAN-3.0.md).

| Tahap | Bukti dan pekerjaan terbuka |
| --- | --- |
| **P0 · Terverifikasi di workspace** | README, paket, handoff, HTML dan Update Log memakai v0.41.0. Suite Node lulus **812/812**. Chrome melewati trailer profil baru, 24 cek Boss Voice dengan fixture rekaman, 32 cek trailer, dan 83 cek Wave Defense. Peta Sumpah lulus 61 cek desktop dan 62 cek potret 390×844, termasuk tenggat bertahan, elite, kode v2 dan v3, dan reload. |
| **P1 · Gerbang iterasi pertama lulus** | Build `npm run start:release` meminifikasi modul dan menggabungkan CSS startup lokal menjadi satu respons, dengan URL modul dan alur muat mode yang tetap kompatibel. Chrome mengukur **2,15 MB** JavaScript sebelum kompresi, **43% lebih kecil** dari baseline audit 3,79 MB, dan **746 KB** transfer. Update Log, Peta Sumpah, Pirate Tide, Wave Defense, dan 3D/WebGL dimuat saat dibuka. Sasaran fondasi 900 KB sebelum kompresi dan pemisahan katalog kampanye masih terbuka. |
| **P2 · Berjalan** | Optimasi meter Peta Sumpah dan jeda trailer lulus uji browser. Optimasi simulasi Wave Defense dan Riftwar lulus replay deterministik. Profil frame mencakup Lanternwake, Infinitower, Riftwar, Godfall, dan horror 2D/3D. Pengukuran berulang pada perangkat fisik dan gerbang rilis P2 masih terbuka. |
| **P3 · Berjalan** | Server memakai cache LRU 16 MiB dengan batas 256 entri, kompresi async dan deduplikasi permintaan yang sedang berjalan. Dalam dua percobaan proses server baru dengan 110 aset, rata-rata median sweep berulang turun dari **319,93 ms ke 147,59 ms**, dan rata-rata p95 per aset dari **25,57 ms ke 13,26 ms**. Reproduksi memakai `npm run bench:assets`. Tes integrasi HTTP dan relay memakai direktori admin temporer. Slot save, uji co-op 4 pemain dan soak 30 menit masih terbuka. |
| **P4–P5 · Terbuka** | Integrasi 200 ruang, arc lanjutan, ending, dan gerbang rilis v1.0 tetap dalam lingkup roadmap. |

## 1. Snapshot yang diaudit

| Aspek | Kondisi 27 November |
| --- | --- |
| Branch dan commit lokal | `feat/boss-voice` di `ba27daf`, sama dengan ref pelacak lokal `origin/feat/boss-voice`. Commit ini satu commit di depan `release/v0.36.0`. |
| Staging Git | **Kosong**. `git diff-index --cached --quiet HEAD` mengembalikan `0`. |
| Perubahan lokal | **21 file terlacak berubah** dan **5 file belum terlacak**, yaitu `src/mapeditor.js`, `styles-mapeditor.css`, `tests/mapeditor.test.js`, `tools/editor-smoke.mjs`, dan `tools/bake-trailer-voice.mjs`. |
| Versi yang dijalankan | `package.json`, judul HTML, dan `GAME_VERSION` menunjuk v0.41.0. Update Log sudah memuat Update XXXI. Judul teratas README dan entri penjelasan terbaru di `CLAUDE.md` masih v0.40.0. `MASTERPLAN.md` 3.0 juga memakai nomor v0.37–0.41 untuk pekerjaan lama yang sebagian masih terbuka. |
| Konten yang ada | **674 ruang kampanye, 116 bos, 262 tipe musuh, 18 kelas kampanye**. Peta Sumpah mempunyai kanvas medan, rantai maksimal enam ruang, enam takaran, elite, objektif bertahan, dan AUTO-SEIMBANG. |
| Kompatibilitas Peta Sumpah | Save memakai `ashen-vow-mapeditor-v1` skema 3. Prefix kode berbagi tetap `AVME1.`. Decoder menerima payload skema 2 dari v0.40.0. |
| Suara bos | Katalog mencakup **613 baris dari 116 bos**, dengan 454 baris bos dan 159 baris pemain. Manifest checkout berisi **0 rekaman terdaftar**. Mode default dapat memakai sting sinematik. Suara AI ber-FX bergantung pada konfigurasi dan pilihan pemain. |
| Jalur yang masih terbuka | Spesifikasi Frontiers 101–200 dan Overdrive 201–300 ada, dengan ruang yang belum masuk `ALL_ROOMS`. Arc IV The Rift dan Unwritten Expanse masih menunggu realisasi. |

Pisahkan snapshot lokal menjadi perubahan Infinitower dan Spiral Choir, fondasi dan perluasan Peta Sumpah, serta dokumentasi rilis. Susun berdasarkan ketergantungan dan periksa perpotongan perubahan di `src/main.js`, `src/core.js`, `index.html`, dan `src/updates.js` sebelum menentukan commit rilis.

## 2. Baseline dan sasaran optimasi

| Area | Baseline saat audit | Sasaran awal | Cara memeriksa |
| --- | --- | --- | --- |
| Startup JavaScript | Graf impor statis `src/main.js` mencapai **69 modul**, **3.792.663 byte mentah** dan sekitar **1.012.168 byte gzip**, dihitung per modul. `main.js` berisi **20.788 baris**, **60 deklarasi impor statis**, dan **0 `import()`**. | Kurangi byte mentah startup ≥25% pada iterasi pertama. Sasaran tahap fondasi ≤900 KB mentah sebelum menu interaktif. | Ambil startup cold/warm memakai Chrome. Laporkan byte mentah, byte transfer, p50/p95 waktu ke menu, dan waktu muat pertama setiap mode. |
| CSS startup | **16 stylesheet lokal** di `index.html`, dengan **351.419 byte mentah**, ditambah stylesheet font eksternal. | Satu stylesheet lokal yang memblokir menu setelah CSS mode dimuat saat dibutuhkan. | Periksa daftar request, menu pertama, transisi, dan pergantian orientasi. |
| Update Log | `src/updates.js` **136.296 byte mentah**, sekitar **49.962 byte gzip**. Modul masuk graf startup menu dan diimpor server untuk membaca versi. | Pindahkan data riwayat keluar jalur startup. Versi game tetap tersedia sinkron. | Startup tidak meminta modul riwayat. Klik atau tombol pintas membuka riwayat lengkap, dan versi server, judul HTML, serta log tetap cocok. |
| Frame 2D | Satu profil Chrome headless 1280×900 di salinan menghasilkan p95 interval **13,4 ms** di menu dan **13,8 ms** di kampanye (ruang 3) serta Wave Defense Endless (gelombang 26). Biaya canvas dengan readback **19,09 ms** di kampanye dan **16,34 ms** di Endless. Sampel 2,6 detik per skenario ini bersifat indikatif. | p95 interval frame ≤16,7 ms untuk sasaran 60 FPS desktop, ≤33,3 ms untuk sasaran 30 FPS perangkat rendah. | `profile:frames`, `probe:render`, dan rekaman LoAF. Laporkan waktu render, interval aktual, p99, dan frame >50 ms secara terpisah. |
| Simulasi | `bench:sim` awal memakai ruangan 7, 10 musuh, 160 proyektil, dan 220 efek. Compaction saat ini **6.919 langkah/detik** dan pembanding `filter` **7.289** pada satu percobaan. | Tetapkan ambang dari beberapa ulangan berpasangan. Tambahkan skenario 40 musuh, dan terima perubahan jika p95 biaya step atau alokasi membaik dengan hasil simulasi yang sama. | `bench:sim`, `bench:wavedefense`, `bench:pirates`, `bench:court`, plus replay dengan seed dan input tetap. |
| 3D dan aset | Inventaris menyebut **16 GLB**, sekitar **4,71 MiB** dan **58.802 segitiga**. | Muat model per mode, lalu uji sasaran aset total ≤3,5 MiB. Pertahankan animasi, collision, dan keterbacaan siluet. | `bench:3d`, `assets:inventory`, uji 3D/Blackveil, dan jejak memori saat mode ditutup. |
| Peta Sumpah | Patch kandidat mempercepat kalkulasi meter dan AUTO-SEIMBANG pada benchmark Node. Lihat §3. | Dukungan input lama, hasil penyeimbangan yang konsisten, dan jalur UI cepat dengan 20 peta berisi roster penuh. | Suite Map Editor, fixture skema 1–3, uji drag/auto-balance di desktop dan 390×844, serta pengukuran waktu interaksi. |
| Save dan memori | Penyimpanan tersebar di `src/main.js` dan modul. Soak 30 menit belum diukur. | Stabilkan heap setelah pemanasan. Sasaran awal ≤10% pertumbuhan heap pasca-GC pada profil yang sama dan nol canvas lepas yang tertahan. | Ulangi masuk-keluar mode selama 30 menit. Catat listener, timer, RAF, `AudioNode`, dan heap sebelum/sesudah siklus. |
| Co-op, suara, dan server | Tes relay ada. Bandwidth 4 pemain, beban cold-cache, dan waktu decode audio belum diukur pada audit. | Co-op 4 pemain pada 20 Hz dengan sasaran ≤40 KB/detik per klien. Kurangi kompresi, request, dan decode yang berulang setelah diprofilkan. | Beban lokal dengan fixture 4 pemain, HTTP cold/warm, reconnect dan migrasi host, serta metrik audio offline dan saat layanan eksternal lambat. |

Gunakan tiga profil bernama dengan spesifikasi tercatat. Jalankan desktop, browser pada viewport ponsel potret, dan setidaknya satu ponsel fisik untuk menilai GPU, audio, dan termal. Ukur waktu sampai bootstrap siap secara terpisah dari waktu sampai menu bisa dipakai setelah trailer dilewati. Sasaran cold boot lokal untuk jalur menu adalah ≤1,2 detik di desktop dan ≤2,5 detik pada profil perangkat rendah. Tetapkan ambang otomatis setelah variasi antar-run diketahui. Simpan build, versi browser, resolusi, DPR, preset, seed, pemanasan, durasi, serta p50/p95/p99 untuk setiap hasil yang dibandingkan.

## 3. Optimasi pertama yang diukur

Kandidat `src/mapeditor.js` memakai satu sanitasi untuk satu kalkulasi meter. AUTO-SEIMBANG menghitung rasio setiap iterasi, lalu menyusun pita dan saran sekali setelah penyeimbangan selesai. Hasil API diuji terhadap implementasi awal pada empat fungsi publik dengan 645 input, termasuk keenam takaran, musuh elite, bos, objektif bertahan, roster besar, dan masukan rusak.

| Kalkulasi | Sebelum | Kandidat | Percepatan |
| --- | --- | --- | --- |
| Meter tekanan (`threatRating`) | 12,896 ms | 7,349 ms | **1,75×** |
| AUTO-SEIMBANG (`autoBalanceBlueprint`) | 197,233 ms | 21,581 ms | **9,14×** |

Angka di atas adalah median dari 15 ulangan berpasangan, masing-masing memakai 640 peta uji pada Node v24.22.0. Durasi mengukur kalkulasi murni. Jalur UI menyertakan biaya tambahan berupa pekerjaan DOM dan canvas. Patch yang sebelumnya diuji pada salinan kini diterapkan di workspace.

Suite Node lulus **811/811** pada checkout sumber dan pada salinan dengan patch. `git apply --check` berhasil terhadap salinan file sumber yang sama. Verifikasi byte-per-byte memakai `core.autocrlf=false` agar format akhir baris LF ikut terjaga.

Pada audit awal, smoke Boss Voice menemukan dua respons HTTP 404 untuk `assets/voice/trailer/ident.mp3`. Workspace kini membaca daftar rekaman trailer dari `/api/voice` sebelum meminta file, dan pemeriksaan konsol Boss Voice lulus. Kode fallback tetap diuji dengan manifest rekaman kosong.

## 4. Roadmap pelaksanaan

| Tahap | Pekerjaan | Kriteria keluar |
| --- | --- | --- |
| **P0 · Stabilkan kandidat rilis** | Tetapkan snapshot v0.41.0. Selaraskan README, `CLAUDE.md`, deskripsi paket, Update Log, dan jejak rilis. Perbarui smoke yang mengasumsikan menu judul saat boot dan Peta Sumpah skema 2. | Tes Node hijau. Browser fresh-profile membuktikan trailer dapat masuk/keluar menuju menu. Peta Sumpah membuktikan elite, AUTO-SEIMBANG, bertahan, rantai, kode lama dan baru, serta reload. Ketiga mode suara diuji dengan manifest kosong dan fixture rekaman. |
| **P1 · Percepat startup dan perpindahan mode** | Ekstrak versi, lazy-load Update Log, lalu migrasikan satu mode lengkap sekaligus, dimulai dari Peta Sumpah dan dilanjutkan mode arena serta 3D/horror. Muat CSS dan katalog bersama modul pemiliknya. | Sasaran startup iterasi pertama tercapai. Masuk pertama, masuk ulang, tombol Back, dan kegagalan muat aset punya alur yang jelas. Menu kampanye dan smoke `window.__ashen` lolos setiap migrasi. |
| **P2 · Optimasi gameplay dan perangkat rendah** | Ukur kampanye, Cistern/Lanternwake, Infinitower, Riftwar, Pirate Tide, Godfall, dan horror 2D/3D. Optimalkan dua sumber biaya terbesar per skenario. Terapkan kandidat Peta Sumpah dan ukur biaya drag/DOM secara terpisah. | Peningkatan p95 atau alokasi bisa diulang pada baseline sebanding. Input, hitbox, damage, AI, rekor, dan tempo simulasi lolos replay dan smoke. |
| **P3 · Aset, audio, save, dan layanan** | Lazy-load GLB dan bank suara. Batasi memori dengan batas byte, hentikan audio lama saat pindah mode, dan gunakan migrator serta sanitizer yang sudah ada untuk tiga slot dan cadangan. Ukur cache server dan relay di bawah beban yang ditetapkan. | Soak 30 menit, putar ulang audio offline, save lama dan kode berbagi dapat dimuat, ekspor/impor satu profil tetap terisolasi, pemulihan dari kegagalan penulisan teruji, dan sesi 4 pemain lolos. |
| **P4 · Konten tertunda** | Rilis Frontiers 101–150, 151–200, lalu Overdrive 201–300 menurut ledger 3.0. Pindahkan pola AI baru ke potongan konten yang dapat dimainkan dan pisahkan pola Orsella dari Vasska. | 200 ruang baru bisa dimasuki melalui jalur normal. ID lama dan save tetap kompatibel. Setiap gelombang konten lolos anggaran startup dan frame. |
| **P5 · Arc dan mode menuju v1.0** | Lanjutkan Rift, Unwritten Expanse dan arc lanjutan, kemudian finale. Kelompokkan mode dalam hub dengan sasaran maksimal delapan pintu utama. Selaraskan kontrol, subtitle, opsi Anti-Jumpscare, aksesibilitas dan bahasa. Ambil ekspansi mode tambahan dari rencana 3.0 sesuai anggaran. | Perjalanan kampanye ke ending bisa ditamatkan. Smoke lintas mode hijau, target performa profil rilis tercapai, dan uji save lengkap dilakukan. |

Nomor patch berikutnya diputuskan setelah snapshot v0.41.0 dibakukan. Nomor v0.37–0.41 sudah muncul di riwayat game. Fase memakai nama dan kriteria keluar agar pekerjaan fondasi dapat dipindah ke versi berikutnya tanpa bentrok dengan versi yang sudah dipakai.

## 5. Urutan kerja dan verifikasi

### P0 · Dua perubahan pertama

1. **Snapshot rilis dan dokumentasi** — catat `HEAD`, inventaris file Git, hash snapshot, manifest aset, dan hasil `npm test`. Tambahkan keterangan Update XXXI ke README dan `CLAUDE.md`, dan cocokkan deskripsi paket. Perkuat pemeriksaan yang sudah ada di `tests/docs.test.js` dan `tests/updates.test.js` agar entri terbaru cocok dengan versi serta fitur aktual.
2. **Smoke untuk v0.41.0** — jadikan alur trailer profil kosong skenario eksplisit. Setelah itu buka menu melalui tombol yang tersedia. Saat `assets/voice/trailer/ident.mp3` belum dipaketkan, pilih fallback trailer tanpa request ke file yang tidak ada. Perbarui `tools/editor-smoke.mjs` untuk skema 3 dan uji waktu bertahan, elite, takaran, AUTO-SEIMBANG, kompatibilitas kode v0.40, dan persistensi pada viewport desktop serta ponsel. Pastikan pesan harness membedakan gagal meluncurkan browser, gagal boot aplikasi, dan gagal assertion fitur.

### P1 · Startup tanpa memutus jalur masuk

3. **Update Log sebagai uji pertama** — pindahkan `GAME_VERSION` ke modul ringan dan ekspor ulang dari `src/updates.js` untuk pembaca yang ada. Impor riwayat saat panel pertama dibuka. Tampilkan status memuat dan tindakan coba lagi, serta pastikan callback lama tidak mengganti panel jika pemain sudah berpindah. Ukur startup dingin dan waktu klik pertama sebelum serta sesudah.
4. **Peta Sumpah sebagai mode percontohan** — pindahkan siklus masuk, bermain, keluar, dan stylesheet dalam satu irisan. Pertahankan sanitizer dan jalur `AVME1.`. Pastikan preview, klik pointer, room-chain, checkpoint, kemenangan buatan, serta debug hooks berfungsi sebelum memigrasikan mode berikutnya.
5. **Katalog dan shell** — gunakan kebutuhan jalur startup untuk memutus impor inti yang menarik data banyak mode. Fokuskan ukuran `main.js` dengan memindahkan tanggung jawab per layar. Uji menu, pengaturan, input, hotkey, reset, dan akses langsung dari save lama pada setiap pemindahan.

`npm run bench:startup` membandingkan server sumber dan build rilis di Chrome 1280×900 dengan tujuh navigasi per kondisi cache. Pada sesi ini, median bootstrap dengan cache browser dingin turun dari **303 ms ke 232 ms**. Median dengan cache hangat turun dari **202 ms ke 165 ms**. Pemeriksaan browser rilis mengunci sasaran pengurangan 25% dan satu stylesheet lokal lewat `ASHEN_RELEASE_EXPECTED=1`. Uji rilis juga mencakup gagal muat dan coba lagi pada Update Log serta 61 pemeriksaan Peta Sumpah.

### P2–P3 · Sesuaikan perbaikan dengan biaya yang diukur

6. **Canvas dan HUD** — periksa waktu tiap layer, overdraw, dan biaya layout. Uji culling, cache gradien berulang, atau pembaruan HUD berbasis perubahan data sesuai hotspot. Pada Peta Sumpah, uji penggabungan `pointermove` sampai satu repaint per frame dan pembaruan parsial DOM jika profil menunjukkan manfaat. Uji drag yang keluar dari canvas dan pelepasan pointer.
7. **Simulasi dan AI** — pertahankan fixed step 120 Hz. Bandingkan collision, pencarian target, alokasi proyektil, dan gelombang akhir. Gunakan broadphase, pengelompokan update AI, atau pooling hanya untuk biaya yang terlihat. Lakukan A/B dengan input dan seed sama, termasuk guard agar tidak ada bounty ganda dan event completion hilang.
8. **WebGL dan paket aset** — profil CPU, draw calls, penggunaan buffer, shader, dan upload GLB sebelum memilih LOD atau kuantisasi. Pastikan aset yang dimuat saat masuk mode dapat dilepas setelah keluar. Validasi sampel visual serta animasi dan collision per model yang berubah.
9. **Save, server, dan suara** — inventaris kunci aktif dan pisahkan preferensi global dari progres mode. Tambahkan fixture save lama sebelum mengubah susunan atau frekuensi penulisan. Ukur latensi dan memori cache aset/voice sesudah cold boot serta saat co-op ramai, lalu pilih cache berbatas byte, deduplikasi request, atau kompresi di luar request hanya sesuai hasil profil. Uji audio lokal/offline sebelum pengujian layanan berbayar.

Pakai skenario padat untuk menemukan hotspot dan skenario pendek untuk menjaga cakupan mode. Bandingkan arena akhir Riftwar, Godfall, dan Infinitower dengan perpindahan zona Labyrinth, interior Cistern, serta pelayaran Pirate Tide. Tambahkan run 2×–4× Speedrun untuk simulasi, scroll pada Archive/Index untuk DOM, dan siklus masuk-keluar Fishing, Trials, Puzzle, Panggung Abadi, serta Infinite Realms untuk memori dan pembersihan sumber daya.

**Eksperimen Cistern yang dibatalkan.** Penggabungan stroke latar ruang 663 mengurangi panggilan dari 22 ke 3, tetapi median A/B satu browser naik dari 12,91 ke 13,26 ms dan 616 piksel berubah. Culling dengan margin memberi hasil piksel identik dan 19 stroke, tetapi median naik dari 11,37 ke 11,72 ms. Implementasi renderer semula dipakai kembali. `npm run probe:render` sekarang melaporkan jumlah stroke dan hash frame sampel.

**Profil awal arena.** Chrome headless 1280×900 pada skenario gelombang akhir mencatat p95 interval 7,0 ms di Wave Defense Endless dan 7,1 ms di Infinitower. Biaya canvas dengan readback masing-masing 11,36 ms dan 13,11 ms. Hasil sesi tunggal ini menjadi titik awal untuk pengukuran berulang dan perangkat fisik.

**Simulasi Wave Defense dan Riftwar.** Menara Wave Defense menghitung statistik tembakan lengkap setelah menemukan target. Indikator jangkauan memakai rumus jangkauan yang sama. Pada 12 pasangan pengukuran dengan 24 menara dan 120 musuh, median p95 waktu update turun **0,0589 → 0,0430 ms** pada gelombang campuran dan **0,0562 → 0,0358 ms** saat seluruh target di luar jangkauan. Replay 1.800 langkah per mode membandingkan state dan rekor Campaign, Endless, dan Infinitower.

Minion Riftwar mencari target tanpa membentuk daftar kandidat dan melewati hitung jarak diagonal jika salah satu sumbu sudah melampaui batas. Pada delapan pasangan pengukuran di sekitar gelombang 4, median p95 update turun **0,8732 → 0,7127 ms**. Replay dengan input dan seed yang sama menghasilkan state identik pada ketiga peta selama 7.200 langkah per peta. Kedua angka p95 mengukur waktu simulasi di Node, sedangkan interval frame browser dicatat terpisah.

**Profil build rilis lintas mode.** `npm run profile:frames` sekarang mencakup 13 skenario dan memisahkan sela frame di atas 50 ms dari Long Animation Frames Chrome. Horror 3D menunggu WebGL siap sebelum pengukuran. Pengambilan data piksel dilakukan setelah seluruh sampel interval frame dan profil CPU, karena pembacaan piksel berulang dapat mengubah cara Chrome merender canvas yang dipakai kembali oleh mode berikutnya.

Pada satu sesi Chrome headless 1280×900 dengan RTX 3050 Laptop, seluruh 13 skenario mencatat p95 interval frame **≤7,1 ms** dari sampel 2,6 detik per skenario. Angka ini mencakup Pirate Endless pada surge 22 dan Saint Orra fase pertama setelah WebGL siap. Hasil ini menjadi baseline desktop untuk pengukuran berulang di perangkat kelas rendah.

## 6. Gerbang integrasi dan batas rilis

- Jalankan `npm test`, smoke mode yang berubah, dan skenario fresh boot untuk setiap perubahan startup. Jalankan `smoke:editor`, `smoke:bossvoice`, serta smoke Infinitower pada kandidat v0.41.0. Catat hasil aktual dan kondisi peluncuran browser.
- Gunakan replay dan fixture save untuk mengunci perilaku yang dipertahankan. ID kampanye **0–673** tetap stabil. Konfirmasi blok Frontiers dan Overdrive dari ledger sebelum menambah ruang. Save Peta Sumpah skema 1/2 dan kode berbagi skema 2 masuk sebagai fixture regresi.
- Sebelum setiap penggabungan optimasi, lampirkan pengukuran sebelum/sesudah, skenario yang diperbaiki, dan dampak pada startup atau mode lain. Bagi perubahan agar dapat dibalik sendiri-sendiri. Dokumentasikan hasil yang gagal membaik, termasuk eksperimen tile cache lama sampai ada bukti baru.
- Jika jadwal menyempit, tunda ekspansi mode tambahan, pengurangan ukuran GLB lanjutan, dan cloud save. Pertahankan verifikasi jalur masuk, kompatibilitas save, baseline performa, dan pengujian rilis.

## Sumber audit dalam repositori

`MASTERPLAN.md` 3.0 dan `docs/archive/MASTERPLAN-2.0.md` untuk rancangan dan ledger · `package.json`, `src/updates.js`, `README.md`, `CLAUDE.md` untuk versi · `src/core.js`, `src/mapeditor.js`, `src/boss_voice.js`, `assets/voice/manifest.json`, `docs/asset-inventory.md` untuk isi aktual · `index.html`, `src/main.js`, `server.js`, `tests/`, dan `tools/` untuk jalur masuk dan verifikasi.
