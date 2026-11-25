// Real-browser smoke for Update XXV: the cinematic trailer, its 16 shots and
// the voice provider negotiation. Runs against the local server so /api/voice
// is reachable even when no ElevenLabs key is configured.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9352;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-trailer-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio', '--window-size=1400,900', BASE,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let seq = 0;
const pending = new Map();
const consoleErrors = [];
let passed = 0;
let failed = 0;

const check = (ok, label) => {
  if (ok) { passed += 1; console.log(`  ✓ ${label}`); } else { failed += 1; console.log(`  ✗ ${label}`); }
};

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (message) => (message.error ? reject(new Error(message.error.message)) : resolve(message.result)));
  ws.send(JSON.stringify({ id, method, params }));
});

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function waitFor(fn, timeout = 25000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(150);
  }
  throw new Error(`timed out: ${label}`);
}

try {
  const pages = await waitFor(async () => {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.some((entry) => entry.type === 'page' && entry.url.startsWith(BASE)) ? list : null;
  }, 20000, 'chrome page');
  const page = pages.find((entry) => entry.type === 'page' && entry.url.startsWith(BASE));
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const cb = pending.get(message.id);
      if (cb) { pending.delete(message.id); cb(message); }
      return;
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    }
    if (message.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await waitFor(() => evaluate('typeof window.__ashen === "object"'), 25000, 'boot');

  const entry = await evaluate(`(() => {
    const a = window.__ashen;
    a.showMenu();
    const button = document.getElementById('btn-trailer-menu');
    return {
      button: !!button,
      hasScreen: !!document.getElementById('trailer-screen'),
      shots: a.trailer.summary.shots,
      duration: a.trailer.duration,
      canvas: !!document.getElementById('trailer-canvas'),
    };
  })()`);
  check(entry.button, 'the title menu exposes TRAILER SINEMATIK');
  check(entry.hasScreen && entry.canvas, 'the trailer screen and canvas exist');
  check(entry.shots === 16, `sixteen shots are registered (${entry.shots})`);
  check(Math.abs(entry.duration - 80) < 0.001, `the cut runs 80 seconds (${entry.duration})`);

  const opened = await evaluate(`(async () => {
    document.getElementById('btn-trailer-menu').click();
    await new Promise((r) => setTimeout(r, 420));
    const a = window.__ashen;
    const canvas = document.getElementById('trailer-canvas');
    const ctx = canvas.getContext('2d');
    const sample = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
    return {
      menuView: a.menuView,
      hidden: document.getElementById('trailer-screen').classList.contains('hidden'),
      titleHidden: document.getElementById('title-screen').classList.contains('hidden'),
      active: a.trailer.active,
      painted: sample[3] > 0,
      shot: document.getElementById('trailer-shot').textContent,
      eyebrow: document.getElementById('trailer-eyebrow').textContent,
      line: document.getElementById('trailer-line').textContent,
      clock: document.getElementById('trailer-time').textContent,
    };
  })()`);
  check(opened.menuView === 'trailer' && !opened.hidden, 'the trailer opens from the real menu button');
  check(opened.titleHidden, 'the title screen gives way to the trailer');
  check(opened.painted, 'the canvas actually renders a frame');
  check(opened.active && opened.shot.startsWith('1 /'), `the first shot is live (${opened.shot})`);
  check(opened.eyebrow.includes('SEALIUSHQ'), `the ident eyebrow is shown (${opened.eyebrow})`);
  check(opened.line.length > 10, 'the narration subtitle is populated');
  check(/^00:0\d \/ 01:20$/.test(opened.clock), `the clock tracks the cut (${opened.clock})`);

  const advanced = await evaluate(`(async () => {
    const a = window.__ashen;
    a.setTrailerTime(31.5);
    await new Promise((r) => setTimeout(r, 60));
    return {
      time: a.trailer.time,
      shot: a.trailer.shot.index,
      eyebrow: document.getElementById('trailer-eyebrow').textContent,
      line: document.getElementById('trailer-line').textContent,
      progress: document.getElementById('trailer-progress').style.width,
      clock: document.getElementById('trailer-time').textContent,
    };
  })()`);
  check(advanced.shot === 6, `seeking lands on the Faewood shot (${advanced.shot})`);
  check(advanced.eyebrow.includes('FAEWOOD'), `the shot title swaps with the cut (${advanced.eyebrow})`);
  check(advanced.line.includes('Langit retak'), 'the narration swaps with the shot');
  check(parseFloat(advanced.progress) > 30, `progress follows the playhead (${advanced.progress})`);
  check(advanced.clock.startsWith('00:31'), `the clock follows the playhead (${advanced.clock})`);

  const paused = await evaluate(`(async () => {
    const a = window.__ashen;
    const before = a.trailer.time;
    document.getElementById('btn-trailer-play').click();
    await new Promise((r) => setTimeout(r, 260));
    const after = a.trailer.time;
    const label = document.getElementById('btn-trailer-play').textContent;
    document.getElementById('btn-trailer-play').click();
    return { before, after, label, paused: a.trailer.paused };
  })()`);
  check(Math.abs(paused.after - paused.before) < 0.02, 'pause freezes the playhead');
  check(paused.label === 'LANJUT', `pause relabels the button (${paused.label})`);

  const voice = await evaluate(`(async () => {
    const a = window.__ashen;
    await a.refreshVoiceStatus();
    const status = a.voice.status;
    const summary = a.voice.summary;
    const badge = a.voice.badge;
    const played = await a.narrate('Sumpah ini tidak bisa ditarik kembali.', 'narrator');
    return {
      configured: status.configured,
      provider: summary.provider,
      badge,
      model: summary.model,
      cast: summary.cast,
      played,
      lines: a.voice.save.linesPlayed,
      engine: document.getElementById('trailer-engine').textContent,
    };
  })()`);
  check(typeof voice.configured === 'boolean', 'the /api/voice status endpoint answers');
  check(voice.cast === 8, `eight cast members are available (${voice.cast})`);
  check(voice.model === 'eleven_multilingual_v2', `the multilingual model is selected (${voice.model})`);
  check(voice.badge.startsWith('SUARA:'), `the voice badge reports a real provider (${voice.badge})`);
  check(['elevenlabs', 'browser', 'none'].includes(voice.provider), `resolution stays honest (${voice.provider})`);
  check(voice.engine.includes('SUARA'), 'the trailer footer shows the active engine');

  const toggle = await evaluate(`(async () => {
    const a = window.__ashen;
    document.getElementById('btn-trailer-voice').click();
    const off = a.voice.summary.provider;
    const label = document.getElementById('btn-trailer-voice').textContent;
    document.getElementById('btn-trailer-voice').click();
    const on = a.voice.summary.provider;
    return { off, on, label };
  })()`);
  check(toggle.off === 'none' && toggle.label === 'SUARA: MATI', 'the voice toggle silences the trailer');
  check(toggle.on !== 'none', `and switching back restores acting (${toggle.on})`);

  const closed = await evaluate(`(async () => {
    const a = window.__ashen;
    a.closeTrailer();
    await new Promise((r) => setTimeout(r, 120));
    return {
      hidden: document.getElementById('trailer-screen').classList.contains('hidden'),
      menuView: a.menuView,
      active: a.trailer.active,
      title: !document.getElementById('title-screen').classList.contains('hidden'),
    };
  })()`);
  check(closed.hidden && !closed.active, 'closing stops the trailer loop');
  check(closed.menuView === 'title' && closed.title, 'closing returns to the title screen');

  const mobile = await evaluate(`(async () => {
    await new Promise((r) => setTimeout(r, 40));
    const before = document.documentElement.scrollWidth;
    window.__ashen.openTrailer();
    await new Promise((r) => setTimeout(r, 160));
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const wide = before - window.innerWidth;
    window.__ashen.closeTrailer();
    return { overflow, wide };
  })()`);
  check(mobile.overflow <= 1, `the trailer does not overflow horizontally (${mobile.overflow}px)`);

  const persisted = await evaluate(`(async () => {
    const a = window.__ashen;
    a.setVoice({ enabled: true, volume: 77 });
    await new Promise((r) => setTimeout(r, 60));
    const raw = JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-voice-v1'));
    a.setVoice({ volume: 85 });
    return { key: !!raw, volume: raw?.volume, enabled: raw?.enabled };
  })()`);
  check(persisted.key && persisted.volume === 77 && persisted.enabled === true, 'the voice preference persists under its own key');

  check(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})`);
  if (consoleErrors.length) console.log(consoleErrors.slice(0, 4).join('\n'));
} finally {
  console.log(`\n${passed} passed, ${failed} failed`);
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  process.exitCode = failed === 0 ? 0 : 1;
}
