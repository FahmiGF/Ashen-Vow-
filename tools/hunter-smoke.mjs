// Update XIX browser smoke: the persistent hunter shop and real ghost combat.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VERSION, VERSION_RE } from './smoke-version.mjs';

const BASE = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const PORT = Number(process.env.CDP_PORT) || 9353;
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync);
if (!chromePath) throw new Error('Set CHROME_PATH to Chrome or Edge.');

const profile = mkdtempSync(join(tmpdir(), 'ashen-hunter-'));
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader',
  '--use-angle=swiftshader', '--mute-audio', '--window-size=1440,1000', BASE,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let ws;
let seq = 0;
const pending = new Map();
const errors = [];
let checks = 0;

function check(ok, label) {
  if (!ok) throw new Error(`CHECK FAILED: ${label}`);
  checks += 1;
  console.log(`  ✓ ${label}`);
}

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

async function waitFor(fn, timeout = 20000, label = 'condition') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const value = await fn(); if (value) return value; } catch { /* retry */ }
    await sleep(140);
  }
  throw new Error(`timed out: ${label}`);
}

async function attach() {
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
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.exception?.description || 'exception');
    else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
    } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      const text = message.params.entry.text || '';
      const url = message.params.entry.url || '';
      if (!/favicon|429|Too Many Requests/i.test(text) && !(url.includes('fonts.googleapis.com') || /Failed to load resource.*429/.test(text))) errors.push(text);
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');
  await send('Page.bringToFront');
}

