# Ashen Vow — Claude Master Plan

> Compressed handoff for continuing **Ashen Vow v0.0.5**.
> Status: **playable, browser-verified, pushed to GitHub**.
> Repo: `https://github.com/FahmiGF/Ashen-Vow-` · branch `main` · push account `isshinAshinaSeal`.

## 1. Product definition

**Ashen Vow** is a 2D medieval metroidvania / roguelike-lite played in the browser.
The UI is Indonesian; the tone is dark-fantasy ash and oath imagery.

Non-negotiable v0.0.5 requirements:

1. Boot into a **startup menu**, never directly into gameplay.
2. Exactly **2 bosses**, and **every boss has exactly 2 phases**.
3. **Level Select** shows all 4 rooms; unfinished rooms are **locked**.
4. Locked rooms expose **Sneak Peek**: spectate-only, no player, no HUD.
5. Credits must contain: **“Made by SealiusHQ with a lot of support from Contributors”**.
6. Progress persists across reloads.
7. Combat must be real and testable, not a mock.
8. Every boss room keeps a **Warung Abu checkpoint** at its entrance.
9. Weapons, ammunition, and consumables are bought with run-scoped **ash**; keep `SHOP_ITEMS` and `WEAPONS` data-driven.

## 2. Stack and constraints

| Area | Choice |
| --- | --- |
| Runtime | Zero-build HTML5 Canvas + vanilla ES modules |
| Server | `server.js`, static files, `http://127.0.0.1:4300` |
| Dependencies | None at runtime, none at test time |
| Simulation | Deterministic fixed timestep, `1 / 120 s`, no DOM |
| Tests | `node --test`, pure Node against `src/core.js` |
| Audio | Procedural WebAudio, no audio files |
| Visuals | Procedural Canvas drawing, no image assets |

Do **not** add a framework, bundler, or asset pipeline unless the product scope changes.

## 3. File map

| File | Responsibility |
| --- | --- |
| `index.html` | Canvas shell, HUD, main menu, level select, credits, Sneak Peek UI, Warung Abu, overlays |
| `styles.css` | Medieval theme, responsive layout, portrait menu fix, touch controls, shop cards |
| `src/core.js` | Pure simulation: player, enemies, bosses, weapons, projectiles, ash, shop, checkpoints, gates, blessings, events |
| `src/render.js` | Canvas renderer; supports `render(game, { spectate, cameraX })` |
| `src/audio.js` | Procedural SFX and mute toggle |
| `src/main.js` | Menus, progress, spectate camera, fixed-step loop, input, HUD, shop UI, debug hooks |
| `tests/core.test.js` | 36 deterministic Node tests |
| `server.js` | Static server on port 4300 |
| `docs/` | Committed screenshots |

## 4. Simulation contract

- `AshenGame.update(dt, input)` is the only gameplay entry point.
- Fixed step is `1 / 120`; renderer and audio only read state/events.
- Game states: `playing`, `blessing`, `dead`, `victory`.
- Gameplay events are accumulated in `game.events` and drained by the browser shell.
- Relevant event types:
  - `gatePass { from, to }` — room cleared and next room entered.
  - `bossDown { room, kind, name }` — boss defeated; used for progress.
  - `bossPhase { name }` — phase II transition.
  - `bossSpawn`, `bossTelegraph`, `bossSlash`, `bossSlam`, `bossDie`.
  - `relic`, `respawn`, `blessingOpen`, `blessingChosen`, `victory`, `roomEnter`.
  - `checkpoint { room, name }`, `checkpointRespawn { room }` — boss-room checkpoints.
  - `ashGain { amount, total }`, `shopBuy { id, name, cost }` — currency and shop.
  - `weaponSwitch`, `arrowShot`, `shurikenThrow`, `noAmmo` — weapons and consumables.
- Never let core code touch `window`, `document`, canvas, or audio.

## 5. Content model

### Rooms

