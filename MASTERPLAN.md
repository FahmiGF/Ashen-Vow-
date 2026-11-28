# Ashen Vow — Masterplan 4.0

**28 November 2026 · Baseline audit v0.41.0 · Status tree saat ini v0.45.0 · Roadmap menuju v1.0**

> Rencana sebelumnya diarsipkan utuh di [`docs/archive/MASTERPLAN-3.0.md`](docs/archive/MASTERPLAN-3.0.md) (Master Plan 3.0) dan [`docs/archive/MASTERPLAN-2.0.md`](docs/archive/MASTERPLAN-2.0.md) (Master Plan 2.0).

Prioritas rilis berikutnya adalah mengamankan snapshot kerja, memulihkan verifikasi browser, lalu mempercepat jalur dari startup ke permainan. Optimasi berjalan per mode dengan pengukuran sebelum dan sesudah. Roadmap konten dari `MASTERPLAN.md` 3.0 tetap menjadi rujukan untuk desain, roster, dan alokasi ruang, dengan urutan rilis yang diperbarui di bawah.

## 1. Snapshot yang diaudit

| Aspek | Kondisi audit awal (v0.41.0) | Status aktual tree saat ini (`v0.42.0`) |
| --- | --- | --- |
| Branch dan commit lokal | `feat/boss-voice` di `ba27daf`, sama dengan ref pelacak lokal `origin/feat/boss-voice`. Commit ini satu commit di depan `release/v0.36.0`. | Branch `feat/boss-voice` dirapikan menjadi commit berurut ketergantungan; versi aktif **v0.42.0**. |
| Staging Git | **Kosong**. `git diff-index --cached --quiet HEAD` mengembalikan `0`. | Pekerjaan lokal terpisah per mode dan perubahan fondasi P0–P1. |
| Perubahan lokal awal | **21 file terlacak berubah** dan **5 file belum terlacak**, yaitu `src/mapeditor.js`, `styles-mapeditor.css`, `tests/mapeditor.test.js`, `tools/editor-smoke.mjs`, dan `tools/bake-trailer-voice.mjs`. | Ditambah Peta Kisah (`src/storymap.js`, `src/storymap_ui.js`), Frontiers (`src/frontiers.js`, `styles-frontiers.css`), versi & lazy-loader (`src/version.js`, `src/mapeditor_ui.js`), serta probe startup (`tools/boot-probe.mjs`, `tests/startup.test.js`). |
| Versi yang dijalankan | `package.json`, judul HTML, dan `GAME_VERSION` menunjuk v0.41.0. Update Log sudah memuat Update XXXI. Judul teratas README dan entri penjelasan terbaru di `CLAUDE.md` masih v0.40.0. `MASTERPLAN.md` 3.0 juga memakai nomor v0.37–0.41 untuk pekerjaan lama yang sebagian masih terbuka. | `src/version.js`, `src/updates.js`, `package.json`, `README.md`, `CLAUDE.md`, `MASTERPLAN.md`, dan `index.html` selaras pada **v0.45.0** (Update XXXV). |
| Konten yang ada | **674 ruang kampanye, 116 bos, 262 tipe musuh, 18 kelas kampanye**. Peta Sumpah mempunyai kanvas medan, rantai maksimal enam ruang, enam takaran, elite, objektif bertahan, dan AUTO-SEIMBANG. | **931 ruang (`ALL_ROOMS`), 146 bos (`ALL_BOSS_INFO`), 380 tipe musuh (`ALL_ENEMY_INFO`), 18 kelas kampanye**. Frontiers 101–200 (674–773), Overdrive 201–300 (774–873), Arc IV: The Rift (874–900), dan **The Unwritten Expanse (901–930)** kini playable. |
| Kompatibilitas Peta Sumpah | Save memakai `ashen-vow-mapeditor-v1` skema 3. Prefix kode berbagi tetap `AVME1.`. Decoder menerima payload skema 2 dari v0.40.0. | Tetap kompatibel pada skema 3, kode `AVME1.` skema 2 & 3, plus **Peta Kisah** (15 saga). |
| Suara bos | Katalog mencakup **613 baris dari 116 bos**, dengan 454 baris bos dan 159 baris pemain. Manifest checkout berisi **0 rekaman terdaftar**. Mode default dapat memakai sting sinematik. Suara AI ber-FX bergantung pada konfigurasi dan pilihan pemain. | Katalog diperbarui menjadi **146 bos** di [`docs/voice-script.md`](docs/voice-script.md); manifest checkout tetap **0 rekaman terdaftar**. |
| Jalur yang masih terbuka | Spesifikasi Frontiers 101–200 dan Overdrive 201–300 ada, dengan ruang yang belum masuk `ALL_ROOMS`. Arc IV The Rift dan Unwritten Expanse masih menunggu realisasi. | Frontiers, Overdrive, Arc IV The Rift, dan Unwritten Expanse sudah masuk `ALL_ROOMS` (674–930). Arc V The Ashfall Accord dan Phase 3 AI/bos unik menunggu realisasi (lihat [`docs/prd/phase-4-through-the-rift.md`](docs/prd/phase-4-through-the-rift.md)). |

