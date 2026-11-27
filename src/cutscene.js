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

// ── Infinitower cinematics ─────────────────────────────────────────────────
// The spiral has no ending, so its trailer sells the climb instead of a
// finale, and the boss portrait is replayed before the first boss of a run.
export const SPIRAL_INTRO_CUTSCENE = {
  id: 'spiral_intro',
  duration: 18,
  music: 'spiralTrailer',
  eyebrow: 'TRAILER · INFINITOWER · LINGKAR ABADI',
  title: 'THE SPIRAL CHOIR',
  palette: {
    top: '#05040c',
    mid: '#1b1034',
    low: '#3d2262',
    glow: '#c8b4ff',
  },
  beats: [
    { at: 0, label: 'GERBANG LINGKAR', text: 'Tidak ada puncak di menara ini. Hanya jalan yang berputar ke dalam.' },
    { at: 2.8, label: 'DINDING YANG BERNYANYI', text: 'Setiap batu mencatat nama penjaga yang jatuh sebelumnya.' },
    { at: 5.6, label: 'DUA PULUH MENARA', text: 'Dua puluh bentuk pertahanan, satu mahkota, dan tidak ada kemenangan.' },
    { at: 8.6, label: 'SESUATU MENGHITUNG', text: 'Di bawah lantai, koor mulai menghitung gelombangmu.' },
    { at: 11.6, label: 'TINGKAT DEMI TINGKAT', text: 'Setiap sepuluh gelombang, lingkar menutup satu lapis lagi.' },
    { at: 14.4, label: 'SATU-SATUNYA UNDANGAN', text: 'Bertahanlah selama kau bisa. Lingkar akan mengingat berapa lama.' },
  ],
  finale: 'INFINITOWER · TIDAK ADA KEMENANGAN, HANYA BERAPA LAMA',
};

export const SPIRAL_BOSS_CUTSCENE = {
  id: 'spiral_boss',
  duration: 11,
  music: 'spiralBoss',
  eyebrow: 'INFINITOWER · GERBANG BOS',
  title: 'SPIRAL TYRANT',
  palette: {
    top: '#0a0408',
    mid: '#2a1020',
    low: '#5a2030',
    glow: '#ffb45c',
  },
  beats: [
    { at: 0, label: 'LINGKAR BERHENTI', text: 'Jalan berhenti berputar. Untuk pertama kalinya, sesuatu menunggu.' },
    { at: 2.8, label: 'TIRAN LINGKAR', text: 'Spiral Tyrant keluar dari dinding, membawa seluruh pasukannya di punggung.' },
    { at: 5.6, label: 'KOOR DI BELAKANGNYA', text: 'Dan di belakangnya, koor menyanyikan gelombang yang belum pernah kau lihat.' },
    { at: 8.2, label: 'TIDAK ADA JALAN PULANG', text: 'Tidak ada gerbang keluar. Hanya menara, mahkota, dan satu gelombang lagi.' },
  ],
};

