// Ashen Vow — in-engine cinematic trailer (Update XXV).
//
// Pure module: the timeline, the narration script and a deterministic Canvas
// renderer. No DOM, no audio objects, no network. `main.js` owns playback and
// voice; this file owns what the trailer says and looks like.
//
// Every shot names a real mode that ships in this build. The trailer is not a
// mock-up of a future game: it is a 78-second cut assembled from the campaign,
// the branch chapters, the side modes and the 3D modes that already exist.

export const TRAILER_SCHEMA_VERSION = 1;

export const TRAILER_IDENTITY = {
  studio: 'SEALIUSHQ',
  title: 'ASHEN VOW',
  tagline: 'Sumpah yang tidak bisa ditarik kembali.',
  // Requirement 8 wording — must stay exact.
  footer: 'Made by SealiusHQ with a lot of support from Contributors',
  endCard: {
    eyebrow: 'SEKARANG DAPAT DIMAINKAN',
    title: 'ASHEN VOW',
    line: 'Lima belas penjaga · seratus lima puluh lebih boss · sebelas bab.',
    cta: 'MULAI PERJALANAN',
  },
};

// `at` is the absolute start time in seconds; `duration` keeps the cut tight.
// `cast` selects the voice actor from src/voice.js.
export const TRAILER_SHOTS = [
  {
    id: 'ident', at: 0, duration: 4.5, icon: 'ident', cast: 'trailer',
    eyebrow: 'SEALIUSHQ', title: 'ASHEN VOW',
    accent: ['#05070b', '#141018', '#c9a227'],
    narration: 'Ada sumpah yang tidak pernah diminta, tetapi tetap harus dijaga.',
  },
  {
    id: 'ashen_gate', at: 4.5, duration: 5.5, icon: 'gate', cast: 'trailer',
    eyebrow: 'BAB I · GERBANG ABU', title: 'GERBANG ABU',
    accent: ['#0b0a0c', '#2a2118', '#e8b45a'],
    narration: 'Gerbang Abu sudah lama menunggu seseorang yang berani pulang.',
  },
  {
    id: 'warden', at: 10, duration: 5, icon: 'duel', cast: 'warden',
    eyebrow: 'SIR MORDRAKE · THE FALLEN WARDEN', title: 'PENJAGA YANG JATUH',
    accent: ['#0d0b10', '#3a2320', '#f0704d'],
    narration: 'Aku menjaga gerbang ini bahkan setelah aku lupa untuk apa.',
  },
  {
    id: 'mycelial', at: 15, duration: 5, icon: 'cave', cast: 'trailer',
    eyebrow: 'CABANG · MYCELIAL HOLLOW', title: 'TAMAN SPORA',
    accent: ['#07100c', '#12301f', '#8ad48a'],
    narration: 'Di bawah akar, hutan lain tumbuh dari nama-nama yang gugur.',
  },
  {
    id: 'cistern', at: 20, duration: 5, icon: 'tide', cast: 'tidebound',
    eyebrow: 'BAB IX · TIDEWROUGHT CISTERN', title: 'SISTERN AIR PASANG',
    accent: ['#05131a', '#123844', '#6fd3dd'],
    narration: 'Air tidak pernah kehilangan apa yang pernah ia ambil.',
  },
  {
    id: 'lanternwake', at: 25, duration: 5, icon: 'lantern', cast: 'wickbearer',
    eyebrow: 'BAB X · THE LANTERNWAKE', title: 'SEMBILAN SUMBU',
    accent: ['#120b06', '#3a2412', '#ffc25a'],
    narration: 'Sembilan lentera jatuh. Yang terakhir masih menyala di tanganku.',
  },
  {
    id: 'faewood', at: 30, duration: 5, icon: 'dragon', cast: 'trailer',
    eyebrow: 'TAMAN PERI · FAEWOOD', title: 'SYLVARA',
    accent: ['#0a0a18', '#26224a', '#c9a6ff'],
    narration: 'Langit retak bukan karena kau, tetapi karena ia mengizinkannya.',
  },
  {
    id: 'fallen', at: 35, duration: 5, icon: 'sky', cast: 'trailer',
    eyebrow: 'ARC II · THE FALLEN ONES', title: 'LANGIT YANG TURUN',
    accent: ['#0b0f18', '#22314a', '#ffe6a8'],
    narration: 'Mereka turun sebagai cahaya, lalu tinggal sebagai beban.',
  },
  {
    id: 'crusade', at: 40, duration: 5, icon: 'siege', cast: 'trailer',
    eyebrow: 'ARC III · THE RADIANT CRUSADE', title: 'PERANG SUMPAH',
    accent: ['#120c0a', '#40261a', '#ffd479'],
    narration: 'Kemah perang menyala lagi, dan rantai keberanian menuntut dibayar.',
  },
  {
    id: 'pirates', at: 45, duration: 5, icon: 'ship', cast: 'trailer',
    eyebrow: 'PIRATE TIDE · OPEN SEA', title: 'PASANG TERBUKA',
    accent: ['#04121a', '#0f3546', '#79e0d0'],
    narration: 'Sepuluh rute, sepuluh kapten, dan laut yang tidak menghitung mayat.',
  },
  {
    id: 'wave', at: 50, duration: 4.5, icon: 'castle', cast: 'trailer',
    eyebrow: 'WAVE DEFENSE · THE LAST RAMPART', title: 'BENTENG TERAKHIR',
    accent: ['#0b0d12', '#2a3244', '#9fc4ff'],
    narration: 'Dua belas menara. Dua puluh empat gelombang. Satu pintu.',
  },
  {
    id: 'moba', at: 54.5, duration: 4.5, icon: 'arena', cast: 'trailer',
    eyebrow: 'RIFTWAR · MOBA 5V5', title: 'DUA PULUH DELAPAN PENJAGA',
    accent: ['#0d0714', '#2f1846', '#c07bff'],
    narration: 'Tiga jalur, dua nexus, dan tidak ada alasan untuk mundur.',
  },
  {
    id: 'scary', at: 59, duration: 5, icon: 'ghost', cast: 'ghost',
    eyebrow: 'SCARY MODE · THE MOURNING CHOIR', title: 'DELAPAN HANTU',
    accent: ['#08080a', '#1c1a22', '#d9d2c4'],
    narration: 'Jangan menoleh. Jangan menghitung jari. Jangan menjawab.',
  },
  {
    id: 'blackveil', at: 64, duration: 5, icon: 'mansion', cast: 'ghost',
    eyebrow: '3D SCARY MODE · BLACKVEIL NIGHTFALL', title: 'MALAM TANPA CAHAYA',
    accent: ['#0a0912', '#241c33', '#b58cff'],
    narration: 'Lima gedung. Tiga fase. Sesuatu yang tidak bisa kau bunuh.',
  },
  {
    id: 'montage', at: 69, duration: 5, icon: 'montage', cast: 'trailer',
    eyebrow: 'SEBELAS BAB · LIMA BELAS PENJAGA', title: 'SATU SUMPAH',
    accent: ['#0b0908', '#2a1d16', '#f0c070'],
    narration: 'Setiap jalan yang kau ambil menambah satu nama pada sumpah ini.',
  },
  {
    id: 'endcard', at: 74, duration: 6, icon: 'card', cast: 'narrator',
    eyebrow: 'ASHEN VOW', title: 'MULAI PERJALANAN',
    accent: ['#050505', '#1a1208', '#e8c27a'],
    narration: 'Ashen Vow. Sumpah yang tidak bisa ditarik kembali.',
  },
];