Pisahkan snapshot lokal menjadi perubahan Infinitower dan Spiral Choir, fondasi dan perluasan Peta Sumpah, serta dokumentasi rilis. Susun berdasarkan ketergantungan dan periksa perpotongan perubahan di `src/main.js`, `src/core.js`, `index.html`, dan `src/updates.js` sebelum menentukan commit rilis.

## 2. Baseline dan sasaran optimasi

| Area | Baseline saat audit | Sasaran awal | Cara memeriksa |
| --- | --- | --- | --- |
| Startup JavaScript | Graf impor statis `src/main.js` mencapai **69 modul**, **3.792.663 byte mentah** dan sekitar **1.012.168 byte gzip**, dihitung per modul (`boot-probe` v0.42.0 sebelum P1: **71 modul**, **3.876.938 byte mentah**). `main.js` berisi **20.788 baris**, **60 deklarasi impor statis**, dan **0 `import()`**. | Kurangi byte mentah startup ≥25% pada iterasi pertama. Sasaran tahap fondasi ≤900 KB mentah sebelum menu interaktif. | Ambil startup cold/warm memakai Chrome. Laporkan byte mentah, byte transfer, p50/p95 waktu ke menu, dan waktu muat pertama setiap mode. |
| CSS startup | **16 stylesheet lokal** di `index.html` saat audit (**17** di v0.42.0 dengan `styles-frontiers.css`), dengan **351.419 byte mentah** (**360.881 byte** di v0.42.0), ditambah stylesheet font eksternal. | Satu stylesheet lokal yang memblokir menu setelah CSS mode dimuat saat dibutuhkan. | Periksa daftar request, menu pertama, transisi, dan pergantian orientasi. |
| Update Log | `src/updates.js` **136.296 byte mentah**, sekitar **49.962 byte gzip**. Modul masuk graf startup menu dan diimpor server untuk membaca versi. | Pindahkan data riwayat keluar jalur startup. Versi game tetap tersedia sinkron (`src/version.js`). | Startup tidak meminta modul riwayat. Klik atau tombol pintas membuka riwayat lengkap, dan versi server, judul HTML, serta log tetap cocok. |
| Frame 2D | Satu profil Chrome headless 1280×900 di salinan menghasilkan p95 interval **13,4 ms** di menu dan **13,8 ms** di kampanye (ruang 3) serta Wave Defense Endless (gelombang 26). Biaya canvas dengan readback **19,09 ms** di kampanye dan **16,34 ms** di Endless. Sampel 2,6 detik per skenario ini bersifat indikatif. | p95 interval frame ≤16,7 ms untuk sasaran 60 FPS desktop, ≤33,3 ms untuk sasaran 30 FPS perangkat rendah. | `profile:frames`, `probe:render`, dan rekaman LoAF. Laporkan waktu render, interval aktual, p99, dan frame >50 ms secara terpisah. |
| Simulasi | `bench:sim` awal memakai ruangan 7, 10 musuh, 160 proyektil, dan 220 efek. Compaction saat ini **6.919 langkah/detik** dan pembanding `filter` **7.289** pada satu percobaan. | Tetapkan ambang dari beberapa ulangan berpasangan. Tambahkan skenario 40 musuh, dan terima perubahan jika p95 biaya step atau alokasi membaik dengan hasil simulasi yang sama. | `bench:sim`, `bench:wavedefense`, `bench:pirates`, `bench:court`, plus replay dengan seed dan input tetap. |
| 3D dan aset | Inventaris menyebut **16 GLB**, sekitar **4,71 MiB** dan **58.802 segitiga**. | Muat model per mode, lalu uji sasaran aset total ≤3,5 MiB. Pertahankan animasi, collision, dan keterbacaan siluet. | `bench:3d`, `assets:inventory`, uji 3D/Blackveil, dan jejak memori saat mode ditutup. |
| Peta Sumpah | Patch kandidat mempercepat kalkulasi meter dan AUTO-SEIMBANG pada benchmark Node. Lihat §3. | Dukungan input lama, hasil penyeimbangan yang konsisten, dan jalur UI cepat dengan 20 peta berisi roster penuh. | Suite Map Editor, fixture skema 1–3, uji drag/auto-balance di desktop dan 390×844, serta pengukuran waktu interaksi. |
| Save dan memori | Penyimpanan tersebar di `src/main.js` dan modul. Soak 30 menit belum diukur. | Stabilkan heap setelah pemanasan. Sasaran awal ≤10% pertumbuhan heap pasca-GC pada profil yang sama dan nol canvas lepas yang tertahan. | Ulangi masuk-keluar mode selama 30 menit. Catat listener, timer, RAF, `AudioNode`, dan heap sebelum/sesudah siklus. |
| Co-op, suara, dan server | Tes relay ada. Bandwidth 4 pemain, beban cold-cache, dan waktu decode audio belum diukur pada audit. | Co-op 4 pemain pada 20 Hz dengan sasaran ≤40 KB/detik per klien. Kurangi kompresi, request, dan decode yang berulang setelah diprofilkan. | Beban lokal dengan fixture 4 pemain, HTTP cold/warm, reconnect dan migrasi host, serta metrik audio offline dan saat layanan eksternal lambat. |

