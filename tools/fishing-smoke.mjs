// Fishing (Pondok Umpan) browser smoke test — headless Chrome + CDP.
//
// Drives the real UI: the starting ten worms, the bait shack prices, buying,
// a successful and a failed reel, the illustrated index (canvas art, odds,
// tabs) and save persistence across a reload.
//
// Usage:
//   npm start
//   node tools/fishing-smoke.mjs
//
// Env: ASHEN_URL, CHROME_PATH, CDP_PORT (default 9240).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.env.ASHEN_URL || 'http://127.0.0.1:4300/';
const CDP_PORT = Number(process.env.CDP_PORT) || 9240;

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
      : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const found = candidates.filter(Boolean).find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const res = await fetch(URL, { method: 'HEAD' });
  assert.equal(res.ok, true, 'game server must be running');

  const profile = mkdtempSync(join(tmpdir(), 'ashen-fishing-'));
  const chrome = spawn(findBrowser(), [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    '--window-size=1440,900',
    URL,
  ], { stdio: 'ignore' });

  let ws;
  const pageErrors = [];
  const checks = [];
  const check = (name, value, expected) => {
    assert.equal(value, expected, name);
    checks.push(name);
    if (process.env.SMOKE_VERBOSE) console.log(`· ${name}`);
  };
  try {
    let list;
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
        list = await response.json();
        if (list.some((target) => target.type === 'page' && target.url.startsWith(URL))) break;
      } catch {
        // Chrome is still starting.
      }
      await sleep(150);
    }
    const page = list?.find((target) => target.type === 'page' && target.url.startsWith(URL));
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
        pageErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(' '));
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        if (!/favicon|ERR_NETWORK_ACCESS_DENIED|429|Too Many Requests/i.test(message.params.entry.text || '')) {
          pageErrors.push(message.params.entry.text);
        }
      }
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (message) => {
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else resolve(message.result);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      }
      return result.result.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');
    await send('Page.bringToFront');
    await sleep(2200);

    let booted = false;
    for (let i = 0; i < 100; i++) {
      try {
        booted = await evaluate('typeof window.__ashen === "object" && document.readyState === "complete"');
        if (booted) break;
      } catch {
        // Module graph still loading.
      }
      await sleep(120);
    }
    assert.equal(booted, true, `game must boot (errors: ${pageErrors.join(' | ')})`);

    const boot = await evaluate(`(() => {
      const A = window.__ashen;
      A.clearProgress();
      return {
        version: A.version,
        hasHook: typeof A.showFishing === 'function',
        menuButton: !!document.getElementById('btn-fishing-menu'),
        title: document.title,
      };
    })()`);
    check('boot reports v0.35.0', boot.version, '0.35.0');
    check('title screen advertises v0.35.0', boot.title.includes('v0.35.0'), true);
    check('fishing hub is reachable from the menu', boot.menuButton, true);
    check('debug hooks expose the fishing hub', boot.hasHook, true);

    await evaluate(`document.getElementById('btn-fishing-menu').click()`);
    await sleep(500);
    const hub = await evaluate(`(() => {
      const A = window.__ashen;
      const f = A.fishing;
      return {
        view: A.menuView,
        hidden: document.getElementById('fishing-screen').classList.contains('hidden'),
        coins: f.summary.coins,
        worms: f.state.bait.worm,
        selected: f.state.selectedBait,
        chips: document.querySelectorAll('.bait-chip').length,
        chipText: document.querySelector('.bait-chip')?.textContent || '',
        castLabel: document.getElementById('fishing-cast-start').textContent.trim(),
        castDisabled: document.getElementById('fishing-cast-start').disabled,
        pond: !!document.querySelector('.fishing-pond'),
        shopItems: f.shop.length,
        odds: f.shop.map((item) => item.highTierChance),
      };
    })()`);
    check('fishing hub opens', hub.view, 'fishing');
    check('fishing hub is visible', hub.hidden, false);
    check('a new fisherman starts with 250 coins', hub.coins, 250);
    check('a new fisherman starts with exactly ten worms', hub.worms, 10);
    check('worm is the selected starter bait', hub.selected, 'worm');
    check('the bait rack lists all nine baits', hub.chips, 9);
    check('the rack shows the worm price and stock', hub.chipText.includes('25 koin') && hub.chipText.includes('10 tersisa'), true);
    check('the cast button names the bait and stock', hub.castLabel.includes('Cacing') && hub.castLabel.includes('10'), true);
    check('the cast button is enabled with worms in the bag', hub.castDisabled, false);
    check('the pond card renders', hub.pond, true);
    check('the shop advertises nine baits', hub.shopItems, 9);
    check('better bait lists better rare odds', hub.odds[0] < hub.odds[hub.odds.length - 1], true);
    check('the premium bait reaches rare fish more often', hub.odds[hub.odds.length - 1] >= 30, true);

    await evaluate(`document.getElementById('fishing-shop-open').click()`);
    await sleep(400);
    const shop = await evaluate(`(() => {
      const A = window.__ashen;
      const cards = [...document.querySelectorAll('.bait-shop-card')];
      const prices = cards.map((card) => {
        const meta = card.querySelector('.bait-shop-meta');
        return Number((meta?.textContent || '').replace('HARGA', '').trim().split(/\\s+/)[0]);
      });
      return {
        view: A.menuView,
        hidden: document.getElementById('bait-shop-screen').classList.contains('hidden'),
        shelfs: document.querySelectorAll('.bait-shelf').length,
        cards: cards.length,
        wallet: document.getElementById('bait-shop-wallet').textContent.trim(),
        roof: document.querySelector('.bait-shack-roof')?.textContent.trim() || '',
        prices: [...new Set(prices)].sort((a, b) => a - b),
        names: cards.map((card) => card.querySelector('h4')?.textContent || ''),
      };
    })()`);
    check('the bait shack opens from the hub', shop.view, 'baitShop');
    check('the shack screen is visible', shop.hidden, false);
    check('the shack has three price shelves', shop.shelfs, 3);
    check('the shack stocks all nine baits', shop.cards, 9);
    check('the shack is a wooden hut with a sign', shop.roof.includes('PONDOK UMPAN'), true);
    check('the shack sells 25/50/100 coin baits', JSON.stringify(shop.prices), JSON.stringify([25, 50, 100]));
    check('the wallet shows the starting coins', shop.wallet.includes('250'), true);
    check('the shack names the requested baits', ['Cacing', 'Jangkrik', 'Keju', 'Ikan Kecil (Minnow)', 'Kerang', 'Cumi-cumi', 'Irisan Ikan', 'Udang', 'Cacing Cahaya'].every((name) => shop.names.some((item) => item.includes(name))), true);

    const bought = await evaluate(`(() => {
      const A = window.__ashen;
      const one = A.buyBait('cricket', 1);
      const five = A.buyBait('glowworm', 2);
      const broke = A.buyBait('slicedfish', 1);
      return {
        one: { ok: one.ok, total: one.total, coins: one.coins, owned: one.owned },
        five: { ok: five.ok, total: five.total, coins: five.coins, owned: five.owned },
        broke: { ok: broke.ok, reason: broke.reason },
        coins: A.fishing.summary.coins,
        worms: A.fishing.state.bait.worm,
        cricket: A.fishing.state.bait.cricket,
        glowworm: A.fishing.state.bait.glowworm || 0,
        saved: JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).fishing,
      };
    })()`);
    check('buying one cricket costs 25 coins', bought.one.ok && bought.one.total === 25, true);
    check('the wallet drops to 225', bought.one.coins, 225);
    check('the bought bait lands in the bag', bought.one.owned, 1);
    check('premium bait costs 100 per unit', bought.five.total, 200);
    check('the wallet drops to 25', bought.five.coins, 25);
    check('two glowworms are owned', bought.five.owned, 2);
    check('an unaffordable purchase is refused', bought.broke.ok, false);
    check('the refusal names the missing coins', bought.broke.reason, 'coins');
    check('refused purchases never spend coins', bought.coins, 25);
    check('the starter worms are untouched by shopping', bought.worms, 10);
    check('the purchase is written to the save', bought.saved.bait.glowworm, 2);

    await evaluate(`document.getElementById('btn-bait-shop-back').click()`);
    await sleep(350);
    const selected = await evaluate(`(() => {
      const A = window.__ashen;
      document.querySelector('[data-fishing-bait="glowworm"]').click();
      return {
        selected: A.fishing.state.selectedBait,
        label: document.getElementById('fishing-cast-start').textContent.trim(),
        active: document.querySelector('[data-fishing-bait="glowworm"]').classList.contains('active'),
      };
    })()`);
    check('choosing a bait updates the pond', selected.selected, 'glowworm');
    check('the chosen bait becomes the active chip', selected.active, true);
    check('the cast button follows the chosen bait', selected.label.includes('Cahaya'), true);

    const cast = await evaluate(`(() => {
      const A = window.__ashen;
      const started = A.beginFishingCast();
      const reel = A.fishing.reel;
      const overlay = document.getElementById('fishing-cast');
      const zone = document.getElementById('fishing-reel-zone').style;
      const marker = document.getElementById('fishing-reel-marker').style.left;
      return {
        started,
        reel,
        overlayHidden: overlay.classList.contains('hidden'),
        zoneLeft: zone.left,
        zoneWidth: zone.width,
        marker,
        glowworm: A.fishing.state.bait.glowworm || 0,
        casts: A.fishing.summary.casts,
      };
    })()`);
    check('casting opens the reel minigame', cast.started, true);
    check('the reel overlay is visible', cast.overlayHidden, false);
    check('the reel knows which fish bit', typeof cast.reel.fish, 'string');
    check('the zone is drawn around the centre', cast.zoneLeft === '35%' || cast.zoneLeft.endsWith('%'), true);
    check('the zone has a width', cast.zoneWidth.endsWith('%'), true);
    check('the marker starts at the left edge', cast.marker, '0%');
    check('casting spends exactly one bait', cast.glowworm, 1);
    check('the cast counter increments', cast.casts, 1);

    const landed = await evaluate(`(() => {
      const A = window.__ashen;
      const fishId = A.fishing.reel.fish;
      const hit = A.strikeFishingReel(0.5);
      const s = A.fishing.summary;
      const saved = JSON.parse(localStorage.getItem('ashen-vow-progress-v1')).fishing;
      return {
        hit,
        result: A.fishing.reel.result,
        name: document.getElementById('fishing-cast-name').textContent,
        message: document.getElementById('fishing-cast-result').textContent,
        catches: s.catches,
        coins: s.coins,
        discovered: s.discovered,
        fishId,
        savedCatch: saved.caught[fishId] || 0,
        savedCoins: saved.coins,
      };
    })()`);
    check('a centred strike lands the fish', landed.hit, true);
    check('the reel reports a catch', landed.result, 'hit');
    check('the result panel names the fish and weight', landed.name.includes('·') && landed.name.includes('kg'), true);
    check('the result banner celebrates the catch', landed.message, 'TERTARIK!');
    check('the catch counter increments', landed.catches, 1);
    check('the fish pays coins into the wallet', landed.coins > 25, true);
    check('the catch enters the index', landed.discovered, 1);
    check('the catch is stored in the save', landed.savedCatch, 1);
    check('the save keeps the new wallet', landed.savedCoins, landed.coins);

    const missed = await evaluate(`(() => {
      const A = window.__ashen;
      A.beginFishingCast();
      const fishId = A.fishing.reel.fish;
      const hit = A.strikeFishingReel(0.01);
      const s = A.fishing.summary;
      return {
        hit,
        result: A.fishing.reel.result,
        message: document.getElementById('fishing-cast-result').textContent,
        escapes: s.escapes,
        catches: s.catches,
        glowworm: A.fishing.state.bait.glowworm || 0,
        fishId,
      };
    })()`);
    check('a wild strike misses', missed.hit, false);
    check('the reel reports an escape', missed.result, 'miss');
    check('the result banner reports the loss', missed.message, 'LEPAS');
    check('the escape counter increments', missed.escapes, 1);
    check('a miss never pays out a catch', missed.catches, 1);
    check('a miss still consumes the bait', missed.glowworm, 0);

    await evaluate(`document.getElementById('fishing-cast-close').click()`);
    await sleep(250);
    const index = await evaluate(`(() => {
      const A = window.__ashen;
      document.getElementById('fishing-index-open').click();
      const cards = [...document.querySelectorAll('.fish-card')];
      const canvases = [...document.querySelectorAll('#fish-index-body canvas')];
      let painted = 0;
      for (const canvas of canvases) {
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let hits = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) hits += 1;
        if (hits > 200) painted += 1;
      }
      const first = cards[0];
      return {
        view: A.menuView,
        cards: cards.length,
        canvases: canvases.length,
        painted,
        tabs: document.querySelectorAll('.fish-tab').length,
        chips: first.querySelectorAll('.fish-odds-chip').length,
        firstText: first.textContent,
        oddsTotal: [...first.querySelectorAll('.fish-odds-chip b')].reduce((sum, node) => sum + Number(node.textContent.replace('%', '')), 0),
        types: [...new Set(cards.map((card) => card.textContent.match(/TIPE([A-Z]+)/)?.[1]).filter(Boolean))].length,
        summary: document.getElementById('fish-index-summary').textContent,
      };
    })()`);
    check('the index opens from the hub', index.view, 'fishIndex');
    check('the index lists every fish', index.cards, 25);
    check('every fish has a drawn image', index.painted, 25);
    check('the index has six rarity tabs', index.tabs, 6);
    check('a fish card shows odds for all nine baits', index.chips, 9);
    check('a fish card lists nine usable percentages', index.oddsTotal > 0 && index.oddsTotal < 400, true);
    check('the index names body types', index.types >= 3, true);
    check('the card states weight, value and catch count', index.firstText.includes('kg') && index.firstText.includes('koin') && index.firstText.includes('TERTANGKAP'), true);
    check('the index summary tracks the catch', index.summary.includes('1 / 25'), true);

    const filtered = await evaluate(`(() => {
      const A = window.__ashen;
      const mythicTab = [...document.querySelectorAll('.fish-tab')].find((tab) => tab.textContent.includes('MITOS'));
      mythicTab.click();
      const cards = [...document.querySelectorAll('.fish-card')];
      return {
        tab: A.fishing.tab,
        cards: cards.length,
        onlyMythic: cards.every((card) => card.textContent.includes('MITOS')),
        active: [...document.querySelectorAll('.fish-tab')].some((tab) => tab.textContent.includes('MITOS') && tab.classList.contains('active')),
      };
    })()`);
    check('rarity tabs switch the index', filtered.tab, 5);
    check('the mythic tab shows the mythic fish', filtered.cards, 3);
    check('the filtered cards are all mythic', filtered.onlyMythic, true);
    check('the active tab is marked', filtered.active, true);

    await send('Page.reload');
    await send('Page.bringToFront');
    await sleep(2400);
    const reloaded = await evaluate(`(() => {
      const A = window.__ashen;
      A.showFishing();
      const f = A.fishing;
      return {
        version: A.version,
        coins: f.summary.coins,
        worms: f.state.bait.worm,
        glowworm: f.state.bait.glowworm || 0,
        cricket: f.state.bait.cricket,
        caught: f.summary.discovered,
        catches: f.summary.catches,
        escapes: f.summary.escapes,
        chips: document.querySelectorAll('.bait-chip').length,
      };
    })()`);
    check('reload keeps v0.35.0', reloaded.version, '0.35.0');
    check('reload keeps the wallet', reloaded.coins > 25, true);
    check('reload keeps the worms', reloaded.worms, 10);
    check('reload keeps the bought glowworm stack', reloaded.glowworm, 0);
    check('reload keeps the bought cricket', reloaded.cricket, 1);
    check('reload keeps the index discovery', reloaded.caught, 1);
    check('reload keeps the catch and escape counters', reloaded.catches === 1 && reloaded.escapes === 1, true);
    check('the hub still renders after reload', reloaded.chips, 9);

    if (pageErrors.length) console.error(pageErrors.join('\n'));
    check('no console errors', pageErrors.length, 0);

    console.log(`\nFISHING SMOKE PASS — ${checks.length} checks`);
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
      // Windows may still hold the profile for a moment.
    }
  }
}

main().catch((error) => {
  console.error('FISHING SMOKE FAIL');
  console.error(error);
  process.exitCode = 1;
});
