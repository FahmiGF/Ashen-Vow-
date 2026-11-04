// Ashen Vow v0.0.6 — one-minute narrative prologue.
// Procedural Canvas scenes; narration is spoken through the browser's
// speech synthesis (voice-over) while every line is also shown as a subtitle.

export const PROLOGUE_BEATS = [
  {
    scene: 'kingdom',
    label: 'TAHUN 412 · SEBELUM KEGELAPAN',
    text: 'Di utara dunia, Kerajaan Opus berdiri megah di atas tujuh bukit.',
    duration: 5,
  },
  {
    scene: 'kingdom',
    label: 'KERAJAAN OPUS · IBU KOTA',
    text: 'Raja dan ratunya bersumpah menjaga api peradaban yang tidak pernah padam.',
    duration: 5,
  },
  {
    scene: 'crown',
    label: 'SUMPAH PARA RAJA',
    text: 'Namun kemakmuran Opus menarik perhatian yang jauh lebih tua dari manusia.',
    duration: 5,
  },
  {
    scene: 'rift',
    label: 'MALAM KETIGA BELAS',
    text: 'Suatu malam, langit terbelah dan gerbang neraka terbuka di atas ibu kota.',
    duration: 5,
  },
  {
    scene: 'devil',
    label: 'SERANGAN IBLIS',
    text: 'Pasukan Iblis menyerbu dari celah itu, dipimpin oleh Raja Iblis Vharos.',
    duration: 5,
  },
  {
    scene: 'darkelf',
    label: 'PENGKHIANATAN ELF KEGELAPAN',
    text: 'Di saat yang sama, Elf Kegelapan yang bersembunyi di bayangan berkhianat.',
    duration: 5,
  },
  {
    scene: 'war',
    label: 'PERANG DI TANAH OPUS',
    text: 'Mereka membakar kuil, merobohkan menara, dan memecah sumpah para ksatria.',
    duration: 5,
  },
  {
    scene: 'fall',
    label: 'KERUNTUHAN',
    text: 'Kerajaan Opus runtuh dalam satu malam. Ribuan nyawa berubah menjadi abu.',
    duration: 5,
  },
  {
    scene: 'ash',
    label: 'LADANG ABU',
    text: 'Yang tersisa hanyalah puing, kabut, dan sumpah yang belum ditepati.',
    duration: 5,
  },
  {
    scene: 'vow',
    label: 'YANG MASIH BERDIRI',
    text: 'Kau adalah salah satu dari sedikit yang selamat, ditempa oleh abu itu.',
    duration: 5,
  },
  {
    scene: 'vow',
    label: 'SUMPAH DI ANTARA ABU',
    text: 'Dengan pedang di tangan, kau bersumpah mengembalikan cahaya Opus.',
    duration: 5,
  },
  {
    scene: 'end',
    label: 'ASHEN VOW',
    text: 'Inilah awal dari Sumpah Abu. Perjalananmu dimulai sekarang.',
    duration: 5,
  },
];

export const PROLOGUE_TOTAL = PROLOGUE_BEATS.reduce((sum, beat) => sum + beat.duration, 0);

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

function seeded(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function towers(ctx, w, h, baseY, color, scale = 1, lit = false, t = 0) {
  const towerData = [
    [0.08, 0.34, 0.09],
    [0.18, 0.24, 0.07],
    [0.28, 0.44, 0.12],
    [0.4, 0.3, 0.08],
    [0.52, 0.52, 0.14],
    [0.66, 0.36, 0.1],
    [0.78, 0.28, 0.08],
    [0.88, 0.42, 0.11],
  ];
  for (const [fx, fh, fw] of towerData) {
    const tw = fw * w * scale;
    const th = fh * h * scale;
    const x = fx * w - tw / 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - th, tw, th);
    // spire
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.12, baseY - th);
    ctx.lineTo(x + tw / 2, baseY - th - th * 0.3);
    ctx.lineTo(x + tw * 1.12, baseY - th);
    ctx.closePath();
    ctx.fill();
    if (lit) {
      const rows = Math.max(2, Math.round(th / 26));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 3; c++) {
          if (seeded(r * 13 + c * 7 + fx * 100) > 0.52) continue;
          const gx = x + tw * (0.22 + c * 0.26);
          const gy = baseY - th + 18 + r * 24;
          const flicker = 0.45 + 0.35 * Math.abs(Math.sin(t * 1.7 + r + c + fx * 9));
          ctx.fillStyle = `rgba(255,190,90,${flicker})`;
          ctx.fillRect(gx, gy, 3.5, 5.5);
        }
      }
    }
  }
}