Gunakan tiga profil bernama dengan spesifikasi tercatat. Jalankan desktop, browser pada viewport ponsel potret, dan setidaknya satu ponsel fisik untuk menilai GPU, audio, dan termal. Ukur waktu sampai bootstrap siap secara terpisah dari waktu sampai menu bisa dipakai setelah trailer dilewati. Sasaran cold boot lokal untuk jalur menu adalah ≤1,2 detik di desktop dan ≤2,5 detik pada profil perangkat rendah. Tetapkan ambang otomatis setelah variasi antar-run diketahui. Simpan build, versi browser, resolusi, DPR, preset, seed, pemanasan, durasi, serta p50/p95/p99 untuk setiap hasil yang dibandingkan.

## 3. Optimasi pertama yang diukur

Kandidat `src/mapeditor.js` memakai satu sanitasi untuk satu kalkulasi meter. AUTO-SEIMBANG menghitung rasio setiap iterasi, lalu menyusun pita dan saran sekali setelah penyeimbangan selesai. Hasil API diuji terhadap implementasi awal pada empat fungsi publik dengan 645 input, termasuk keenam takaran, musuh elite, bos, objektif bertahan, roster besar, dan masukan rusak.

| Kalkulasi (audit salinan awal) | Sebelum | Kandidat | Percepatan |
| --- | --- | --- | --- |
| Meter tekanan (`threatRating`) | 12,896 ms | 7,349 ms | **1,75×** |
| AUTO-SEIMBANG (`autoBalanceBlueprint`) | 197,233 ms | 21,581 ms | **9,14×** |

Angka di atas adalah median dari 15 ulangan berpasangan, masing-masing memakai 640 peta uji pada Node v24.22.0. Durasi mengukur kalkulasi murni. Jalur UI menyertakan biaya tambahan berupa pekerjaan DOM dan canvas.

Verifikasi penerapan langsung pada repo (`src/mapeditor.js`, median 15 ulangan berpasangan × 640 peta, Node lokal) menghasilkan:
- `threatRating`: **4,874 ms → 4,432 ms** (**1,10×**)
- `autoBalanceBlueprint`: **42,241 ms → 7,728 ms** (**5,47×**)
- Kesesuaian output penuh (`threatRating`, `playerPower`, `enemyLoad`, `autoBalanceBlueprint`): **646/646 identik tepat**.

Smoke editor Chrome desktop lulus **76/76** (termasuk alur trailer, skema 3, kode v0.40 `AVME1.`, viewport `390×844`, takaran, elite, bertahan, dan `AUTO-SEIMBANG`). Kegagalan HTTP 404 pada `assets/voice/trailer/ident.mp3` saat trailer boot tanpa rekaman terpaket telah diperbaiki lewat manifest `/api/voice` (`trailerBaked`) sehingga `http404Count = 0`.

