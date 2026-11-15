// Ashen Vow v0.10.0 — cinematic cutscenes.
//
// Two procedural cutscenes live here, both drawn with the same Canvas contract
// as the prologue: no image files, no DOM, no audio. `main.js` owns playback,
// subtitles and skipping; this module owns the timeline and the art.
//
//   BOSS_CUTSCENE — 20 s portrait of the final boss, played before the fight.
//   POST_CREDIT   — 30 s epilogue after the Demon Lord falls and Opus is freed.

export const CUTSCENE_FINAL_BOSS = 'final_boss';
export const CUTSCENE_POST_CREDIT = 'post_credit';

export const BOSS_CUTSCENE = {
  id: CUTSCENE_FINAL_BOSS,
  duration: 20,
  music: 'fairyBoss',
  eyebrow: 'SINGGASANA SAYAP · SEBELUM PERTARUNGAN TERAKHIR',
  title: 'SYLVARA, NAGA PERI SPEKTRAL',
  palette: {
    top: '#050b14',
    mid: '#0c2030',
    low: '#1b3a44',
    glow: '#f0c8ff',
  },
  beats: [
    { at: 0, label: 'SINGGASANA SAYAP', text: 'Di atas Taman Peri, cahaya mengalir ke satu titik.' },
    { at: 3.4, label: 'NAGA PERI SPEKTRAL', text: 'Sylvara turun dari langit yang tidak pernah ia tinggalkan.' },
    { at: 6.8, label: 'SEPULUH GERBANG', text: 'Sepuluh gerbang telah kau lewati. Ia menghitung setiap langkahmu.' },
    { at: 10.2, label: 'SAYAP YANG MENGINGAT', text: 'Sayapnya menyimpan nama peri yang kau lupakan di jalan.' },
    { at: 13.6, label: 'SESUATU YANG LEBIH TUA', text: 'Di balik cahaya itu, sesuatu yang lebih tua dari taman ini menunggu.' },
    { at: 17, label: 'LANGIT RETAK', text: 'Dan langit mulai retak — bukan karena kau, tetapi karena ia mengizinkannya.' },
  ],
};

export const POST_CREDIT = {
  id: CUTSCENE_POST_CREDIT,
  duration: 30,
  music: 'celebration',
  eyebrow: 'EPILOG · SETELAH SEGEL TERAKHIR',
  title: 'KERAJAAN OPUS BEBAS',
  palette: {
    top: '#1a1424',
    mid: '#5a3a4a',
    low: '#e0b878',
    glow: '#ffe8b0',
  },
  beats: [
    { at: 0, label: 'RAJA IBLIS GUGUR', text: 'Vharos, Raja Iblis yang menahan Opus dalam gelap, akhirnya runtuh.' },
    { at: 4.3, label: 'GERBANG NERAKA MENUTUP', text: 'Gerbang neraka menutup dari dalam, dan tidak ada yang keluar lagi.' },
    { at: 8.6, label: 'LANGIT PERTAMA', text: 'Langit Opus kembali biru untuk pertama kalinya dalam tiga belas tahun.' },
    { at: 12.9, label: 'TAMAN PERI MEKAR', text: 'Taman Peri mekar lagi, dan nama-nama yang hilang akhirnya diucapkan.' },
    { at: 17.2, label: 'TUJUH BUKIT', text: 'Api peradaban menyala kembali di tujuh bukit Kerajaan Opus.' },
    { at: 21.5, label: 'SUMPAH YANG PULANG', text: 'Sumpah yang kau bawa pulang tidak lagi terasa berat.' },
    { at: 25.8, label: 'NAMA YANG DICATAT', text: 'Namamu dicatat — bukan sebagai pembunuh, tetapi sebagai penjaga.' },
  ],
  finale: 'KERAJAAN OPUS BEBAS · TERIMA KASIH TELAH BERJALAN SEJAUH INI',
};

export function cutsceneFor(id) {
  if (id === POST_CREDIT.id) return POST_CREDIT;
  if (id === BOSS_CUTSCENE.id) return BOSS_CUTSCENE;
  return null;
}