export const TRAILER_SHOT_BY_ID = Object.fromEntries(TRAILER_SHOTS.map((shot) => [shot.id, shot]));

export function trailerDuration() {
  const last = TRAILER_SHOTS[TRAILER_SHOTS.length - 1];
  return last.at + last.duration;
}

export function trailerShotIndexAt(time) {
  const t = Math.max(0, Math.min(trailerDuration() - 1e-6, Number(time) || 0));
  let index = 0;
  for (let i = 0; i < TRAILER_SHOTS.length; i += 1) {
    if (t >= TRAILER_SHOTS[i].at) index = i;
  }
  return index;
}

export function trailerShotAt(time) {
  const t = Math.max(0, Math.min(trailerDuration(), Number(time) || 0));
  const index = trailerShotIndexAt(t);
  const shot = TRAILER_SHOTS[index];
  const local = t - shot.at;
  return {
    index,
    count: TRAILER_SHOTS.length,
    shot,
    local,
    progress: Math.max(0, Math.min(1, local / shot.duration)),
    overall: t / trailerDuration(),
  };
}

export function trailerNarrationAt(time) {
  return trailerShotAt(time).shot.narration;
}

export function trailerSummary() {
  return {
    shots: TRAILER_SHOTS.length,
    duration: trailerDuration(),
    modes: new Set(TRAILER_SHOTS.map((shot) => shot.icon)).size,
    cast: new Set(TRAILER_SHOTS.map((shot) => shot.cast)).size,
    schema: TRAILER_SCHEMA_VERSION,
  };
}