try {
  await attach();
  await sleep(1100);
  await waitFor(() => evaluate('typeof window.__ashen === "object" && typeof window.__ashen.hunter === "object"'), 20000, 'hunter boot');

  const boot = await evaluate(`({
    version: window.__ashen.version,
    title: document.title,
    hunter: window.__ashen.hunter,
    shopExists: !!document.getElementById('hunter-shop-screen'),
    pauseEntry: !!document.getElementById('btn-pause-hunter-shop'),
  })`);
  check(VERSION_RE.test(boot.version), `boots v${VERSION} (${boot.version})`);
  check(boot.hunter.marks >= 180, 'a fresh hunter starts with marks');
  check(boot.shopExists && boot.pauseEntry, 'the shop screen and pause entry exist');

  const opened = await evaluate(`(() => {
    window.__ashen.showHunterShop();
    return {
      open: window.__ashen.hunter.shopOpen,
      visible: !document.getElementById('hunter-shop-screen').classList.contains('hidden'),
      cards: document.querySelectorAll('#hunter-shop-items .hunter-card').length,
      marks: document.getElementById('hunter-shop-marks').textContent,
    };
  })()`);
  check(opened.open && opened.visible, 'the hunter shop opens as a real overlay');
  check(opened.cards === 5, `five hunter tools are listed (${opened.cards})`);
  check(Number(opened.marks) >= 180, 'the shop shows the real marks balance');

  const bought = await evaluate(`(() => {
    const a = window.__ashen.buyHunterItem('salt_flare');
    const b = window.__ashen.buyHunterItem('spirit_bane');
    const c = window.__ashen.buyHunterItem('smoke_grenade');
    return { a, b, c, save: JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-hunter-v1')) };
  })()`);
  check(bought.a.ok && bought.b.ok && bought.c.ok, 'three tools can be bought with marks');
  check(bought.save.items.salt_flare === 1 && bought.save.items.spirit_bane === 1 && bought.save.items.smoke_grenade === 1, 'purchases are written to ashen-vow-hunter-v1');
  check(bought.save.marks === 53, `mark economy is exact (${bought.save.marks})`);

  await evaluate(`(() => {
    window.__ashen.closeHunterShop();
    window.__ashen.start(0);
  })()`);
  await sleep(300);
  const started = await evaluate(`window.__ashen.snap()`);
  check(started.view.startedRun && started.hunterItems.salt_flare === 1, 'saved stock is copied into the live run');
  check(started.quickItem.id === 'salt_flare' && started.quickItem.hunter === true, 'a ghost tool becomes the quick item');

  const pauseShop = await evaluate(`(() => {
    window.__ashen.togglePause(true);
    document.getElementById('btn-pause-hunter-shop').click();
    const opened = window.__ashen.hunter.shopOpen && !document.getElementById('hunter-shop-screen').classList.contains('hidden');
    window.__ashen.closeHunterShop();
    const closed = !window.__ashen.hunter.shopOpen;
    window.__ashen.togglePause(false);
    return { opened, closed };
  })()`);
  check(pauseShop.opened && pauseShop.closed, 'the real pause-screen button opens and closes the shop');

  const combat = await evaluate(`(() => {
    const game = window.__ashen.game;
    game.enemies.length = 0;
    game.projectiles.length = 0;
    game.player.x = 100;
    game.player.y = 400;
    game.player.consumeCooldown = 0;
    const ghost = game.spawnScaryEnemy('hollow_wraith', 260);
    ghost.x = 260;
    ghost.hp = ghost.maxHp;
    ghost.stunTimer = 0;
    const before = ghost.hp;
    const salt = game.useHunterItem('salt_flare');
    return {
      salt,
      before,
      hp: ghost.hp,
      stun: ghost.stunTimer,
      mark: ghost.spiritMarkTimer,
      count: game.hunterItemCount('salt_flare'),
    };
  })()`);
  check(combat.salt.ok && combat.hp < combat.before, 'salt flare damages a real scary ghost');
  check(combat.stun > 2 && combat.mark > 0, 'salt flare stuns and marks the ghost');
  check(combat.count === 0, 'using a tool spends exactly one stock');

  const smoke = await evaluate(`(() => {
    const game = window.__ashen.game;
    game.player.consumeCooldown = 0;
    const ghost = game.enemies.find((e) => e.scaryKind === 'hollow_wraith');
    const result = game.useHunterItem('smoke_grenade');
    return { result, stun: ghost.stunTimer, invuln: game.player.invuln };
  })()`);
  check(smoke.result.ok && smoke.stun > 1 && smoke.invuln >= 1.3, 'smoke grenade stuns and grants escape i-frames');

  const shot = await evaluate(`(() => {
    const game = window.__ashen.game;
    game.player.consumeCooldown = 0;
    const ghost = game.enemies.find((e) => e.scaryKind === 'hollow_wraith');
    const result = game.useHunterItem('spirit_bane');
    for (let i = 0; i < 40; i += 1) game.updateProjectiles(1 / 120);
    // Finish the round's target so the bounty path, not the low-HP path, is tested.
    if (!ghost.dead) game.hurtEnemy(ghost, { dmg: 9999, knock: 0, name: 'spirit_bane' }, 1);
    return { result, dead: ghost.dead, hp: ghost.hp, marks: window.__ashen.hunter.marks };
  })()`);
  check(shot.result.ok && (shot.dead || shot.hp <= 30), 'spirit round fights back against the ghost');
  const rewarded = await evaluate(`(() => {
    window.__ashen.drainEvents();
    return JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-hunter-v1'));
  })()`);
  check(rewarded.marks >= 67 && rewarded.banished >= 1, 'banishing a ghost pays its Hunter bounty');
  check(!rewarded.items.spirit_bane, 'the spent spirit round is persisted back to the save');

  const ward = await evaluate(`(() => {
    const game = window.__ashen.game;
    game.addHunterItem('ward_charm', 1, true);
    game.player.consumeCooldown = 0;
    const result = game.useHunterItem('ward_charm');
    game.player.invuln = 0;
    const hp = game.player.hp;
    game.damagePlayer(30, 220, { source: { type: 'ghost:hollow_wraith', ghostKind: 'hollow_wraith' }, knock: false });
    return { result, lost: hp - game.player.hp, ward: game.player.spiritWardTimer };
  })()`);
  check(ward.result.ok && ward.ward > 7, 'ward charm activates for eight seconds');
  check(ward.lost === 12, `ward cuts ghost damage by 60% (${ward.lost} lost)`);

  const liveShop = await evaluate(`(() => {
    window.__ashen.showHunterShop();
    const before = window.__ashen.game.hunterItemCount('grave_bell');
    const bought = window.__ashen.buyHunterItem('grave_bell');
    return {
      open: window.__ashen.hunter.shopOpen,
      before,
      after: window.__ashen.game.hunterItemCount('grave_bell'),
      bought,
      save: JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-hunter-v1')),
    };
  })()`);
  check(liveShop.open && liveShop.bought.ok && liveShop.after === liveShop.before + 1, 'the shop adds stock to the current run');
  check(liveShop.save.items.grave_bell === 1, 'in-run purchase is persisted immediately');
  await evaluate('window.__ashen.closeHunterShop()');

  const inventory = await evaluate(`(() => {
    window.__ashen.openInventory();
    return {
      visible: window.__ashen.inventoryOpen,
      text: document.getElementById('inventory-list').textContent,
    };
  })()`);
  check(inventory.visible && /PEMBURU/.test(inventory.text), 'hunter stock appears in the inventory');
  await evaluate('window.__ashen.closeInventory()');

  await send('Page.reload', { ignoreCache: true });
  await sleep(1100);
  await waitFor(() => evaluate('typeof window.__ashen === "object" && typeof window.__ashen.hunter === "object"'), 20000, 'reload boot');
  const persisted = await evaluate(`({
    hunter: window.__ashen.hunter,
    save: JSON.parse((window.__ashen?.flushSaves?.(), localStorage).getItem('ashen-vow-hunter-v1')),
    version: window.__ashen.version,
    title: document.title,
  })`);
  check(persisted.save.items.grave_bell === 1 && persisted.save.marks >= 22, 'stock and marks survive a full reload');
  check(VERSION_RE.test(persisted.version) && VERSION_RE.test(persisted.title), `reload keeps the v${VERSION} build`);

  check(errors.length === 0, `no runtime or console errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  console.log(`\nHunter kit smoke: ${checks}/${checks} checks passed`);
} finally {
  try { chrome.kill(); } catch { /* ignore */ }
}
