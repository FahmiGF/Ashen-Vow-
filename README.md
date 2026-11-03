# Ashen Vow — v0.0.5

> **Sumpah di antara abu.** Simulasi metroidvania medieval 2D dengan combat pedang real-time, relik lompat ganda, dan **dua boss yang masing-masing punya dua fase**.

Ashen Vow adalah game web tanpa build step: HTML5 Canvas + ES Modules murni. Seluruh simulasi combat berjalan deterministik di `src/core.js`, sehingga bisa diuji otomatis dengan Node tanpa browser.

![Menu utama Ashen Vow](docs/menu.png)

## Cara menjalankan

```bash
npm start
```

Buka <http://127.0.0.1:4300>.

Tidak perlu `npm install` — tidak ada dependensi runtime.

## Alur menu

Game **tidak langsung masuk ke gameplay**. Saat dibuka, yang tampil adalah menu utama:

- **MULAI PERJALANAN** — memulai run baru dari Gerbang Abu.
- **PILIH LEVEL** — melihat 4 ruang, status terkunci/terbuka/tuntas, dan progres tersimpan.
- **CREDITS** — halaman kredit game.

Progres disimpan otomatis di `localStorage` dengan key `ashen-vow-progress-v1`. Menyelesaikan sebuah ruang membuka ruang berikutnya. Layar jeda, kematian, dan kemenangan juga punya jalan kembali ke **PILIH LEVEL** dan **MENU UTAMA**.

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

## Kontrol

| Aksi | Keyboard |
| --- | --- |
| Bergerak | `A` / `D` atau `←` / `→` |
| Lompat | `Space` / `W` / `↑` |
| Lompat ganda | Tekan lompat lagi setelah **Relik Bulu Bara** |
| Serang (kombo 3 hit) | `J` atau `Z` |
| Dash (i-frame) | `K` atau `Shift` |
| Minum flask | `E` atau `Q` |
| Jeda | `Esc` |
| Suara | `M` |
| Pilih berkah | `1` / `2` / `3` |

Di menu: `Enter` memulai run, `L` membuka Level Select, `C` membuka Credits.
Di perangkat sentuh, tombol kiri/kanan, lompat, serang, dash, dan flask muncul otomatis.

## Isi v0.0.5

- **Menu awal, Level Select, Credits, dan progres tersimpan** — tidak langsung masuk gameplay.
- **4 ruang** yang terhubung: Gerbang Abu → Balai Sumpah → Singgasana Bara → Sarang Wyrm.
- **2 boss, masing-masing 2 fase**:
  - **Sir Mordrake, the Fallen Warden** (340 HP) — telegraf tebasan, ground slam, gelombang kejut. Di fase II ia bergerak lebih cepat, windup lebih pendek, damage lebih besar, dan setiap tebasan memanggil gelombang kejut tambahan.
  - **Vhael, the Ashen Wyrm** (480 HP) — volley bola api yang bisa ditebas dan dive attack. Di fase II volley menjadi 5 bola api yang lebih cepat, dan pola serangannya menambah **pilar api**.
- **Combat real-time**: kombo 3 hit, hitbox aktif per frame, hit-stop, screen shake, knockback, dan partikel.
- **Dash dengan i-frame** dan cooldown.
- **Relik Bulu Bara** — membuka lompat ganda dan menyegel gerbang Balai Sumpah.
- **Jurang** sebagai hazard: jatuh mengurangi HP dan mengembalikan pemain ke titik aman.
- **Tiga berkah** setelah Warden: Max HP, damage, atau dash.
- **Flask penyembuh** (3 charge) dengan waktu minum yang bisa diganggu.
- **HUD** HP, flask, status relik, bar boss dengan label **FASE I / FASE II**, petunjuk gerbang, banner ruang.
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

**22 tes deterministik, semuanya lulus.** Cakupannya:

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
- transisi fase Warden dan gelombang kejut fase II,
- kematian Warden → pilihan berkah → gerbang terbuka,
- pengaruh berkah damage,
- proyektil Wyrm melukai pemain,
- siklus dive Wyrm dan bola api,
- **transisi fase II Wyrm dan serangan pilar api**,
- **kedua boss dikunci tepat di dua fase**,
- kemenangan setelah Wyrm dikalahkan,
- state kematian membekukan simulasi.

Smoke test browser dijalankan lewat Chrome DevTools Protocol untuk memastikan:

- menu awal tampil dan HUD tersembunyi,
- Level Select menampilkan 4 kartu dengan status terkunci yang benar,
- Sneak Peek menyembunyikan pemain dan HUD,
- teks credits sesuai,
- progres tersimpan setelah reload,
- tidak ada error console,
- layout desktop dan mobile portrait (390×844) tidak memiliki overflow horizontal.

## Struktur proyek

```
ashen-vow/
├── index.html          # shell, menu, HUD, level select, credits, spectate
├── styles.css          # tema medieval, layout responsif, touch controls
├── server.js           # static server port 4300
├── CLAUDE.md           # master plan / handoff untuk Claude
├── src/
│   ├── core.js         # simulasi murni: player, musuh, boss, proyektil, gerbang
│   ├── render.js       # renderer Canvas prosedural + mode spectate
│   ├── audio.js        # SFX WebAudio prosedural
│   └── main.js         # loop fixed-timestep, menu, progres, input, HUD
├── tests/
│   └── core.test.js    # 22 tes Node
└── docs/               # tangkapan layar
```

### Desain simulasi

`AshenGame.update(dt, input)` memakai fixed timestep `1/120` detik. Logika tidak menyentuh DOM sehingga hasilnya sama di Node dan browser. Renderer dan audio hanya membaca state/event; event gameplay dikumpulkan di `game.events` untuk dipetakan ke SFX, UI, dan progres.

Event penting:

- `gatePass { from, to }` — ruang selesai dan ruang berikutnya dimasuki.
- `bossDown { room, kind, name }` — boss dikalahkan.
- `bossPhase { name }` — transisi ke fase II.

Debug hook `window.__ashen` tersedia untuk smoke test (`snap()`, `step()`, `enterRoom()`, `damageBoss()`, `chooseBlessing()`, `startSpectate()`, `clearProgress()`).

## Master plan

Ringkasan arsitektur, keputusan desain, status verifikasi, dan roadmap ada di [`CLAUDE.md`](CLAUDE.md).

## Lisensi

Proyek demo pribadi. Aset visual dan audio dibuat secara prosedural di dalam kode.