// ── deterministic rendering ───────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

function gradient(ctx, w, h, [top, mid, low]) {
  const g = ctx.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, top);
  g.addColorStop(0.58, mid);
  g.addColorStop(1, low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function spacedText(ctx, text, x, y, { size = 26, weight = 700, color = '#f4e8d0', spacing = 6, align = 'center', family = 'Georgia, serif' } = {}) {
  const chars = [...String(text)];
  ctx.font = `${weight} ${size}px ${family}`;
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((sum, value) => sum + value, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  chars.forEach((char, i) => {
    ctx.fillText(char, cursor, y);
    cursor += widths[i] + spacing;
  });
  return total;
}

// A single seeded ember field; identical on every replay so captures match.
function embers(ctx, w, h, time, color) {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < 46; i += 1) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const frac = seed - Math.floor(seed);
    const x = ((frac * 1.7 + time * (0.01 + frac * 0.02)) % 1) * w;
    const drift = Math.sin(time * 0.8 + i) * 12;
    const y = h - (((frac * 0.9 + time * (0.04 + frac * 0.05)) % 1) * h * 0.92);
    const size = 1 + (i % 3);
    ctx.globalAlpha = 0.18 + (i % 5) * 0.08;
    ctx.beginPath();
    ctx.arc(x + drift, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function silhouette(ctx, icon, w, h, time, glow) {
  const cx = w / 2;
  const base = h * 0.82;
  ctx.save();
  ctx.fillStyle = 'rgba(6,6,8,0.72)';
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;

  const tower = (x, width, height) => {
    ctx.fillRect(x - width / 2, base - height, width, height);
  };
  const spire = (x, width, height) => {
    ctx.beginPath();
    ctx.moveTo(x - width / 2, base);
    ctx.lineTo(x - width / 4, base - height);
    ctx.lineTo(x + width / 4, base - height);
    ctx.lineTo(x + width / 2, base);
    ctx.closePath();
    ctx.fill();
  };

  switch (icon) {
    case 'ident':
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, h * 0.42, Math.min(w, h) * 0.16, 0.35 + time * 0.2, Math.PI * 1.85 + time * 0.2);
      ctx.stroke();
      break;
    case 'gate':
      ctx.fillRect(cx - w * 0.14, base - h * 0.36, w * 0.09, h * 0.36);
      ctx.fillRect(cx + w * 0.05, base - h * 0.36, w * 0.09, h * 0.36);
      ctx.beginPath();
      ctx.arc(cx, base - h * 0.36, w * 0.115, Math.PI, 0);
      ctx.lineWidth = 12;
      ctx.stroke();
      break;
    case 'duel':
      ctx.fillRect(cx - w * 0.02, base - h * 0.34, w * 0.04, h * 0.34);
      ctx.beginPath();
      ctx.arc(cx, base - h * 0.38, w * 0.028, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.01, base - h * 0.3);
      ctx.lineTo(cx + w * 0.16, base - h * 0.62);
      ctx.lineWidth = 4;
      ctx.stroke();
      break;
    case 'cave':
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.arc(cx + (i - 1) * w * 0.2, base, w * 0.14, Math.PI, 0);
        ctx.lineWidth = 8;
        ctx.stroke();
      }
      break;
    case 'tide':
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        const y = base - i * h * 0.06;
        for (let x = 0; x <= w; x += 14) {
          const wave = Math.sin(x * 0.01 + time * 1.1 + i) * 10;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 - i * 0.08;
        ctx.stroke();
      }
      break;
    case 'lantern':
      for (let i = 0; i < 5; i += 1) {
        const x = cx + (i - 2) * w * 0.13;
        const swing = Math.sin(time * 1.4 + i) * 8;
        ctx.beginPath();
        ctx.moveTo(x, base - h * 0.62);
        ctx.lineTo(x + swing, base - h * 0.44);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + swing, base - h * 0.41, 9, 0, Math.PI * 2);
        ctx.globalAlpha = i === 2 ? 0.95 : 0.45;
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      break;
    case 'dragon':
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx, base - h * 0.3);
        ctx.quadraticCurveTo(cx + side * w * 0.3, base - h * 0.7, cx + side * w * 0.46, base - h * 0.34);
        ctx.quadraticCurveTo(cx + side * w * 0.24, base - h * 0.46, cx, base - h * 0.36);
        ctx.globalAlpha = 0.7;
        ctx.fill();
      }
      break;
    case 'sky':
      for (let i = 0; i < 5; i += 1) spire(cx + (i - 2) * w * 0.12, w * 0.07, h * (0.24 + (i % 3) * 0.08));
      break;
    case 'siege':
      for (let i = 0; i < 4; i += 1) {
        const x = cx + (i - 1.5) * w * 0.17;
        tower(x, w * 0.06, h * (0.2 + (i % 2) * 0.08));
        ctx.beginPath();
        ctx.moveTo(x, base - h * 0.3);
        ctx.lineTo(x + w * 0.05, base - h * 0.26);
        ctx.lineTo(x, base - h * 0.22);
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(6,6,8,0.72)';
      }
      break;
    case 'ship':
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.2, base - h * 0.08);
      ctx.lineTo(cx + w * 0.2, base - h * 0.08);
      ctx.lineTo(cx + w * 0.14, base);
      ctx.lineTo(cx - w * 0.15, base);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - w * 0.01, base - h * 0.46, 5, h * 0.38);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx, base - h * 0.44);
        ctx.quadraticCurveTo(cx + side * w * 0.18, base - h * 0.4, cx + side * w * 0.17, base - h * 0.16);
        ctx.lineTo(cx, base - h * 0.2);
        ctx.globalAlpha = 0.55;
        ctx.fill();
      }
      break;
    case 'castle':
      tower(cx - w * 0.2, w * 0.11, h * 0.3);
      tower(cx + w * 0.2, w * 0.11, h * 0.3);
      ctx.fillRect(cx - w * 0.14, base - h * 0.18, w * 0.28, h * 0.18);
      for (let i = 0; i < 3; i += 1) ctx.fillRect(cx - w * 0.12 + i * w * 0.1, base - h * 0.22, w * 0.05, h * 0.05);
      break;
    case 'arena':
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + side * w * 0.34, base);
        ctx.lineTo(cx + side * w * 0.06, base - h * 0.5);
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, base - h * 0.3, w * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      break;
    case 'ghost':
      for (let i = 0; i < 4; i += 1) {
        const x = cx + (i - 1.5) * w * 0.15;
        const bob = Math.sin(time * 0.9 + i) * 6;
        ctx.globalAlpha = 0.25 + i * 0.14;
        ctx.beginPath();
        ctx.moveTo(x - 15, base);
        ctx.quadraticCurveTo(x - 18, base - h * 0.3 + bob, x, base - h * 0.36 + bob);
        ctx.quadraticCurveTo(x + 18, base - h * 0.3 + bob, x + 15, base);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = glow;
        ctx.fillRect(x - 7, base - h * 0.32 + bob, 3, 3);
        ctx.fillRect(x + 4, base - h * 0.32 + bob, 3, 3);
        ctx.fillStyle = 'rgba(6,6,8,0.72)';
      }
      break;
    case 'mansion':
      ctx.fillRect(cx - w * 0.2, base - h * 0.26, w * 0.4, h * 0.26);
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.24, base - h * 0.26);
      ctx.lineTo(cx, base - h * 0.44);
      ctx.lineTo(cx + w * 0.24, base - h * 0.26);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.35 + (i % 2) * 0.3;
        ctx.fillRect(cx - w * 0.12 + i * w * 0.1, base - h * 0.18, w * 0.03, h * 0.05);
      }
      break;
    case 'montage':
      for (let i = 0; i < 12; i += 1) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const bw = w * 0.18;
        const bh = h * 0.14;
        const bx = cx - w * 0.3 + col * w * 0.2;
        const by = base - h * 0.34 + row * h * 0.16;
        ctx.globalAlpha = 0.18 + ((i * 7) % 5) * 0.08;
        ctx.fillRect(bx, by, bw, bh);
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
      }
      break;
    default:
      ctx.beginPath();
      ctx.arc(cx, base - h * 0.24, w * 0.1, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
  }
  ctx.restore();

  // Ground haze so silhouettes sit on something.
  const haze = ctx.createLinearGradient(0, base, 0, h);
  haze.addColorStop(0, 'rgba(0,0,0,0)');
  haze.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, base, w, h - base);
}