## 4. Roadmap pelaksanaan

| Tahap | Pekerjaan | Kriteria keluar |
| --- | --- | --- |
| **P0 · Stabilkan kandidat rilis** | Tetapkan snapshot kerja dan selaraskan README, `CLAUDE.md`, deskripsi paket, Update Log, dan jejak rilis. Perbarui smoke yang mengasumsikan menu judul saat boot dan Peta Sumpah skema 2. | Tes Node hijau. Browser fresh-profile membuktikan trailer dapat masuk/keluar menuju menu. Peta Sumpah membuktikan elite, AUTO-SEIMBANG, bertahan, rantai, kode lama dan baru, serta reload. Ketiga mode suara diuji dengan manifest kosong dan fixture rekaman. |
| **P1 · Percepat startup dan perpindahan mode** | Ekstrak versi (`src/version.js`), lazy-load Update Log, lalu migrasikan satu mode lengkap sekaligus, dimulai dari Peta Sumpah (`src/mapeditor_ui.js` + `styles-mapeditor.css`) dan Peta Kisah (`src/storymap_ui.js`), dilanjutkan mode arena serta 3D/horror. Muat CSS dan katalog bersama modul pemiliknya. | Sasaran startup tercapai (Update Log & Peta Sumpah + Peta Kisah sebagai irisan percontohan pertama; mode tersisa dimigrasikan pada irisan lanjutan sampai ≤900 KB). Masuk pertama, masuk ulang, tombol Back, dan kegagalan muat aset punya alur yang jelas. Menu kampanye dan smoke `window.__ashen` lolos setiap migrasi. |
| **P2 · Optimasi gameplay dan perangkat rendah** | Ukur kampanye, Cistern/Lanternwake, Infinitower, Riftwar, Pirate Tide, Godfall, dan horror 2D/3D. Optimalkan dua sumber biaya terbesar per skenario. Ukur biaya drag/DOM Peta Sumpah secara terpisah. | Peningkatan p95 atau alokasi bisa diulang pada baseline sebanding. Input, hitbox, damage, AI, rekor, dan tempo simulasi lolos replay dan smoke. |
| **P3 · Aset, audio, save, dan layanan** | Lazy-load GLB dan bank suara. Batasi memori dengan batas byte, hentikan audio lama saat pindah mode, dan gunakan migrator serta sanitizer yang sudah ada untuk tiga slot dan cadangan. Ukur cache server dan relay di bawah beban yang ditetapkan. | Soak 30 menit, putar ulang audio offline, save lama dan kode berbagi dapat dimuat, ekspor/impor satu profil tetap terisolasi, pemulihan dari kegagalan penulisan teruji, dan sesi 4 pemain lolos. |
| **P4 · Konten tertunda** | Frontiers 101–200 (**v0.42.0**) dan Overdrive 201–300 (**v0.43.0**) selesai. Selanjutnya pisahkan mesin AI unik per bos (Orsella, Vasska, dll.) dan perluasan ekspansi. | 200 ruang Frontiers & Overdrive live (`674–873`), save kompatibel, dan fase Living Ash (AI & bos unik) siap dimulai. |
| **P5 · Arc dan mode menuju v1.0** | Lanjutkan Rift, Unwritten Expanse dan arc lanjutan, kemudian finale. Kelompokkan mode dalam hub dengan sasaran maksimal delapan pintu utama. Selaraskan kontrol, subtitle, opsi Anti-Jumpscare, aksesibilitas dan bahasa. Ambil ekspansi mode tambahan dari rencana 3.0 sesuai anggaran. | Perjalanan kampanye ke ending bisa ditamatkan. Smoke lintas mode hijau, target performa profil rilis tercapai, dan uji save lengkap dilakukan. |

Nomor patch berikutnya melanjutkan setelah **v0.42.0**. Nomor v0.37–0.42 sudah muncul di riwayat game. Fase memakai nama dan kriteria keluar agar pekerjaan fondasi dapat dipindah ke versi berikutnya tanpa bentrok dengan versi yang sudah dipakai.

## 5. Urutan kerja dan verifikasi

### P0 · Dua perubahan pertama

