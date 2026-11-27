import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const release = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const baseline = process.env.ASHEN_BASELINE_URL;
const samples = Number(process.env.ASHEN_STARTUP_SAMPLES || 7);
const port = Number(process.env.CDP_PORT || 9336);
const browser = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
if (!browser) throw new Error('Set CHROME_PATH to a Chrome, Edge, or Chromium executable.');
if (!Number.isSafeInteger(samples) || samples < 2) throw new Error('Use at least two startup samples.');

async function waitFor(read, label) {
  const until = Date.now() + 20000;
  while (Date.now() < until) {
    const result = await read().catch(() => null);
    if (result) return result;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const profile = mkdtempSync(join(tmpdir(), 'ashen-startup-bench-'));
const chrome = spawn(browser, [
  '--headless=new', '--window-size=1280,900', '--disable-extensions', '--mute-audio',
  ...(process.env.ASHEN_CHROME_NO_SANDBOX === '1' ? ['--no-sandbox'] : []),
  `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, 'about:blank',
], { stdio: 'ignore' });
let ws;
try {
  const page = await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    return (await response.json()).find((target) => target.type === 'page');
  }, 'the browser');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.race([once(ws, 'open'), once(ws, 'error').then(() => { throw new Error('Browser debugger connection failed'); })]);
  let commandId = 0;
  const pending = new Map();
  ws.addEventListener('message', ({ data }) => {
    const { id, result, error } = JSON.parse(data);
    pending.get(id)?.(error, result);
    pending.delete(id);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++commandId;
    pending.set(id, (error, result) => error ? reject(new Error(error.message)) : resolve(result));
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    return result.value;
  };
  await send('Page.enable');
  await send('Network.enable');
  await send('Page.bringToFront');

  async function navigate(url) {
    const previous = await evaluate('performance.timeOrigin');
    const navigation = await send('Page.navigate', { url });
    if (navigation.errorText) throw new Error(navigation.errorText);
    return waitFor(() => evaluate(`(() => {
      const boot = window.__ashenBoot;
      if (!boot?.ready || performance.timeOrigin === ${previous}) return null;
      const resources = performance.getEntriesByType('resource');
      const routes = resources.filter((entry) => new URL(entry.name).origin === location.origin);
      const scripts = routes.filter((entry) => new URL(entry.name).pathname.endsWith('.js'));
      return {
        bootMs: boot.readyAt - boot.startedAt,
        scriptBytes: scripts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
        scriptTransfer: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
        stylesheets: routes.filter((entry) => new URL(entry.name).pathname.endsWith('.css')).length,
      };
    })()`), `Ashen Vow startup at ${url}`);
  }

  async function benchmark(label, url) {
    const summaries = {};
    for (const cacheDisabled of [true, false]) {
      await send('Network.setCacheDisabled', { cacheDisabled });
      await navigate(url);
      const results = [];
      for (let run = 0; run < samples; run += 1) results.push(await navigate(url));
      const times = results.map((entry) => entry.bootMs).sort((a, b) => a - b);
      summaries[cacheDisabled ? 'coldBrowserCache' : 'warmBrowserCache'] = {
        p50BootMs: times[Math.ceil(times.length * 0.5) - 1],
        p95BootMs: times[Math.ceil(times.length * 0.95) - 1],
        scriptTransfer: results.at(-1).scriptTransfer,
        stylesheets: results.at(-1).stylesheets,
        ...(cacheDisabled ? { scriptBytes: results.at(-1).scriptBytes } : {}),
      };
    }
    console.log(JSON.stringify({ label, samples, ...summaries }, null, 2));
  }
  if (baseline) await benchmark('baseline', baseline);
  await benchmark('release', release);
} finally {
  ws?.close();
  if (chrome.exitCode === null) {
    const exited = once(chrome, 'exit');
    chrome.kill();
    await exited;
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 3 }).catch(() => {});
}