export function cutsceneFor(id) {
  if (id === POST_CREDIT.id) return POST_CREDIT;
  if (id === BOSS_CUTSCENE.id) return BOSS_CUTSCENE;
  if (id === SPIRAL_INTRO_CUTSCENE.id) return SPIRAL_INTRO_CUTSCENE;
  if (id === SPIRAL_BOSS_CUTSCENE.id) return SPIRAL_BOSS_CUTSCENE;
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

// ── Spiral trailer / boss portrait art ─────────────────────────────────────
// A stone spiral seen from above, a crown of towers, and an army walking the
// road forever. The boss variant replaces the crown with the Choir.
function spiralScene(ctx, w, h, t, scene) {
  const pal = scene.palette || SPIRAL_INTRO_CUTSCENE.palette;
  const boss = scene.id === SPIRAL_BOSS_CUTSCENE.id;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, pal.top);
  g.addColorStop(0.55, pal.mid);
  g.addColorStop(1, pal.low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Cold stars / drifting ash above the spire.
  for (let i = 0; i < 70; i += 1) {
    const seed = i * 91.7;
    const x = (seed * 3.1 + w * 0.5) % w;
    const y = (seed * 2.7 + h * 0.1) % (h * 0.65);
    ctx.globalAlpha = 0.12 + 0.4 * Math.abs(Math.sin(t * 0.7 + i));
    ctx.fillStyle = i % 7 === 0 ? pal.glow : '#dfe6ff';
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const cx = w * (boss ? 0.56 : 0.5);
  const cy = h * 0.56;
  const scale = Math.min(w, h) / 620;
  const turn = t * (boss ? 0.12 : 0.2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Outer glow behind the spiral.
  const halo = ctx.createRadialGradient(0, 0, 20, 0, 0, 300);
  halo.addColorStop(0, 'rgba(200,180,255,0.20)');
  halo.addColorStop(0.55, 'rgba(120,90,200,0.10)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 300, 0, Math.PI * 2);
  ctx.fill();

  // Concentric rings.
  for (let ring = 1; ring <= 4; ring += 1) {
    const radius = 58 + ring * 52;
    const spin = turn * (ring % 2 ? 1 : -1.3);
    ctx.strokeStyle = ring % 2 ? 'rgba(200,180,255,0.34)' : 'rgba(120,100,190,0.26)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash(ring % 2 ? [18, 12] : [6, 16]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, spin, spin + Math.PI * 1.65);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // The road: an Archimedean spiral of stone.
  ctx.strokeStyle = 'rgba(226,214,255,0.5)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  for (let i = 0; i <= 150; i += 1) {
    const a = (i / 150) * Math.PI * 6 + turn;
    const radius = 12 + (i / 150) * 232;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius * 0.86;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Crown of towers at the outer edge.
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2 + turn * 0.4;
    const radius = 252;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius * 0.86;
    const height = 20 + (i % 4) * 7;
    ctx.fillStyle = i % 5 === 0 ? pal.glow : 'rgba(16,12,28,0.95)';
    ctx.globalAlpha = i % 5 === 0 ? 0.75 : 1;
    ctx.fillRect(x - 5, y - height, 10, height);
    ctx.beginPath();
    ctx.moveTo(x - 8, y - height);
    ctx.lineTo(x, y - height - 12);
    ctx.lineTo(x + 8, y - height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Bodies walking the road inward.
  for (let i = 0; i < 34; i += 1) {
    const a = (i / 34) * Math.PI * 6 + turn + Math.sin(t * 0.8 + i) * 0.02;
    const radius = 12 + (i / 34) * 226;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius * 0.86;
    ctx.fillStyle = i % 9 === 0 ? '#ffcf7a' : 'rgba(226,218,255,0.7)';
    ctx.beginPath();
    ctx.arc(x, y, i % 9 === 0 ? 4 : 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // The spire at the centre, or the Choir looming over it.
  if (boss) {
    const pulse = 1 + Math.sin(t * 2.2) * 0.04;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(12,6,10,0.96)';
    ctx.strokeStyle = pal.glow;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.quadraticCurveTo(96, -46, 74, 42);
    ctx.quadraticCurveTo(0, 102, -74, 42);
    ctx.quadraticCurveTo(-96, -46, 0, -118);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Many eyes.
    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * Math.PI * 2;
      const ex = Math.cos(a) * 46;
      const ey = Math.sin(a) * 34 - 12;
      const blink = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.6 + i * 1.7));
      ctx.fillStyle = `rgba(255,206,122,${0.45 + blink * 0.5})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 3.4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    // Ribs / arms reaching out of the shell.
    ctx.strokeStyle = 'rgba(255,180,92,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + Math.sin(t * 1.1 + i) * 0.08;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 58, Math.sin(a) * 44);
      ctx.quadraticCurveTo(Math.cos(a) * 120, Math.sin(a) * 90, Math.cos(a) * 164, Math.sin(a) * 124);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = 'rgba(10,8,20,0.96)';
    ctx.strokeStyle = pal.glow;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -150);
    ctx.lineTo(34, -20);
    ctx.lineTo(0, 34);
    ctx.lineTo(-34, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,180,255,0.5)';
    ctx.beginPath();
    ctx.arc(0, -84, 9 + Math.sin(t * 2.4) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Horizon haze.
  const haze = ctx.createLinearGradient(0, h * 0.72, 0, h);
  haze.addColorStop(0, 'rgba(0,0,0,0)');
  haze.addColorStop(1, boss ? 'rgba(120,40,30,0.35)' : 'rgba(120,90,200,0.22)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
}

// Draws the scene for the given elapsed time. `w`/`h` are canvas pixels.
export function drawCutscene(ctx, w, h, scene, time) {
  if (!ctx || !scene) return;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  const t = Math.max(0, time);
  if (scene.id === CUTSCENE_POST_CREDIT) {
    epilogue(ctx, w, h, t);
  } else if (scene.id === SPIRAL_INTRO_CUTSCENE.id || scene.id === SPIRAL_BOSS_CUTSCENE.id) {
    spiralScene(ctx, w, h, t, scene);
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

export const CUTSCENES = [BOSS_CUTSCENE, POST_CREDIT, SPIRAL_INTRO_CUTSCENE, SPIRAL_BOSS_CUTSCENE];