1. **Snapshot rilis dan dokumentasi** — catat `HEAD`, inventaris file Git, hash snapshot, manifest aset, dan hasil `npm test`. Selaraskan README, `CLAUDE.md`, deskripsi paket, `MASTERPLAN.md`, dan perkuat pemeriksaan di `tests/docs.test.js` dan `tests/updates.test.js`.
2. **Smoke untuk snapshot rilis** — jadikan alur trailer profil kosong skenario eksplisit. Setelah itu buka menu melalui tombol yang tersedia. Saat `assets/voice/trailer/ident.mp3` belum dipaketkan, pilih fallback trailer tanpa request ke file yang tidak ada. Perbarui `tools/editor-smoke.mjs` untuk skema 3 dan uji waktu bertahan, elite, takaran, AUTO-SEIMBANG, kompatibilitas kode v0.40, dan persistensi pada viewport desktop serta ponsel. Pastikan pesan harness membedakan gagal meluncurkan browser, gagal boot aplikasi, dan gagal assertion fitur.

### P1 · Startup tanpa memutus jalur masuk

3. **Update Log sebagai uji pertama** — pindahkan `GAME_VERSION` ke modul ringan (`src/version.js`) dan ekspor ulang dari `src/updates.js` untuk pembaca yang ada. Impor riwayat saat panel pertama dibuka. Tampilkan status memuat dan tindakan coba lagi, serta pastikan callback lama tidak mengganti panel jika pemain sudah berpindah. Ukur startup dingin dan waktu klik pertama sebelum serta sesudah.
4. **Peta Sumpah sebagai mode percontohan** — pindahkan siklus masuk, bermain, keluar, dan stylesheet (`src/mapeditor_ui.js`, `styles-mapeditor.css`) dalam satu irisan (disertai Peta Kisah di `src/storymap_ui.js`). Pertahankan sanitizer dan jalur `AVME1.`. Pastikan preview, klik pointer, room-chain, checkpoint, kemenangan buatan, serta debug hooks berfungsi sebelum memigrasikan mode berikutnya.
5. **Katalog dan shell** — gunakan kebutuhan jalur startup untuk memutus impor inti yang menarik data banyak mode (Frontier, Echoes, Godfall, Codex/Archive, mode arena & 3D). Fokuskan ukuran `main.js` dengan memindahkan tanggung jawab per layar. Uji menu, pengaturan, input, hotkey, reset, dan akses langsung dari save lama pada setiap pemindahan.

### P2–P3 · Sesuaikan perbaikan dengan biaya yang diukur

6. **Canvas dan HUD** — periksa waktu tiap layer, overdraw, dan biaya layout. Uji culling, cache gradien berulang, atau pembaruan HUD berbasis perubahan data sesuai hotspot. Pada Peta Sumpah, uji penggabungan `pointermove` sampai satu repaint per frame dan pembaruan parsial DOM jika profil menunjukkan manfaat. Uji drag yang keluar dari canvas dan pelepasan pointer.
7. **Simulasi dan AI** — pertahankan fixed step 120 Hz. Bandingkan collision, pencarian target, alokasi proyektil, dan gelombang akhir. Gunakan broadphase, pengelompokan update AI, atau pooling hanya untuk biaya yang terlihat. Lakukan A/B dengan input dan seed sama, termasuk guard agar tidak ada bounty ganda dan event completion hilang.
8. **WebGL dan paket aset** — profil CPU, draw calls, penggunaan buffer, shader, dan upload GLB sebelum memilih LOD atau kuantisasi. Pastikan aset yang dimuat saat masuk mode dapat dilepas setelah keluar. Validasi sampel visual serta animasi dan collision per model yang berubah.
9. **Save, server, dan suara** — inventaris kunci aktif dan pisahkan preferensi global dari progres mode. Tambahkan fixture save lama sebelum mengubah susunan atau frekuensi penulisan. Ukur latensi dan memori cache aset/voice sesudah cold boot serta saat co-op ramai, lalu pilih cache berbatas byte, deduplikasi request, atau kompresi di luar request hanya sesuai hasil profil. Uji audio lokal/offline sebelum pengujian layanan berbayar.

Pakai skenario padat untuk menemukan hotspot dan skenario pendek untuk menjaga cakupan mode. Bandingkan arena akhir Riftwar, Godfall, dan Infinitower dengan perpindahan zona Labyrinth, interior Cistern, serta pelayaran Pirate Tide. Tambahkan run 2×–4× Speedrun untuk simulasi, scroll pada Archive/Index untuk DOM, dan siklus masuk-keluar Fishing, Trials, Puzzle, Panggung Abadi, serta Infinite Realms untuk memori dan pembersihan sumber daya.