/**
 * Draw one trailer frame. Deterministic in `time`, so a capture of t = 12.5 is
 * identical on every run.
 */
export function drawTrailerFrame(ctx, w, h, time, opts = {}) {
  const { shot, index, count, progress } = trailerShotAt(time);
  const [top, mid, low] = shot.accent;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  gradient(ctx, w, h, [top, mid, low]);
  silhouette(ctx, shot.icon, w, h, time, low);
  embers(ctx, w, h, time, low);

  // Vignette
  const vignette = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h * 0.45, h * 0.95);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Letterbox
  const bar = Math.round(h * 0.085);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, bar);
  ctx.fillRect(0, h - bar, w, bar);

  const fade = Math.min(1, progress * 6, (1 - progress) * 6);
  ctx.globalAlpha = Math.max(0, Math.min(1, fade));

  spacedText(ctx, shot.eyebrow, w / 2, bar + h * 0.075, {
    size: Math.round(h * 0.026), weight: 600, color: low, spacing: 4,
  });
  spacedText(ctx, shot.title, w / 2, h * 0.53, {
    size: Math.round(h * 0.082), weight: 700, color: '#f6eddc', spacing: 8,
  });

  ctx.globalAlpha = 1;
  // Shot ticks
  const tickWidth = w * 0.6 / count;
  for (let i = 0; i < count; i += 1) {
    const x = w * 0.2 + i * tickWidth;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, h - bar - 14, tickWidth - 3, 2);
    ctx.fillStyle = i < index ? 'rgba(232,194,122,0.85)' : i === index ? '#f6eddc' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, h - bar - 14, i === index ? (tickWidth - 3) * progress : i < index ? tickWidth - 3 : 0, 2);
  }
  if (opts.timecode !== false) {
    ctx.font = '500 12px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(246,237,220,0.55)';
    ctx.textAlign = 'right';
    ctx.fillText(`${String(Math.floor(time / 60)).padStart(2, '0')}:${String(Math.floor(time % 60)).padStart(2, '0')}`, w * 0.8 - 8, h - bar - 22);
    ctx.textAlign = 'left';
  }
  ctx.restore();
  return { shot, index, count, progress };
}