export function cutsceneBeatIndex(scene, time) {
  const beats = scene?.beats || [];
  let index = 0;
  for (let i = 0; i < beats.length; i += 1) {
    if (time >= beats[i].at) index = i;
  }
  return index;
}

export function cutsceneBeatAt(scene, time) {
  const beats = scene?.beats || [];
  return beats[cutsceneBeatIndex(scene, time)] || beats[0] || null;
}

const clamp = (value, min, max) => (value < min ? min : value > max ? max : value);
const lerp = (a, b, t) => a + (b - a) * t;

function sky(ctx, w, h, top, mid, low, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(0.55, mid);
  g.addColorStop(1, low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 3; i += 1) {
    const y = h * (0.7 + i * 0.06);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 40) {
      ctx.lineTo(x, y - 20 - Math.sin((x / w) * 6 + i * 2 + t * 0.12) * (16 + i * 8));
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function dragon(ctx, w, h, t, color) {
  const cx = w * 0.56;
  const cy = h * 0.46;
  const flap = Math.sin(t * 1.6) * 0.16;
  const scale = Math.min(w, h) / 540;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const glow = ctx.createRadialGradient(0, 0, 20, 0, 0, 300);
  glow.addColorStop(0, 'rgba(240,200,255,0.35)');
  glow.addColorStop(0.6, 'rgba(155,232,200,0.12)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 300, 0, Math.PI * 2);
  ctx.fill();

  // wings
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.scale(dir, 1);
    ctx.rotate(flap * dir);
    ctx.fillStyle = 'rgba(14, 30, 34, 0.94)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(120, -170, 240, -120);
    ctx.quadraticCurveTo(190, -60, 205, -10);
    ctx.quadraticCurveTo(150, -30, 120, 20);
    ctx.quadraticCurveTo(70, -6, 10, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(30, -10);
    ctx.lineTo(150, -120);
    ctx.moveTo(60, 2);
    ctx.lineTo(160, -70);
    ctx.stroke();
    ctx.restore();
  }

  // body + tail
  ctx.fillStyle = 'rgba(9, 20, 24, 0.96)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 40, 66, 34, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-58, 44);
  ctx.quadraticCurveTo(-140, 70, -188, 26 + Math.sin(t * 1.3) * 10);
  ctx.quadraticCurveTo(-140, 92, -54, 66);
  ctx.closePath();
  ctx.fill();

  // neck + head
  ctx.beginPath();
  ctx.moveTo(28, 24);
  ctx.quadraticCurveTo(54, -22, 52, -58);
  ctx.quadraticCurveTo(78, -78, 96, -52);
  ctx.quadraticCurveTo(74, -34, 66, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(88, -58, 30, 19, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // horns
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (const off of [-8, 6]) {
    ctx.beginPath();
    ctx.moveTo(78 + off, -70);
    ctx.quadraticCurveTo(88 + off, -98, 104 + off, -104);
    ctx.stroke();
  }

  // glowing eyes
  ctx.fillStyle = '#fff4ff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(96, -62, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // crystal chest
  ctx.fillStyle = 'rgba(240,200,255,0.65)';
  ctx.beginPath();
  ctx.moveTo(6, 22);
  ctx.lineTo(16, 38);
  ctx.lineTo(6, 56);
  ctx.lineTo(-4, 38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // drifting motes
  ctx.save();
  for (let i = 0; i < 46; i += 1) {
    const seed = i * 91.7;
    const x = (seed * 3.1 + t * 26) % w;
    const y = h * 0.62 - ((seed * 2.3 + t * 34) % (h * 0.55));
    const size = 1 + (i % 4) * 0.8;
    ctx.globalAlpha = 0.22 + 0.4 * Math.abs(Math.sin(t * 0.9 + i));
    ctx.fillStyle = i % 5 === 0 ? '#ffe0a0' : color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function epilogue(ctx, w, h, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1a1428');
  g.addColorStop(0.42, '#6a4650');
  g.addColorStop(0.7, '#d8a06a');
  g.addColorStop(1, '#f0d8a0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // rising sun
  const sunY = h * 0.62 - Math.min(120, t * 3.2);
  const sun = ctx.createRadialGradient(w * 0.5, sunY, 10, w * 0.5, sunY, 260);
  sun.addColorStop(0, 'rgba(255,244,200,0.9)');
  sun.addColorStop(0.4, 'rgba(255,200,120,0.32)');
  sun.addColorStop(1, 'rgba(255,180,90,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(w * 0.5, sunY, 260, 0, Math.PI * 2);
  ctx.fill();

  // distant hills
  ctx.fillStyle = 'rgba(40,28,44,0.75)';
  for (let layer = 0; layer < 2; layer += 1) {
    const base = h * (0.72 + layer * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, base - Math.sin((x / w) * 5 + layer * 1.4) * (18 + layer * 12));
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = layer === 0 ? 'rgba(40,28,44,0.75)' : 'rgba(24,16,28,0.85)';
  }

  // Opus on seven hills
  const cx = w * 0.5;
  const baseY = h * 0.82;
  ctx.fillStyle = 'rgba(18,12,22,0.95)';
  for (let i = 0; i < 7; i += 1) {
    const x = cx + (i - 3) * 62;
    const towerH = 42 + (i % 3) * 20;
    ctx.fillRect(x - 12, baseY - towerH, 24, towerH);
    ctx.beginPath();
    ctx.moveTo(x - 16, baseY - towerH);
    ctx.lineTo(x, baseY - towerH - 26);
    ctx.lineTo(x + 16, baseY - towerH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(cx - 190, baseY - 26, 380, 26);

  // banner rising
  const bannerT = clamp(t / 12, 0, 1);
  ctx.globalAlpha = bannerT;
  ctx.strokeStyle = '#f0d8a0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - 210);
  ctx.lineTo(cx, baseY - 90 - bannerT * 40);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,200,140,0.85)';
  ctx.beginPath();
  ctx.moveTo(cx, baseY - 90 - bannerT * 40);
  ctx.lineTo(cx + 70, baseY - 74 - bannerT * 40);
  ctx.lineTo(cx, baseY - 54 - bannerT * 40);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // sparks of the freed kingdom
  for (let i = 0; i < 60; i += 1) {
    const seed = i * 77.3;
    const x = (seed * 3.7 + t * 10) % w;
    const y = h - ((seed * 2.1 + t * (24 + (i % 5) * 6)) % h);
    ctx.globalAlpha = 0.2 + 0.45 * Math.abs(Math.sin(t * 1.1 + i));
    ctx.fillStyle = i % 6 === 0 ? '#fff4d0' : '#ffd08a';
    ctx.beginPath();
    ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Draws the scene for the given elapsed time. `w`/`h` are canvas pixels.
export function drawCutscene(ctx, w, h, scene, time) {
  if (!ctx || !scene) return;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  const t = Math.max(0, time);
  if (scene.id === CUTSCENE_POST_CREDIT) {
    epilogue(ctx, w, h, t);
  } else {
    const pal = scene.palette || BOSS_CUTSCENE.palette;
    sky(ctx, w, h, pal.top, pal.mid, pal.low, t);
    const reveal = clamp(t / 4, 0, 1);
    ctx.globalAlpha = 0.35 + reveal * 0.65;
    dragon(ctx, w, h, t, pal.glow);
    ctx.globalAlpha = 1;
    // slow letterbox glow at the horizon
    const horizon = ctx.createLinearGradient(0, h * 0.62, 0, h);
    horizon.addColorStop(0, 'rgba(240,200,255,0)');
    horizon.addColorStop(1, 'rgba(240,200,255,0.18)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
  }
  // cinematic letterbox
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, w, h * 0.055);
  ctx.fillRect(0, h * 0.945, w, h * 0.055);
  ctx.restore();
}

export const CUTSCENES = [BOSS_CUTSCENE, POST_CREDIT];