| # | Name | Subtitle | Gate / hook | Boss |
| --- | --- | --- | --- | --- |
| 0 | Gerbang Abu | The Ashen Gate | Clear 2 enemies | — |
| 1 | Balai Sumpah | Hall of Oaths | Relic required; pit hazard; Sentinels | — |
| 2 | Singgasana Bara | Throne of Cinders | Boss gate | Sir Mordrake (Warden) |
| 3 | Sarang Wyrm | Wyrm's Roost | No gate; victory room | Vhael (Wyrm) |

Clearing room `i` marks `cleared[i] = true` and sets `unlocked = min(4, i + 2)`.
Progress shape:

```js
{ unlocked: 1, cleared: [false, false, false, false] }
```

Stored in `localStorage` key **`ashen-vow-progress-v1`**.

### Bosses — both have exactly 2 phases

| Boss | Kind | HP | Phase I | Phase II trigger | Phase II changes |
| --- | --- | --- | --- | --- | --- |
| **Sir Mordrake, The Fallen Warden** | `warden` | 340 | Chase, telegraphed slash, ground slam with shockwaves | `hp <= 50%` | Faster chase (`78 → 118`), faster slash windup (`0.46 → 0.32 s`), higher slash damage (`19 → 26`), shorter cooldowns, **slash also spawns shockwaves**, transition spawns 2 shockwaves at speed `430` |
| **Vhael, The Ashen Wyrm** | `wyrm` | 480 | Hover, 3-fireball volley, dive attack | `hp <= 50%` | 5-fireball volley, faster fireballs (`280 → 340`) and more damage (`14 → 18`), attack pattern gains **fire pillars** (`['volley','dive','pillars','volley']`) |

Phase transition code lives in `hurtBoss()`:

```js
if (b.phase === 1 && b.hp <= b.maxHp * 0.5) { b.phase = 2; ... }
```

There is no phase III. Tests assert a third phase is impossible.

**Bug fixed during v0.0.5 verification:** Wyrm `dive` was clamped to `FLOOR_Y - b.h - 20`, so it never reached its rise threshold and looped in `dive` forever. Clamp is now `FLOOR_Y - b.h`. Do not reintroduce a floor offset above the dive landing threshold.

### Weapons and consumables

`WEAPONS` is exported from `src/core.js`. The player starts with `sword`; purchased weapons are appended to `player.weapons`.

| Weapon | Attack profile | Notes |
| --- | --- | --- |
| `sword` | 3-hit combo, windup `0.045`, range `60–76`, damage `12–24` | Default; combo index tracked in `comboIndex`. |
| `pike` | `PIKE_ATTACK`, windup `0.24`, active `0.15`, range `118`, damage `29` | Slow but long reach; `name: 'pierce'`. |
| `bow` | `BOW_ATTACK`, windup `0.26`, damage `22` | Spawns a player-owned `arrow` projectile; consumes `player.arrows`. Refuses to fire at 0 ammo and emits `noAmmo`. |

`player.attack` carries `{ weapon, def, t, hitIds, landed }`; `currentAttackDef()`, `startAttack()`, `updatePlayerAttack()`, and `playerHitbox()` are all weapon-aware. `X` calls `cycleWeapon()`; touch has a `swap` button.

`Shuriken` is a consumable stack (`player.shurikens`). `C` calls `throwConsumable()`, spawning a `shuriken` projectile and setting `consumeCooldown`. Player-owned projectiles damage enemies/bosses in `updateProjectiles()`.

### Ash and Warung Abu

`game.ash` is run-scoped currency. Rewards: crawler `8`, sentinel `15`, Warden `60`, Wyrm `90`. Each kill emits `ashGain`.

`SHOP_ITEMS` (exported) drives both the shop UI and `game.buyShopItem(id)`:

| Item | Cost | Type | Effect |
| --- | --- | --- | --- |
| Pike Penjaga | 35 | weapon | Adds `pike`, equips it. |
| Busur Abu | 55 | weapon | Adds `bow`, equips it, grants 8 arrows. |
| Shuriken ×3 | 14 | consumable | Adds 3 shuriken. |
| Anak Panah ×6 | 12 | ammo | Requires `bow`; adds 6 arrows. |
| Isi Ulang Flask | 10 | flask | Restores all flask charges. |

