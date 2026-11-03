# Ashen Vow — Cinematic Trailer

**File:** `ashen-vow-trailer.mp4`
**Thumbnail:** `thumbnail.png`

| Spesifikasi | Nilai |
| --- | --- |
| Durasi | 120 detik |
| Resolusi | 1280 × 720 (16:9) |
| Frame rate | 30 fps |
| Video | H.264 High, CRF 18, yuv420p |
| Audio | AAC 192 kbps, 48 kHz, stereo |
| Loudness | ± -16 LUFS integrated (original score) |

## Timeline

| Waktu | Bagian |
| --- | --- |
| 0:00 – 0:05 | Studio ident |
| 0:05 – 0:14 | Establishing: Gerbang Abu |
| 0:14 – 0:20 | Title card |
| 0:20 – 0:32 | Combat: crawler di Gerbang Abu |
| 0:32 – 0:38 | Balai Sumpah — traversal & dash |
| 0:38 – 0:44 | Relik Bulu Bara & lompat ganda |
| 0:44 – 0:58 | Boss: Sir Mordrake, The Fallen Warden |
| 0:58 – 1:07 | Warung Abu |
| 1:07 – 1:22 | Boss: Vhael, The Ashen Wyrm |
| 1:22 – 1:27 | Kejatuhan Wyrm (slow motion) |
| 1:27 – 1:30 | Layar "Sumpah Tuntas" |
| 1:30 – 1:40 | Montage |
| 1:40 – 1:52 | End card — ajakan bermain |
| 1:52 – 2:00 | Credits |

## Produksi

- **Footage:** capture in-engine deterministik pada 30 fps melalui Chrome DevTools Protocol. Loop `requestAnimationFrame` dibekukan, lalu tiap frame dijalankan dengan `__ashen.step(1/30, input)` dan `renderer.render()` agar gerakan konsisten dan dapat direproduksi.
- **Grading:** tone curve hangat, bloom halus, vignette, film grain, dan partikel ember prosedural di-composite di atas setiap frame.
- **Tipografi:** Cinzel (judul) dan Cormorant Garamond (subjudul), dibuat sebagai kartu dan lower-third PNG.
- **Musik:** skor orisinal 120 detik disintesis dari nol (pad, choir, taiko, ostinato, braam, riser) lalu di-master ke sekitar -16 LUFS.
- **Thumbnail:** crop key art duel Sir Mordrake, di-grade, dengan judul dan badge.

## Berkas kerja

Frame source, poster, kartu, font, dan WAV adalah berkas kerja berukuran besar dan **di-ignore** oleh git. Yang dibagikan di repositori hanya MP4 final dan thumbnail.