function stars(ctx, w, h, t, color = 'rgba(235,215,180,') {
  for (let i = 0; i < 90; i++) {
    const x = seeded(i) * w;
    const y = seeded(i + 500) * h * 0.66;
    const a = 0.15 + 0.4 * Math.abs(Math.sin(t * 0.6 + i));
    ctx.fillStyle = `${color}${a})`;
    const s = seeded(i + 900) > 0.85 ? 2 : 1;
    ctx.fillRect(x, y, s, s);
  }
}

function embers(ctx, w, h, t, amount = 70, color = '255,140,60') {
  for (let i = 0; i < amount; i++) {
    const speed = 16 + seeded(i + 40) * 46;
    const x = (seeded(i) * w + Math.sin(t * 0.7 + i) * 22 + w) % w;
    const y = (h - ((t * speed + seeded(i + 120) * h * 1.4) % (h * 1.15)));
    const a = 0.25 + 0.5 * Math.abs(Math.sin(t * 1.4 + i));
    const s = 1 + seeded(i + 220) * 2.4;
    ctx.fillStyle = `rgba(${color},${a})`;
    ctx.fillRect(x, y, s, s);
  }
}

function ash(ctx, w, h, t) {
  for (let i = 0; i < 120; i++) {
    const x = (seeded(i + 700) * w + t * (6 + seeded(i) * 16)) % w;
    const y = (seeded(i + 1300) * h + Math.sin(t * 0.5 + i) * 14) % h;
    const a = 0.12 + 0.3 * Math.abs(Math.sin(t * 0.8 + i));
    ctx.fillStyle = `rgba(200,190,175,${a})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function silhouetteFigure(ctx, x, y, scale, cloak = '#15100c', accent = '#d07a35', sword = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // cloak
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(0, -96);
  ctx.quadraticCurveTo(-40, -50, -34, 2);
  ctx.lineTo(-14, -22);
  ctx.lineTo(-2, 4);
  ctx.lineTo(12, -20);
  ctx.lineTo(34, 2);
  ctx.quadraticCurveTo(40, -50, 0, -96);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.arc(0, -104, 14, 0, Math.PI * 2);
  ctx.fill();
  // eye
  ctx.fillStyle = accent;
  ctx.fillRect(3, -107, 6, 2.4);
  if (sword) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, -78);
    ctx.lineTo(34, -4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,225,200,0.75)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(20, -76);
    ctx.lineTo(38, -2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPrologue(ctx, w, h, beat, beatTime, totalTime) {
  const t = totalTime;
  const scene = beat.scene;
  const into = clamp01(beatTime / 1.1);
  const out = 1 - clamp01((beatTime - beat.duration + 0.7) / 0.7);
  const fade = Math.min(into, out);

  // base sky
  const mood = {
    kingdom: ['#1a1826', '#3b2a2a', '#7a4a2c'],
    crown: ['#12111c', '#2a2030', '#4a2e28'],
    rift: ['#0a0710', '#220b14', '#5a1818'],
    devil: ['#0c0508', '#330b10', '#6b1a12'],
    darkelf: ['#070b0e', '#101a20', '#1d2f2c'],
    war: ['#120705', '#3a0f08', '#7a2410'],
    fall: ['#0b0806', '#241511', '#4a2418'],
    ash: ['#101010', '#242120', '#3a342e'],
    vow: ['#0d0806', '#241310', '#5c2a16'],
    end: ['#080605', '#1a0f0b', '#2c1a10'],
  }[scene] || ['#0b0806', '#241511', '#4a2418'];

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, mood[0]);
  sky.addColorStop(0.55, mood[1]);
  sky.addColorStop(1, mood[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // moon / rift glow
  const glowX = w * (scene === 'rift' || scene === 'devil' ? 0.72 : 0.62);
  const glowY = h * 0.24;
  const halo = ctx.createRadialGradient(glowX, glowY, 6, glowX, glowY, w * 0.38);
  if (scene === 'rift' || scene === 'devil' || scene === 'war') {
    halo.addColorStop(0, 'rgba(255,90,40,0.4)');
    halo.addColorStop(0.45, 'rgba(180,40,20,0.18)');
    halo.addColorStop(1, 'rgba(120,20,10,0)');
  } else if (scene === 'darkelf') {
    halo.addColorStop(0, 'rgba(120,220,190,0.24)');
    halo.addColorStop(0.5, 'rgba(60,140,120,0.1)');
    halo.addColorStop(1, 'rgba(40,100,90,0)');
  } else {
    halo.addColorStop(0, 'rgba(235,205,150,0.3)');
    halo.addColorStop(0.5, 'rgba(200,150,90,0.1)');
    halo.addColorStop(1, 'rgba(180,120,60,0)');
  }
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  stars(ctx, w, h, t, scene === 'darkelf' ? 'rgba(190,235,220,' : 'rgba(235,215,180,');

  // horizon
  const groundY = h * 0.78;
  ctx.fillStyle = 'rgba(8,6,5,0.9)';
  ctx.fillRect(0, groundY, w, h - groundY);

  if (scene === 'kingdom') {
    // golden city on seven hills
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `rgba(28,18,14,${0.85 - i * 0.14})`;
      ctx.beginPath();
      const hillW = w * (0.9 - i * 0.12);
      const hillX = w * 0.5 - hillW / 2 + Math.sin(i * 2) * w * 0.08;
      ctx.ellipse(hillX + hillW / 2, groundY + 10, hillW / 2, 70 - i * 8, 0, Math.PI, 0);
      ctx.fill();
    }
    towers(ctx, w, h, groundY + 6, '#161210', 0.92, true, t);
    ctx.strokeStyle = 'rgba(230,190,120,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.16);
    ctx.lineTo(w * 0.22, h * 0.62);
    ctx.stroke();
    ctx.fillStyle = 'rgba(230,190,120,0.5)';
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.16);
    ctx.lineTo(w * 0.3, h * 0.2);
    ctx.lineTo(w * 0.22, h * 0.24);
    ctx.closePath();
    ctx.fill();
  } else if (scene === 'crown') {
    const cx = w * 0.5;
    const cy = h * 0.45;
    const r = Math.min(w, h) * 0.16;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(235,200,130,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d9b166';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.2);
    ctx.lineTo(-r * 0.55, -r * 0.2);
    ctx.lineTo(-r * 0.28, r * 0.02);
    ctx.lineTo(0, -r * 0.34);
    ctx.lineTo(r * 0.28, r * 0.02);
    ctx.lineTo(r * 0.55, -r * 0.2);
    ctx.lineTo(r * 0.55, r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(180,50,40,0.9)';
    ctx.beginPath();
    ctx.arc(0, r * 0.36, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    towers(ctx, w, h, groundY + 6, '#100d0d', 0.8, false, t);
  } else if (scene === 'rift') {
    // torn sky
    const cx = w * 0.7;
    const cy = h * 0.3;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,120,70,0.85)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 20, 0);
    ctx.lineTo(cx + 10, cy * 0.4);
    ctx.lineTo(cx - 34, cy * 0.72);
    ctx.lineTo(cx + 18, cy * 1.1);
    ctx.lineTo(cx - 6, h * 0.62);
    ctx.stroke();
    const tear = ctx.createLinearGradient(cx - 60, 0, cx + 60, h * 0.6);
    tear.addColorStop(0, 'rgba(255,170,90,0.0)');
    tear.addColorStop(0.5, 'rgba(255,120,60,0.45)');
    tear.addColorStop(1, 'rgba(255,70,30,0.0)');
    ctx.fillStyle = tear;
    ctx.beginPath();
    ctx.moveTo(cx - 30, 0);
    ctx.lineTo(cx + 20, cy * 0.5);
    ctx.lineTo(cx - 16, cy);
    ctx.lineTo(cx + 26, h * 0.55);
    ctx.lineTo(cx - 6, h * 0.55);
    ctx.lineTo(cx - 44, cy);
    ctx.lineTo(cx - 12, cy * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    towers(ctx, w, h, groundY + 6, '#0d0908', 0.9, false, t);
  } else if (scene === 'devil') {
    // horned colossus in the rift
    ctx.save();
    ctx.translate(w * 0.7, h * 0.62);
    const s = Math.min(w, h) / 520;
    ctx.scale(s, s);
    const body = ctx.createLinearGradient(0, -280, 0, 120);
    body.addColorStop(0, 'rgba(90,16,14,0.95)');
    body.addColorStop(1, 'rgba(20,5,5,0.98)');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-120, 120);
    ctx.quadraticCurveTo(-160, -60, -70, -170);
    ctx.quadraticCurveTo(0, -230, 70, -170);
    ctx.quadraticCurveTo(160, -60, 120, 120);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.fillStyle = 'rgba(40,8,8,0.98)';
    ctx.beginPath();
    ctx.arc(0, -184, 46, 0, Math.PI * 2);
    ctx.fill();
    // horns
    ctx.strokeStyle = 'rgba(200,150,110,0.75)';
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(-30, -214);
    ctx.quadraticCurveTo(-84, -270, -28, -300);
    ctx.moveTo(30, -214);
    ctx.quadraticCurveTo(84, -270, 28, -300);
    ctx.stroke();
    // eyes
    const eyeGlow = ctx.createRadialGradient(0, -190, 2, 0, -190, 30);
    eyeGlow.addColorStop(0, 'rgba(255,220,140,0.95)');
    eyeGlow.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(0, -190, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffdc8a';
    ctx.fillRect(-18, -194, 12, 4);
    ctx.fillRect(6, -194, 12, 4);
    ctx.restore();
    // army
    ctx.fillStyle = 'rgba(10,4,4,0.95)';
    for (let i = 0; i < 24; i++) {
      const x = w * 0.1 + (i / 24) * w * 0.8;
      const y = groundY + 4 + Math.sin(i) * 4;
      ctx.fillRect(x, y - 22, 7, 22);
      ctx.beginPath();
      ctx.arc(x + 3.5, y - 26, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene === 'darkelf') {
    // pale traitor between black trees
    for (let i = 0; i < 7; i++) {
      const x = (i / 7) * w + 40;
      ctx.strokeStyle = 'rgba(10,18,17,0.95)';
      ctx.lineWidth = 16 + (i % 3) * 6;
      ctx.beginPath();
      ctx.moveTo(x, groundY + 10);
      ctx.quadraticCurveTo(x + Math.sin(i) * 30, h * 0.4, x + Math.sin(i * 2) * 50, 0);
      ctx.stroke();
    }
    const cx = w * 0.5;
    const cy = groundY;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(12,20,19,0.98)';
    ctx.beginPath();
    ctx.moveTo(0, -150);
    ctx.quadraticCurveTo(-44, -80, -36, 0);
    ctx.lineTo(-12, -34);
    ctx.lineTo(0, 0);
    ctx.lineTo(12, -34);
    ctx.lineTo(36, 0);
    ctx.quadraticCurveTo(44, -80, 0, -150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cfd8cf';
    ctx.beginPath();
    ctx.arc(0, -164, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a2b28';
    ctx.fillRect(2, -168, 8, 3);
    // twin blades
    ctx.strokeStyle = 'rgba(170,235,215,0.9)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-26, -110);
    ctx.lineTo(-70, -30);
    ctx.moveTo(26, -110);
    ctx.lineTo(70, -30);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(120,220,190,0.08)';
    ctx.fillRect(0, 0, w, h);
  } else if (scene === 'war') {
    towers(ctx, w, h, groundY + 10, '#120807', 0.95, true, t * 2.4);
    // flames
    for (let i = 0; i < 16; i++) {
      const x = seeded(i + 30) * w;
      const fh = 30 + seeded(i + 90) * 110;
      const fl = ctx.createLinearGradient(x, groundY - fh, x, groundY);
      fl.addColorStop(0, 'rgba(255,200,90,0)');
      fl.addColorStop(0.55, 'rgba(255,140,50,0.55)');
      fl.addColorStop(1, 'rgba(200,50,20,0.85)');
      ctx.fillStyle = fl;
      ctx.beginPath();
      ctx.moveTo(x - 14, groundY);
      ctx.quadraticCurveTo(x - 6, groundY - fh * 0.5, x + Math.sin(t * 3 + i) * 6, groundY - fh);
      ctx.quadraticCurveTo(x + 8, groundY - fh * 0.5, x + 14, groundY);
      ctx.closePath();
      ctx.fill();
    }
    embers(ctx, w, h, t, 110);
  } else if (scene === 'fall') {
    ctx.fillStyle = '#0b0807';
    for (let i = 0; i < 6; i++) {
      const x = w * (0.12 + i * 0.15);
      const lean = Math.sin(i * 1.7) * 0.4;
      ctx.save();
      ctx.translate(x, groundY + 10);
      ctx.rotate(lean);
      ctx.fillRect(-14, -h * (0.18 + seeded(i) * 0.2), 28, h * 0.3);
      ctx.restore();
    }
    // broken crown in the rubble
    ctx.save();
    ctx.translate(w * 0.5, groundY - 6);
    ctx.rotate(-0.22);
    ctx.fillStyle = 'rgba(190,150,90,0.65)';
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.lineTo(-46, -20);
    ctx.lineTo(-26, -6);
    ctx.lineTo(0, -30);
    ctx.lineTo(26, -6);
    ctx.lineTo(46, -20);
    ctx.lineTo(46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    embers(ctx, w, h, t, 40, '200,120,70');
  } else if (scene === 'ash') {
    const g = ctx.createLinearGradient(0, groundY - 80, 0, h);
    g.addColorStop(0, 'rgba(40,37,34,0.6)');
    g.addColorStop(1, 'rgba(12,11,10,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, groundY - 80, w, h - groundY + 80);
    // planted swords
    for (let i = 0; i < 6; i++) {
      const x = w * (0.12 + i * 0.15) + Math.sin(i * 3) * 18;
      ctx.strokeStyle = 'rgba(120,112,100,0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, groundY + 12);
      ctx.lineTo(x + 4, groundY - 42 - seeded(i) * 22);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150,140,125,0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, groundY - 40 - seeded(i) * 22);
      ctx.lineTo(x + 16, groundY - 40 - seeded(i) * 22);
      ctx.stroke();
    }
    ash(ctx, w, h, t);
  } else if (scene === 'vow') {
    towers(ctx, w, h, groundY + 8, '#0e0a08', 0.7, false, t);
    // ember moon
    ctx.fillStyle = 'rgba(232,180,106,0.22)';
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.24, 58, 0, Math.PI * 2);
    ctx.fill();
    silhouetteFigure(ctx, w * 0.5, groundY + 4, Math.min(w, h) / 470, '#14100c', '#e09a54');
    embers(ctx, w, h, t, 54);
  } else {
    // end card
    ctx.fillStyle = 'rgba(8,6,5,0.5)';
    ctx.fillRect(0, 0, w, h);
    silhouetteFigure(ctx, w * 0.5, groundY + 4, Math.min(w, h) / 520, '#14100c', '#e09a54');
    ash(ctx, w, h, t);
  }

  // vignette
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // letterbox + fade
  ctx.fillStyle = `rgba(0,0,0,${0.92 - fade * 0.92})`;
  ctx.fillRect(0, 0, w, h);

  // scene title
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(233,220,194,0.82)';
  ctx.font = `${Math.max(10, Math.round(w * 0.011))}px Cinzel, Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  if (scene === 'end') {
    ctx.globalAlpha = fade;
    const titleSize = Math.round(w * 0.075);
    ctx.font = `800 ${titleSize}px Cinzel, Georgia, serif`;
    ctx.fillStyle = '#e7d2a8';
    ctx.fillText('ASHEN VOW', w / 2, h * 0.3);
    ctx.font = `${Math.round(w * 0.02)}px Cinzel, Georgia, serif`;
    ctx.fillStyle = 'rgba(201,162,92,0.8)';
    ctx.fillText('SUMPAH DI ANTARA ABU', w / 2, h * 0.36);
  }
  ctx.restore();

  // subtle cinematic bars
  ctx.fillStyle = '#050403';
  ctx.fillRect(0, 0, w, h * 0.055);
  ctx.fillRect(0, h * 0.945, w, h * 0.055);

  void lerp;
}