`canShop()` requires a checkpoint in the current room and proximity (`<110 px` horizontally, `<150 px` vertically) to `room.merchant`. Shop is opened with `F` or the pause button. Purchases are run-scoped; ash is not persisted across full runs. Starting a run directly from Level Select grants a stipend of 45 ash (room 2) or 90 ash (room 3) so the shop is usable without replaying earlier rooms.

### Checkpoints

Rooms 2 and 3 define `checkpoint` and `merchant` at the entrance. `loadRoom()` sets `checkpoint` / `checkpointRoom` and emits `checkpoint`. `retryRun()` in `src/main.js` calls `game.respawnAtCheckpoint()` when available:

- reloads the boss room and respawns the boss,
- restores HP and flasks,
- preserves `ash`, `player.weapons`, `arrows`, `shurikens`, and `blessings`,
- emits `checkpointRespawn`.

### Enemy pursuit AI

`updateEnemies()` uses `moveEnemy()` + `integrateEnemy()` for crawler and sentinel movement:

- `moveEnemy()` accelerates toward the player, jumps when the player is above, and leaps gaps when needed.
- `integrateEnemy()` applies gravity, platform landing, world clamp, pit recovery (`homeX`), and horizontal `vx`.
- `enemyGroundAhead()` probes ahead of the enemy's feet to detect platform edges.
- Patrol bounds apply only while the player is out of aggro range; in combat enemies may leave their original patrol box.

## 6. UI / navigation behaviour

`src/main.js` state:

- `menuView`: `title | levels | credits | none`
- `started`, `paused`, `spectating`, `shopOpen`
- `spectateGame` is a separate `AshenGame` instance, never the live run.

Rules:

- Boot: `menuView = 'title'`, `started = false`, HUD hidden.
- `MULAI PERJALANAN` → `startRun(0)`.
- `PILIH LEVEL` → cards for all rooms.
- Locked card: **no `MAINKAN` button**, only `SNEAK PEEK`.
- Unlocked card: `MAINKAN` + `SNEAK PEEK`.
- `SNEAK PEEK` → `startSpectate(index)`, hides HUD/title, shows `#spectate-ui`.
- Spectate render call: `renderer.render(spectateGame, { spectate: true, cameraX })`.
  - `spectate: true` skips `drawPlayer`, shake, low-HP vignette, and gate chevrons.
- Spectate input: `←/→` or `A/D` pan; `Esc` / `Backspace` / `Q` returns to level select.
- Pause/death/victory screens link back to Level Select and Main Menu.
- Shop is a full-screen overlay (`#shop-screen`); while `shopOpen`, the simulation pauses, HUD/touch are hidden, and `Esc`/`F` closes it.
- Shop is available only when `game.checkpointRoom === game.roomIndex`; proximity to the merchant is required for `F`, while the pause button passes `force = true`.
- Death retry uses checkpoint respawn when possible, preserving run inventory; otherwise it restarts the current room.
- Portrait phones: `.screen` overlays become fixed full-viewport scroll layers so menus are not clipped by the 16:9 game frame.

## 7. Verification

### Automated core tests

```bash
npm test
```

Current result: **36/36 passing**. Coverage includes:

- gravity, floor landing, movement and world bounds;
- single jump vs double jump after relic;
- sword combo hit registration and crawler death;
- damage i-frames and dash i-frames;
- flask consumption and healing;
- locked/unlocked gates and room transitions;
- relic pickup;
- pit damage and respawn;
- Sentinel lunge cycle;
- **crawler pursuit closes distance; crawler jumps toward a raised player**;
- **hitting a pursuing enemy does not clamp it back to patrol bounds**;
- **boss-room checkpoints and checkpoint respawn preserving ash/gear/blessings**;
- **ash rewards from enemies and bosses**;
- **Warung Abu purchases, ammo gating, duplicate-purchase rejection, proximity**;
- **Pike reach/windup, Bow ammo consumption/projectile damage, Shuriken throw**;
- **weapon cycling via the swap input**;
- Warden phase II transition and phase-II shockwaves;
- Warden defeat → 3 blessings → gate opens;
- ember blessing damage multiplier;
- Wyrm projectiles damaging the player;
- Wyrm dive/rise cycle and fireballs;
- **Wyrm phase II transition and pillar attack**;
- **both bosses capped at exactly 2 phases**;
- Wyrm defeat → victory;
- death freezes the simulation.

