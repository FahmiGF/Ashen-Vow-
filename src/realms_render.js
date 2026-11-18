// Ashen Vow — Infinite Realms renderer. Read-only canvas presentation.
const TAU = Math.PI * 2;

function rounded(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, stroke = 'rgba(220,190,130,0.18)', fill = 'rgba(8,10,10,0.72)') {
  ctx.fillStyle = fill;
  rounded(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function background(ctx, width, height, top = '#080b12', bottom = '#171022', accent = '#9fc8ff') {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.55, height * 0.35, 8, width * 0.55, height * 0.35, width * 0.55);
  glow.addColorStop(0, `${accent}22`);
  glow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  for (let x = 0; x < width; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}

function label(ctx, text, x, y, color = '#e8d6b0', size = 10, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Cinzel, Georgia, serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function riftfall(ctx, run, width, height, time) {
  background(ctx, width, height, '#080512', '#1a0e2e', '#b78cff');
  const p = run.player;
  // Arena ring and changing hazard.
  ctx.strokeStyle = run.hazard === 'void' ? 'rgba(183,140,255,0.28)' : run.hazard === 'frost' ? 'rgba(142,232,224,0.23)' : 'rgba(255,120,80,0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(width / 2, height / 2, 220 + Math.sin(time * 0.8) * 12, 0, TAU); ctx.stroke();
  for (let i = 0; i < 30; i += 1) {
    const x = (i * 193 + 41) % width;
    const y = (i * 97 + 29) % height;
    const alpha = 0.18 + 0.18 * Math.sin(time * 1.4 + i);
    ctx.fillStyle = `rgba(220,190,255,${alpha})`;
    ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 2 : 1, 0, TAU); ctx.fill();
  }
  for (const enemy of run.enemies || []) {
    if (enemy.hp <= 0) continue;
    const radius = enemy.boss ? 26 : enemy.elite ? 17 : 9;
    ctx.fillStyle = enemy.hitTimer > 0 ? '#ffffff' : enemy.color;
    ctx.beginPath(); ctx.arc(enemy.x, enemy.y, radius, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.stroke();
    if (enemy.boss || enemy.elite) {
      ctx.strokeStyle = enemy.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(enemy.x, enemy.y, radius + 6 + Math.sin(time * 3) * 2, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(enemy.x - 18, enemy.y - radius - 11, 36, 3);
    ctx.fillStyle = '#7be08a';
    ctx.fillRect(enemy.x - 18, enemy.y - radius - 11, 36 * Math.max(0, enemy.hp / Math.max(1, enemy.maxHp)), 3);
  }
  // Player.
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(time * 0.8);
  ctx.fillStyle = p.dash > 0 ? '#e8d6ff' : '#8ee8ff';
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(13, 0); ctx.lineTo(0, 18); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(142,232,255,0.15)';
  ctx.beginPath(); ctx.arc(p.x, p.y, p.range, 0, TAU); ctx.stroke();
  panel(ctx, 16, 14, 290, 38);
  label(ctx, `RIFTFALL · WAVE ${run.wave}/${run.waveTotal}`, 28, 28, '#e8d6ff', 9);
  label(ctx, `${run.hazard.toUpperCase()} · SCORE ${run.score}`, 28, 42, '#a9a0c0', 8);
  panel(ctx, width - 190, 14, 174, 38);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(width - 176, 36, 146, 6);
  ctx.fillStyle = p.hp > p.maxHp * 0.3 ? '#7be08a' : '#ff7a6a';
  ctx.fillRect(width - 176, 36, 146 * Math.max(0, p.hp / Math.max(1, p.maxHp)), 6);
  label(ctx, `HP ${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`, width - 176, 25, '#d8d0e0', 8);
  if (run.phase === 'upgrade') {
    ctx.fillStyle = 'rgba(3,4,8,0.76)';
    ctx.fillRect(0, 0, width, height);
    label(ctx, 'PILIH UPGRADE RIFT', width / 2, height * 0.36, '#ffe4a8', 20, 'center');
    run.upgradeChoices.forEach((choice, index) => {
      const x = width * 0.2 + index * width * 0.24;
      panel(ctx, x, height * 0.45, width * 0.2, 118, 'rgba(224,177,105,0.45)', 'rgba(32,24,40,0.95)');
      label(ctx, choice.name, x + 12, height * 0.45 + 24, '#f4e4c3', 10);
      ctx.fillStyle = '#a99ac0';
      ctx.font = '9px Cinzel, Georgia, serif';
      ctx.textAlign = 'left';
      const words = choice.desc.split(' ');
      let line = '';
      let yy = height * 0.45 + 49;
      for (const word of words) {
        if ((line + word).length > 24) { ctx.fillText(line, x + 12, yy); line = word; yy += 14; } else line += `${line ? ' ' : ''}${word}`;
      }
      if (line) ctx.fillText(line, x + 12, yy);
      label(ctx, `[${index + 1}]`, x + width * 0.1, height * 0.45 + 94, '#ffd166', 11, 'center');
    });
  }
  if (run.phase === 'intermission') {
    label(ctx, `GELOMBANG ${run.wave + 1} DALAM ${Math.max(0, run.waveTimer).toFixed(1)}`, width / 2, height - 34, '#e8d6ff', 10, 'center');
  }
}

function relic(ctx, run, width, height, time) {
  background(ctx, width, height, '#110d07', '#24170a', '#e0b56a');
  // Ruin pillars.
  for (let i = 0; i < 8; i += 1) {
    const x = 50 + i * 116;
    const h = 90 + (i * 37) % 130;
    ctx.fillStyle = i % 2 ? 'rgba(80,58,32,0.55)' : 'rgba(55,40,24,0.6)';
    ctx.fillRect(x, height - h - 60, 26, h);
    ctx.fillStyle = 'rgba(224,181,106,0.12)';
    ctx.fillRect(x + 4, height - h - 52, 18, 4);
  }
  const layers = run.maxLayer;
  for (let layer = 1; layer <= layers; layer += 1) {
    const x = 110 + layer * 152;
    ctx.strokeStyle = 'rgba(224,181,106,0.12)';
    ctx.beginPath(); ctx.arc(x, height * 0.52, 90, 0, TAU); ctx.stroke();
    label(ctx, `L${layer}`, x, height * 0.52 - 104, '#8d7551', 7, 'center');
  }
  const startX = 110 + run.layer * 152;
  label(ctx, 'YOU', startX, height * 0.52 + 64, '#ffe4a8', 8, 'center');
  ctx.fillStyle = '#ffe4a8';
  ctx.beginPath(); ctx.arc(startX, height * 0.52 + 50, 5, 0, TAU); ctx.fill();
  run.choices.forEach((choice, index) => {
    const x = startX + 126 + index * 92;
    const y = height * 0.52 - 30 + (index % 2) * 45;
    const active = choice.type === 'extraction';
    ctx.fillStyle = active ? 'rgba(255,210,110,0.16)' : 'rgba(12,12,12,0.8)';
    ctx.strokeStyle = active ? '#ffd166' : 'rgba(224,181,106,0.3)';
    rounded(ctx, x, y, 78, 66, 4); ctx.fill(); ctx.stroke();
    label(ctx, choice.glyph, x + 39, y + 18, active ? '#ffe4a8' : '#d8b06a', 15, 'center');
    label(ctx, choice.type.toUpperCase(), x + 39, y + 42, '#c8b088', 6, 'center');
    label(ctx, String(index + 1), x + 39, y + 57, '#817051', 7, 'center');
  });
  panel(ctx, 16, 14, 280, 44);
  label(ctx, 'RELIC EXPEDITION', 28, 28, '#ffe0a0', 9);
  label(ctx, `LAYER ${run.layer}/${run.maxLayer} · RELICS ${run.relics.length} · ALARM ${run.alarm}`, 28, 43, '#b39a72', 7);
  panel(ctx, width - 210, 14, 194, 52);
  label(ctx, `HP ${Math.max(0, Math.ceil(run.player.hp))}/${run.player.maxHp}`, width - 196, 30, '#e8d6b0', 8);
  label(ctx, `SCORE ${run.score}`, width - 196, 48, '#b8e8c0', 8);
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i < run.relics.length ? '#e8c480' : 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.arc(28 + i * 16, 76, 5, 0, TAU); ctx.fill();
  }
}

function bastion(ctx, run, width, height, time) {
  background(ctx, width, height, '#070d11', '#14242c', '#8fc7e8');
  const laneY = [190, 300, 410];
  for (let lane = 0; lane < 3; lane += 1) {
    const y = laneY[lane];
    ctx.fillStyle = run.lane === lane ? 'rgba(143,199,232,0.1)' : 'rgba(255,255,255,0.025)';
    ctx.fillRect(36, y - 38, width - 72, 76);
    ctx.strokeStyle = 'rgba(143,199,232,0.14)';
    ctx.beginPath(); ctx.moveTo(40, y + 38); ctx.lineTo(width - 40, y + 38); ctx.stroke();
    label(ctx, `LANE ${lane + 1}`, 56, y - 22, run.lane === lane ? '#c8f0ff' : '#607888', 7);
    if (run.lanes[lane].hero) {
      ctx.fillStyle = '#8ee8e0';
      ctx.beginPath(); ctx.arc(175, y, 13, 0, TAU); ctx.fill();
      label(ctx, 'HERO', 175, y + 26, '#8ee8e0', 6, 'center');
    }
    for (const tower of (run.towers || []).filter((entry) => entry.lane === lane)) {
      const tx = 265 + (tower.id % 2) * 42;
      ctx.fillStyle = tower.def.color;
      ctx.fillRect(tx - 11, y - 25, 22, 34);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(tx - 8, y - 21, 16, 7);
      label(ctx, `L${tower.level}`, tx, y + 22, tower.def.color, 6, 'center');
    }
    for (const enemy of (run.enemies || []).filter((entry) => entry.lane === lane)) {
      const ex = 160 + enemy.progress * (width - 270);
      const size = enemy.boss ? 19 : enemy.slow > 0 ? 8 : 5;
      ctx.fillStyle = enemy.boss ? '#ffb070' : enemy.slow > 0 ? '#8ee8e0' : '#d87860';
      ctx.beginPath(); ctx.arc(ex, y, size, 0, TAU); ctx.fill();
      if (enemy.boss) label(ctx, 'SIEGE', ex, y - 28, '#ffb070', 6, 'center');
    }
  }
  // Castle.
  ctx.fillStyle = '#2a3036';
  ctx.fillRect(width - 110, 140, 76, 310);
  ctx.fillStyle = '#343b42';
  ctx.fillRect(width - 124, 164, 22, 270);
  ctx.fillRect(width - 42, 164, 22, 270);
  ctx.fillStyle = '#8fc7e8';
  ctx.fillRect(width - 92, 180, 5, 8);
  panel(ctx, 16, 14, 290, 42);
  label(ctx, 'LAST BASTION', 28, 28, '#d8f4ff', 9);
  label(ctx, `WAVE ${run.wave}/${run.waveTotal} · GOLD ${run.gold} · SCORE ${run.score}`, 28, 43, '#8fb0c0', 7);
  panel(ctx, width - 230, 14, 214, 52);
  const ratio = run.castle.hp / Math.max(1, run.castle.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(width - 216, 44, 186, 7);
  ctx.fillStyle = ratio > 0.35 ? '#7be08a' : '#ff7a6a';
  ctx.fillRect(width - 216, 44, 186 * Math.max(0, ratio), 7);
  label(ctx, `CASTLE ${Math.max(0, Math.ceil(run.castle.hp))}/${run.castle.maxHp}`, width - 216, 28, '#d8f4ff', 8);
  if (run.waveState === 'prep') label(ctx, `GELOMBANG ${run.wave + 1} DALAM ${Math.max(0, run.waveTimer).toFixed(1)}`, width / 2, height - 24, '#b8e0ff', 9, 'center');
  if (run.phase === 'victory') label(ctx, 'BENTENG BERTAHAN', width / 2, height - 24, '#ffe4a8', 14, 'center');
  if (run.phase === 'defeat') label(ctx, 'GERBANG TERBELAH', width / 2, height - 24, '#ff9a8b', 14, 'center');
}

function maze(ctx, run, width, height, time) {
  background(ctx, width, height, '#060d08', '#122016', '#99d6a4');
  const cell = Math.min(42, (height - 90) / run.size);
  const ox = width / 2 - (cell * run.size) / 2;
  const oy = 66;
  for (let y = 0; y < run.size; y += 1) {
    for (let x = 0; x < run.size; x += 1) {
      const px = ox + x * cell;
      const py = oy + y * cell;
      const wall = run.walls.has(`${x},${y}`);
      ctx.fillStyle = wall ? 'rgba(42,70,48,0.92)' : 'rgba(10,24,14,0.5)';
      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      ctx.strokeStyle = wall ? 'rgba(120,180,130,0.18)' : 'rgba(80,130,90,0.12)';
      ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
    }
  }
  for (const key of run.keyCells) {
    if (key.taken) continue;
    const px = ox + key.x * cell + cell / 2;
    const py = oy + key.y * cell + cell / 2;
    label(ctx, '✦', px, py, '#ffe08a', 15, 'center');
  }
  const ex = ox + run.exit.x * cell + cell / 2;
  const ey = oy + run.exit.y * cell + cell / 2;
  ctx.strokeStyle = run.keys >= 3 ? '#ffe08a' : '#587a60';
  ctx.lineWidth = 2;
  ctx.strokeRect(ex - 11, ey - 11, 22, 22);
  label(ctx, 'EXIT', ex, ey + 20, run.keys >= 3 ? '#ffe08a' : '#587a60', 6, 'center');
  const px = ox + run.player.x * cell + cell / 2;
  const py = oy + run.player.y * cell + cell / 2;
  ctx.fillStyle = '#8ee8c0';
  ctx.beginPath(); ctx.arc(px, py, cell * 0.25, 0, TAU); ctx.fill();
  const qx = ox + run.pursuer.x * cell + cell / 2;
  const qy = oy + run.pursuer.y * cell + cell / 2;
  ctx.fillStyle = '#ff8a7a';
  ctx.beginPath(); ctx.arc(qx, qy, cell * 0.24 + Math.sin(time * 4) * 1.5, 0, TAU); ctx.fill();
  panel(ctx, 16, 14, 300, 42);
  label(ctx, 'ECHO MAZE', 28, 28, '#dbffdf', 9);
  label(ctx, `KEYS ${run.keys}/3 · STEPS ${run.steps} · ALARM ${Math.max(0, run.shiftAt - (run.steps % run.shiftAt))}`, 28, 43, '#7fa889', 7);
  label(ctx, `SCORE ${run.score}`, width - 22, 28, '#c8e8cc', 8, 'right');
}

function duel(ctx, run, width, height, time) {
  background(ctx, width, height, '#120708', '#2a0e12', '#e8a0a0');
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath(); ctx.ellipse(width / 2, height * 0.7, 300, 92, 0, 0, TAU); ctx.fill();
  const px = width * 0.3;
  const sx = width * 0.7;
  const py = height * 0.58;
  // Player.
  ctx.fillStyle = '#d8f4ff';
  ctx.beginPath(); ctx.arc(px, py - 54, 17, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5d8798';
  ctx.fillRect(px - 18, py - 32, 36, 58);
  ctx.strokeStyle = '#d8f4ff';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(px + 18, py - 12); ctx.lineTo(px + 58, py - 44); ctx.stroke();
  // Shadow mirror.
  ctx.fillStyle = 'rgba(30,8,14,0.92)';
  ctx.beginPath(); ctx.arc(sx, py - 54, 17, 0, TAU); ctx.fill();
  ctx.fillRect(sx - 18, py - 32, 36, 58);
  ctx.strokeStyle = '#ff8a8a';
  ctx.beginPath(); ctx.moveTo(sx - 18, py - 12); ctx.lineTo(sx - 58, py - 44); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,138,138,0.3)';
  ctx.beginPath(); ctx.arc(sx, py - 54, 29 + Math.sin(time * 3) * 2, 0, TAU); ctx.stroke();
  panel(ctx, 16, 14, 300, 54);
  label(ctx, 'SHADOW DUEL', 28, 28, '#ffdada', 9);
  label(ctx, `ROUND ${run.round}/${run.maxRounds} · SCORE ${run.score}`, 28, 43, '#c08a92', 7);
  panel(ctx, 16, height - 100, width - 32, 82, 'rgba(232,160,160,0.22)', 'rgba(15,6,8,0.82)');
  label(ctx, `SHADOW INTENT: ${String(run.telegraph || 'attack').toUpperCase()}`, width / 2, height - 78, '#ffb0a8', 10, 'center');
  label(ctx, run.log[run.log.length - 1]?.text || 'Pilih aksi duel.', width / 2, height - 54, '#bca0a0', 8, 'center');
  // HP bars.
  const drawBar = (x, y, w, ratio, color) => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, ratio), 6);
  };
  drawBar(34, 84, 210, run.player.hp / Math.max(1, run.player.maxHp), '#8ee8c0');
  drawBar(width - 244, 84, 210, run.shadow.hp / Math.max(1, run.shadow.maxHp), '#ff8a8a');
  label(ctx, `YOU ${Math.max(0, Math.ceil(run.player.hp))}`, 34, 76, '#8ee8c0', 7);
  label(ctx, `${Math.max(0, Math.ceil(run.shadow.hp))} SHADOW`, width - 244, 76, '#ff8a8a', 7);
}

function chrono(ctx, run, width, height, time) {
  background(ctx, width, height, '#040c0e', '#0d2428', '#9ad8e0');
  // Time fracture rings.
  for (let i = 0; i < 4; i += 1) {
    ctx.strokeStyle = `rgba(154,216,224,${0.06 + i * 0.02})`;
    ctx.beginPath(); ctx.arc(width / 2, height * 0.58, 80 + i * 54 + Math.sin(time + i) * 6, 0, TAU); ctx.stroke();
  }
  const y = height * 0.72;
  ctx.strokeStyle = 'rgba(154,216,224,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(44, y); ctx.lineTo(width - 44, y); ctx.stroke();
  run.anchors.forEach((anchor, index) => {
    const x = anchor.x;
    ctx.fillStyle = anchor.active ? '#ffe4a8' : 'rgba(20,50,54,0.9)';
    ctx.strokeStyle = anchor.active ? '#ffe4a8' : 'rgba(154,216,224,0.4)';
    ctx.beginPath(); ctx.arc(x, anchor.y, anchor.active ? 13 : 10, 0, TAU); ctx.fill(); ctx.stroke();
    if (anchor.active) {
      ctx.strokeStyle = 'rgba(255,228,168,0.35)';
      ctx.beginPath(); ctx.arc(x, anchor.y, 22 + Math.sin(time * 2 + index) * 3, 0, TAU); ctx.stroke();
    }
    label(ctx, String(index + 1), x, anchor.y + 25, anchor.active ? '#ffe4a8' : '#557a7e', 7, 'center');
  });
  ctx.fillStyle = '#d8fbff';
  ctx.beginPath(); ctx.arc(run.player.x, y - 12, 9, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(216,251,255,0.4)';
  ctx.beginPath(); ctx.arc(run.player.x, y - 12, 16, 0, TAU); ctx.stroke();
  panel(ctx, 16, 14, 300, 54);
  label(ctx, 'CHRONO FRACTURE', 28, 28, '#d8fbff', 9);
  label(ctx, `ANCHORS ${run.activated}/5 · LOOP ${run.maxLoops - run.loops + 1}/${run.maxLoops}`, 28, 43, '#87b8bc', 7);
  panel(ctx, width - 190, 14, 174, 54);
  label(ctx, `${Math.max(0, run.timeLeft).toFixed(1)}s`, width - 176, 31, run.timeLeft < 8 ? '#ff8a7a' : '#d8fbff', 14);
  label(ctx, run.reverse ? 'REVERSED' : 'FORWARD', width - 176, 53, run.reverse ? '#ffb0a8' : '#8ee8c0', 7);
  label(ctx, run.pulse <= 0 ? 'PULSE READY [SPACE]' : `PULSE ${run.pulse.toFixed(1)}`, width / 2, height - 24, run.pulse <= 0 ? '#ffe4a8' : '#557a7e', 8, 'center');
}

export function renderRealm(ctx, run, options = {}) {
  if (!ctx || !run) return;
  const width = options.width || 960;
  const height = options.height || 540;
  const time = options.time || 0;
  ctx.clearRect(0, 0, width, height);
  if (run.modeId === 'riftfall') riftfall(ctx, run, width, height, time);
  else if (run.modeId === 'relic_expedition') relic(ctx, run, width, height, time);
  else if (run.modeId === 'last_bastion') bastion(ctx, run, width, height, time);
  else if (run.modeId === 'echo_maze') maze(ctx, run, width, height, time);
  else if (run.modeId === 'shadow_duel') duel(ctx, run, width, height, time);
  else chrono(ctx, run, width, height, time);
  if (run.phase === 'ended') {
    ctx.fillStyle = 'rgba(2,4,6,0.72)';
    ctx.fillRect(0, 0, width, height);
    const win = run.result === 'victory';
    label(ctx, win ? 'REALM CLEARED' : 'RUN ENDED', width / 2, height * 0.43, win ? '#ffe4a8' : '#ff9a8b', 28, 'center');
    label(ctx, `SCORE ${run.score} · ${run.time.toFixed(1)}s`, width / 2, height * 0.5, '#d8c9aa', 11, 'center');
    label(ctx, win ? 'Menunggu validasi server untuk hadiah eksklusif.' : 'Tidak ada hadiah eksklusif dari kekalahan.', width / 2, height * 0.56, '#9b8c74', 8, 'center');
  }
}