## 6. Gerbang integrasi dan batas rilis

- Jalankan `npm test`, smoke mode yang berubah, dan skenario fresh boot untuk setiap perubahan startup. Jalankan `smoke:editor`, `smoke:bossvoice`, serta smoke Infinitower pada kandidat rilis. Catat hasil aktual dan kondisi peluncuran browser.
- Gunakan replay dan fixture save untuk mengunci perilaku yang dipertahankan. ID kampanye **0–673** (serta Frontiers **674–773**) tetap stabil. Konfirmasi blok Overdrive dari ledger sebelum menambah ruang. Save Peta Sumpah skema 1/2 dan kode berbagi skema 2 masuk sebagai fixture regresi.
- Sebelum setiap penggabungan optimasi, lampirkan pengukuran sebelum/sesudah, skenario yang diperbaiki, dan dampak pada startup atau mode lain. Bagi perubahan agar dapat dibalik sendiri-sendiri. Dokumentasikan hasil yang gagal membaik, termasuk eksperimen tile cache lama sampai ada bukti baru.
- Jika jadwal menyempit, tunda ekspansi mode tambahan, pengurangan ukuran GLB lanjutan, dan cloud save. Pertahankan verifikasi jalur masuk, kompatibilitas save, baseline performa, dan pengujian rilis.

## 7. Hasil eksekusi awal P0–P1 (27 November 2026)

Pengukuran dilakukan di Windows 11 (`Chrome/158.0.8127.37` headless, SwiftShader, viewport `1280×900`, `RUNS=3`, cold cache disabled) melalui [`tools/boot-probe.mjs`](tools/boot-probe.mjs):

| Metrik startup (`v0.42.0`) | Sebelum P1 | Sesudah irisan P1 #1 | Perubahan |
| --- | --- | --- | --- |
| Modul JS saat boot (`bootJsModules`) | 71 | 69 | −2 modul (Update Log + Peta Sumpah + Peta Kisah keluar jalur boot; `+src/version.js`) |
| Byte mentah JS boot (`bootJsRawBytes`) | 3.876.938 B | 3.639.325 B | **−237.613 B (−6,13%)** |
| Byte transfer JS boot (`bootJsTransferBytes`) | 1.057.447 B | 978.021 B | **−79.426 B (−7,51%)** |
| Stylesheet saat boot (`bootCssCount`) | 17 (360.881 B) | 16 (350.091 B) | **−10.790 B** (`styles-mapeditor.css` dimuat on-demand) |
| HTTP 404 saat fresh boot (`ident.mp3`) | 6 (2 per run) | **0** | Selesai via `/api/voice` `trailerBaked` |
| Buka Update Log pertama (`p50` / `p95`) | 8,9 ms / 18,3 ms | 49,8 ms / 110,3 ms | Lazy-load on-demand pertama + guard `updates-loading` / `COBA LAGI` |
| Buka Peta Sumpah pertama (`p50` / `p95`) | 20,3 ms / 21,2 ms | 60,2 ms / 72,9 ms | Lazy-load modul + CSS; `editorReopenOk: true`, `staleGuardOk: true` |

Catatan jujur: irisan P1 pertama memvalidasi pola ekstraksi (`src/version.js`, Update Log, Peta Sumpah, dan Peta Kisah) serta menurunkan startup JS sebesar **6,13%**. Target iterasi penuh (≥25% dan ≤900 KB) dilanjutkan pada langkah §5.5 (katalog & mode arena/3D) agar setiap mode lain menyusul dengan batas uji yang tetap hijau (`npm test` **841/841**).

## Sumber audit dalam repositori

`docs/archive/MASTERPLAN-3.0.md` dan `docs/archive/MASTERPLAN-2.0.md` untuk rancangan dan ledger · `package.json`, `src/version.js`, `src/updates.js`, `README.md`, `CLAUDE.md` untuk versi · `src/core.js`, `src/mapeditor.js`, `src/storymap.js`, `src/frontiers.js`, `src/boss_voice.js`, `assets/voice/manifest.json`, `docs/asset-inventory.md` untuk isi aktual · `index.html`, `src/main.js`, `src/mapeditor_ui.js`, `src/storymap_ui.js`, `server.js`, `tests/`, dan `tools/` untuk jalur masuk dan verifikasi.