New tests added for v0.0.5 menus are browser-level, not Node-level.

### Browser smoke tests

Run the server and Chrome with remote debugging:

```bash
npm start
chrome --remote-debugging-port=9333 --user-data-dir=<temp> http://127.0.0.1:4300/
```

Verified through Chrome DevTools Protocol:

- startup menu visible, HUD hidden, three menu actions present;
- signature text exactly: `Made by SealiusHQ — with a lot of support from Contributors`;
- Level Select shows 4 cards; only room 0 playable, other 3 locked;
- locked cards have no play button and do have Sneak Peek;
- Sneak Peek hides the player and HUD and shows boss hint;
- credits hero text and cells correct;
- clearing a gate updates `unlocked` and `localStorage`, survives reload;
- Warung Abu opens in room 2, shows 5 cards, and DOM purchases update ash/HUD/weapons;
- checkpoint death → `retry()` restores HP/flasks/boss while keeping ash and gear;
- pursuit AI closes distance and jumps; swap input cycles weapons; empty bow emits `noAmmo`;
- no console exceptions;
- desktop and 390×844 mobile layouts have zero horizontal overflow, including the shop grid.

> `requestAnimationFrame` is throttled when the Chrome page is backgrounded. Call `Page.bringToFront` in CDP before asserting anything that depends on the game loop.

## 8. Debug hooks

`window.__ashen` exists for smoke tests:

- Getters: `game`, `renderer`, `started`, `paused`, `spectating`, `menuView`, `progress`, `shopOpen`.
- Navigation: `start`, `restart`, `retry`, `showMenu`, `showLevels`, `showCredits`, `enterRoom`, `clearProgress`.
- Spectate: `startSpectate`, `stopSpectate`.
- Simulation: `step`, `tap`, `damageBoss`, `chooseBlessing`, `togglePause`.
- Shop/economy: `openShop`, `closeShop`, `buyShopItem`, `respawnAtCheckpoint`, `giveAsh`.
- Inspect: `snap()` returns state, room, HP, relics, ash, weapon/ammo, checkpoint room, boss phase/state, gate, view flags, progress.

## 9. Known limitations / next roadmap

- No save-slot UI; single browser profile progress only.
- Ash is run-scoped and is not persisted with level progress; weapons are re-earned each run.
- Sneak Peek has no touch pan control; camera auto-drifts.
- No new game plus, no difficulty selection, no controller mapping screen.
- Audio is procedural only; no music track.
- Art is procedural; no sprite/tileset pipeline.
- Boss phase II is tuned by constants inside `src/core.js`; extract to data if more bosses are added.
- Enemy AI is platform-aware but not a full navmesh; complex multi-level layouts may still need hand-tuned jumps.

## 10. Working agreements for future changes

1. Keep `src/core.js` pure and deterministic; add a Node test for every mechanic change.
2. Keep exactly 2 bosses for v0.0.5; new bosses require a version bump.
3. Never bypass phase II when touching boss damage or death logic.
4. Keep menu-first boot; never auto-start gameplay on load.
5. Locked levels must remain viewable only through Sneak Peek, never playable.
6. Preserve the exact credits wording.
7. Verify on desktop and portrait mobile; run `npm test` before committing.
8. Update `README.md` and this file when behaviour or content changes.
9. Checkpoint retry must never erase ash, owned weapons, ammo, shuriken, or blessings.
10. New purchasable items must be added to `SHOP_ITEMS` and validated in `buyShopItem()` with a Node test.
