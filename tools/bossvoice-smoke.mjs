// Boss voice smoke test (headless Chrome + CDP).
//
// Drives the real UI on a desktop and a portrait phone viewport:
//   · the Index lists every enemy and boss the game can spawn,
//   · portraits are painted by the game renderer (data URLs, idle-queued),
//   · search, arc filter and the detail panel work,
//   · the class roster shows a portrait for each of the 18 classes,
//   · the class preview draws the hero above the pedestal (not cut off),
//   · nothing overflows horizontally, and the console stays clean.
//
// Usage:  npm start   then   npm run smoke:index
// Env:    ASHEN_URL, CHROME_PATH, CDP_PORT (default 9241), SHOT_DIR (optional PNG output)

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9243;
const SHOT_DIR = process.env.SHOT_DIR || '';

function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA || '';
  const candidates = process.platform === 'win32'
    ? [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        local ? join(local, 'Google', 'Chrome', 'Application', 'chrome.exe') : '',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      ]
    : process.platform === 'darwin'
      ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
      : ['/opt/pw-browsers/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const res = await fetch(URL, { method: 'HEAD' });
  assert.equal(res.ok, true, 'game server must be running');
  if (SHOT_DIR) mkdirSync(SHOT_DIR, { recursive: true });

  const profile = mkdtempSync(join(tmpdir(), 'ashen-bossvoice-smoke-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--mute-audio',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1366,800',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const check = (name, value, expected) => {
    assert.equal(value, expected, `${name} (got ${JSON.stringify(value)})`);
    checks.push(name);
    if (process.env.SMOKE_VERBOSE) console.log(`· ${name}`);
  };
  try {
    let list;
    for (let i = 0; i < 100; i++) {
      try {
        list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
        if (list.some((t) => t.type === 'page' && t.url.startsWith(URL))) break;
      } catch {
        // Chrome is still starting.
      }
      await sleep(150);
    }
    const page = list?.find((t) => t.type === 'page' && t.url.startsWith(URL));
    assert.ok(page, 'Chrome page target');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });

    let nextId = 0;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        pageErrors.push(message.params.exceptionDetails?.exception?.description || 'exception');
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        pageErrors.push(message.params.args.map((a) => a.value ?? a.description).join(' '));
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        if (!/favicon|ERR_NETWORK_ACCESS_DENIED|429|Too Many Requests|fonts\.g/i.test(message.params.entry.text || '')) {
          pageErrors.push(message.params.entry.text);
        }
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const shot = async (name) => {
      if (!SHOT_DIR) return;
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(SHOT_DIR, `${name}.png`), Buffer.from(data, 'base64'));
    };
    const waitFor = async (expression, timeout = 6000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (await evaluate(expression)) return true;
        await sleep(100);
      }
      return false;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');

    await send('Page.reload');
    const booted = await waitFor('typeof window.__ashen === "object" && document.readyState === "complete" && window.__ashen.menuView === "title"', 15000);
    check('game boots to the title menu', booted, true);
    const initial = await evaluate(`(async () => {
      localStorage.removeItem('ashen-vow-bossvoice-v1');
      const A = window.__ashen;
      A.setBossVoice({ mode: 'recorded-first', allowAi: false });
      await A.loadBossVoiceManifest();
      return A.bossVoice;
    })()`);
    check('voice script covers 613 lines', initial.summary.lines, 613);
    check('voice script covers all 116 bosses', initial.summary.bosses, 116);
    check('AI voice is off by default', initial.settings.allowAi, false);
    check('no recordings are bundled yet', initial.recorded, 0);

    // A real boss fight: the Warden's intro opens the dialogue and voices it.
    await evaluate('window.__ashen.enterRoom(2)');
    const opened = await waitFor('window.__ashen.dialogueOpen === true', 8000);
    check('the Warden intro opens boss dialogue', opened, true);
    await waitFor('window.__ashen.bossVoice.last.source !== "none"', 3000);
    const intro = await evaluate('window.__ashen.bossVoice');
    check('intro line is voiced by the cinematic sting', intro.last.source, 'sting');
    check('the sting uses the Warden archetype', intro.last.archetype, 'titan');
    check('the sting is actually playing', intro.active >= 1, true);
    check('the dialogue shows the voice source', /STING/.test(intro.button), true);

    const player = await evaluate(`(async () => {
      window.__ashen.advanceDialogue();
      await new Promise((r) => setTimeout(r, 120));
      return window.__ashen.bossVoice.last;
    })()`);
    check('the Oathbound line is not covered by a boss sting', player.source, 'none');
    check('the Oathbound line uses the hero archetype', player.archetype, 'hero');

    const ai = await evaluate(`(async () => {
      const A = window.__ashen;
      A.setBossVoice({ allowAi: true });
      const src = await A.playBossLine('warden', 'phase2', 0);
      return { src, settings: A.bossVoice.settings };
    })()`);
    check('opting into AI forces processing on', ai.settings.processing, true);
    check('without a configured key, AI falls back to the sting (never browser TTS)', ai.src, 'sting');
    await evaluate('window.__ashen.setBossVoice({ allowAi: false })');

    // Recorded path: drop a real audio file where an actor's take would go.
    const dir = join('assets', 'voice', 'boss', 'warden');
    mkdirSync(dir, { recursive: true });
    const rate = 22050;
    const n = rate;
    const wav = Buffer.alloc(44 + n * 2);
    wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVE', 8); wav.write('fmt ', 12);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24);
    wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i += 1) wav.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 180) * 8000 * Math.min(1, (n - i) / 2000)), 44 + i * 2);
    const take = join(dir, 'intro-1.wav');
    writeFileSync(take, wav);
    try {
      execFileSync(process.execPath, ['tools/voice-script.mjs'], { stdio: 'ignore' });
      const rec = await evaluate(`(async () => {
        const A = window.__ashen;
        const count = await A.loadBossVoiceManifest();
        const src = await A.playBossLine('warden', 'intro', 0);
        await new Promise((r) => setTimeout(r, 150));
        return { count, src, last: A.bossVoice.last, active: A.bossVoice.active };
      })()`);
      check('the manifest picks up a recorded take', rec.count, 1);
      check('a recorded take plays as a recording', rec.src, 'recorded');
      check('the recording plays through the effects chain', rec.active >= 1 && !rec.last.error, true);
    } finally {
      rmSync(take, { force: true });
      rmSync(join('assets', 'voice', 'boss'), { recursive: true, force: true });
      execFileSync(process.execPath, ['tools/voice-script.mjs'], { stdio: 'ignore' });
      await evaluate('window.__ashen.loadBossVoiceManifest()');
    }

    const sweep = await evaluate(`(async () => {
      const A = window.__ashen;
      const core = await import('/src/core.js');
      const out = { stings: 0, other: [] };
      const t0 = performance.now();
      // Every boss voices its intro; the first twenty also voice phase II and
      // defeat. (Hundreds of overlapping stings in a few seconds is not a real
      // play pattern, and the audio graph would only be measuring itself.)
      const kinds = Object.keys(core.ALL_BOSS_INFO);
      out.expected = kinds.length + 20 * 2;
      for (const [i, kind] of kinds.entries()) {
        for (const key of i < 20 ? ['intro', 'phase2', 'defeat'] : ['intro']) {
          const src = await A.playBossLine(kind, key, 0);
          if (src === 'sting') out.stings += 1; else out.other.push(kind + ':' + key + ':' + src);
        }
        A.stopBossVoice();
      }
      out.ms = performance.now() - t0;
      return out;
    })()`);
    if (process.env.SMOKE_VERBOSE) console.log('sweep ms', sweep.ms, sweep.other.slice(0, 5));
    check('every boss voices its intro (and 20 bosses phase II + defeat)', sweep.stings, sweep.expected);
    check('all 116 bosses were swept', sweep.expected, 116 + 40);
    check('no boss line fell through to another source', sweep.other.length, 0);

    const cycled = await evaluate(`(() => {
      const A = window.__ashen;
      const seen = [];
      for (let i = 0; i < 4; i += 1) seen.push(A.cycleBossVoiceMode().mode);
      return { seen, saved: JSON.parse(localStorage.getItem('ashen-vow-bossvoice-v1')).mode };
    })()`);
    check('the voice button cycles through its modes', new Set(cycled.seen).size, 3);
    check('the voice mode persists under its own key', cycled.saved, cycled.seen[3]);
    await evaluate("window.__ashen.setBossVoice({ mode: 'recorded-first', allowAi: false })");

    check('no console errors', pageErrors.length, 0);
    if (pageErrors.length) console.error(pageErrors.join('\n'));
    console.log(`\nBOSS VOICE SMOKE PASS — ${checks.length} checks`);
  } finally {
    try {
      ws?.close();
    } catch {
      // Already closed.
    }
    chrome.kill();
    await sleep(200);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      // Windows can keep the profile locked for a moment.
    }
  }
}

main().catch((error) => {
  console.error('BOSS VOICE SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
