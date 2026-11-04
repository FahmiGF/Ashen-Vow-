# Ashen Vow — Claude Master Plan

> Compressed handoff for continuing **Ashen Vow v0.0.7**.
> Status: **playable, browser-verified, pushed to GitHub**.
> Repo: `https://github.com/FahmiGF/Ashen-Vow-` · branch `main` · push account `isshinAshinaSeal`.

## 1. Product definition

**Ashen Vow** is a 2D medieval metroidvania / roguelike-lite played in the browser.
The UI is Indonesian; the tone is dark-fantasy ash and oath imagery.

Non-negotiable v0.0.7 requirements:

1. Boot into a **startup menu**, never directly into gameplay.
2. **8 rooms and 4 bosses**; every boss has at least 2 phases and The Oathbreaker has 3.
3. Every boss speaks at fight start, at each phase, and on defeat.
4. **Level Select** shows all 8 rooms; unfinished rooms are **locked**.
5. Locked rooms expose **Sneak Peek**: spectate-only, no player, no HUD.
6. The **map** (`M`) opens from the menu, pause screen, or mid-stage.
7. The **codex** (`I`) indexes enemies, weapons, bosses, and items/consumables.
8. Credits must contain: **“Made by SealiusHQ with a lot of support from Contributors”**.
9. Progress persists across reloads.
10. Combat must be real and testable, not a mock.
11. Every boss room keeps a **Warung Abu checkpoint** at its entrance.
12. Weapons, ammunition, and consumables are bought with run-scoped **ash**; keep `SHOP_ITEMS`, `WEAPONS`, `BOSS_INFO`, `ENEMY_INFO`, and `CODEX` data-driven.
13. **Five selectable characters/classes** at the menu: Knight (Sera), Elf Archer (Lyna), Assassin (Kael), Brawler (Karn), Mage (Ignis) with unique active abilities.
14. **Character customization** before starting: race (human, elf, goblin, orc, devil), 5 armor styles, skin color, and outfit color, with a live Canvas preview featuring runic altar, sparkling glitter stars, and transition pulse VFX.
15. A **60-second narrative prologue** plays before the first stage on a new journey, with voice-over and always-visible subtitles; it is skippable and never replays from Level Select.

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
| `index.html` | Canvas shell, HUD, main menu, character screen, prologue screen, level select, credits, map, codex, boss dialogue, Sneak Peek UI, Warung Abu, overlays |
| `styles.css` | Medieval theme, responsive layout, portrait menu fix, touch controls, shop/map/codex/dialogue cards |
| `src/core.js` | Pure simulation: player, characters/appearance, enemies, bosses, dialogue, codex, weapons, projectiles, ash, shop, checkpoints, gates, blessings, events |
| `src/render.js` | Canvas renderer; supports `render(game, { spectate, cameraX })` and all four bosses |
| `src/audio.js` | Procedural SFX, prologue score, and mute toggle |
| `src/prologue.js` | 12-beat, 60-second prologue timeline plus procedural cutscene art (`drawPrologue`) |
| `src/main.js` | Menus, character customization, prologue playback, progress, spectate camera, fixed-step loop, input, HUD, shop/map/codex/dialogue UI, debug hooks |
| `tests/core.test.js` | 51 deterministic Node tests |
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
  - `bossPhase { name, phase }` — boss phase transition.
  - `bossDialogue { kind, phase, name, title, lines }` — boss speech for `intro`, `phase2`, `phase3`, `defeat`.
  - `bossSpawn`, `bossTelegraph`, `bossSlash`, `bossSlam`, `bossDie`, `note`, `beam`.
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
| 3 | Sarang Wyrm | Wyrm's Roost | Boss gate | Vhael (Wyrm) |
| 4 | Jembatan Tulang | The Bone Bridge | Clear wraith + brute | — |
| 5 | Katedral Sunyi | The Silent Cathedral | Boss gate | The Hollow Choir |
| 6 | Menara Lonceng | The Bell Tower | Clear sentinel + wraith + brute | — |
| 7 | Puncak Sumpah | Summit of the Vow | Final boss, no gate | The Oathbreaker |

Clearing room `i` marks `cleared[i] = true` and sets `unlocked = min(8, i + 2)`.
Progress shape:

```js
{ unlocked: 1, cleared: [false, false, false, false, false, false, false, false] }
```

Stored in `localStorage` key **`ashen-vow-progress-v1`**.

### Bosses — four bosses, up to three phases

| Boss | Kind | HP | Phases | Notes |
| --- | --- | --- | --- | --- |
| **Sir Mordrake, The Fallen Warden** | `warden` | 340 | 2 | Chase, telegraphed slash, ground slam with shockwaves. Phase II is faster and adds shockwaves. |
| **Vhael, The Ashen Wyrm** | `wyrm` | 480 | 2 | Hover, fireball volley, dive. Phase II adds **fire pillars**. |
| **The Hollow Choir** | `choir` | 560 | 2 | Flying spectral choir; spiral **note** projectiles and vertical **beam**; phase II adds echo patterns. |
| **The Oathbreaker** | `oathbreaker` | 720 | 3 | Final boss; slash, dash, volley, nova. Phase III unlocks the full pattern set; defeat ends the run. |

Generic phase transition code lives in `hurtBoss()`:

```js
while (b.phase < b.maxPhases && b.hp <= b.maxHp * (b.phaseThresholds[b.phase - 1] ?? 0.5)) {
  b.phase += 1;
  ...
  this.emitBossDialogue(b, `phase${b.phase}`);
  this.onBossPhase(b);
}
```

`BOSS_INFO[kind].phaseThresholds` defines the HP fraction for each next phase. `BOSS_INFO[kind].dialogue` holds `intro`, `phase2`, `phase3`, and `defeat` lines. Spawning a boss emits `bossDialogue` for `intro`; `finishBoss()` emits `defeat` before granting the blessing or victory.

Non-final bosses grant a blessing and open the next gate. `oathbreaker` has `reward: 'victory'`.

**Bug fixed during v0.0.5 verification:** Wyrm `dive` was clamped to `FLOOR_Y - b.h - 20`, so it never reached its rise threshold and looped in `dive` forever. Clamp is now `FLOOR_Y - b.h`. Do not reintroduce a floor offset above the dive landing threshold.

### Enemies

`ENEMY_INFO` drives base stats and the codex:

| Enemy | HP | Damage | Behaviour |
| --- | --- | --- | --- |
| Crawler | 34 | 8 | Fast ground chase. |
| Sentinel | 64 | 14 | Telegraphed lunge. |
| Hollow Wraith | 48 | 10 | Hovering; keeps distance; fires `wisp` projectiles. |
| Cinder Brute | 120 | 18 | Slow; telegraphed floor slam spawns shockwaves. |

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

`game.ash` is run-scoped currency. Rewards: crawler `8`, sentinel `15`, wraith `16`, brute `22`, Warden `60`, Wyrm `90`, Choir `110`, Oathbreaker `160`. Each kill emits `ashGain`.

`SHOP_ITEMS` (exported) drives both the shop UI and `game.buyShopItem(id)`:

| Item | Cost | Type | Effect |
| --- | --- | --- | --- |
| Pike Penjaga | 35 | weapon | Adds `pike`, equips it. |
| Busur Abu | 55 | weapon | Adds `bow`, equips it, grants 8 arrows. |
| Shuriken ×3 | 14 | consumable | Adds 3 shuriken. |
| Anak Panah ×6 | 12 | ammo | Requires `bow`; adds 6 arrows. |
| Isi Ulang Flask | 10 | flask | Restores all flask charges. |

`canShop()` requires a checkpoint in the current room and proximity (`<110 px` horizontally, `<150 px` vertically) to `room.merchant`. Shop is opened with `F` or the pause button. Purchases are run-scoped; ash is not persisted across full runs. Starting a run directly from Level Select grants a scaled stipend (rooms 2–8: 45, 90, 120, 155, 190, 240) so the shop is usable without replaying earlier rooms.

### Checkpoints

Boss rooms 2, 3, 5, and 7 define `checkpoint` and `merchant` at the entrance. `loadRoom()` sets `checkpoint` / `checkpointRoom` and emits `checkpoint`. `retryRun()` in `src/main.js` calls `game.respawnAtCheckpoint()` when available:

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

- `menuView`: `title | levels | credits | character | none`
- `started`, `paused`, `spectating`, `shopOpen`
- `mapOpen`, `codexOpen`, `codexTab`, `dialogueOpen`, `dialogueLines`, `dialogueIndex`, `dialogueMeta`
- `character` (`characterId`, `race`, `armor`, `skin`, `outfit`), persisted in `localStorage` key `ashen-vow-character-v1`
- `prologueActive`, `prologueIndex`, `prologueTimer`, `prologueTotal`, `prologueVoice`; `prologueDone` is the deferred start callback
- `spectateGame` is a separate `AshenGame` instance, never the live run.

Rules:

- Boot: `menuView = 'title'`, `started = false`, HUD hidden.
- `MULAI PERJALANAN` → `beginJourney()` → `startPrologue(() => startRun(0))`.
- `PILIH PENJAGA` → `showCharacter()`; roster, race, armor, skin, and outfit buttons call `setCharacter()`, which sanitizes, saves, and applies the appearance to the live game player.
- `startRun()` always applies the saved character after `game.reset()`; Level Select and retry call `startRun()` directly, so they never replay the prologue.
- While `prologueActive`: game simulation is frozen, HUD/touch are hidden, the cutscene canvas renders every frame, and each beat auto-advances after 5 s. `Space`/`Enter` advances, `Esc` skips, `N` toggles voice. Subtitles are DOM text and work without speech synthesis.
- `PILIH LEVEL` → cards for all 8 rooms.
- Locked card: **no `MAINKAN` button**, only `SNEAK PEEK`.
- Unlocked card: `MAINKAN` + `SNEAK PEEK`.
- `SNEAK PEEK` → `startSpectate(index)`, hides HUD/title, shows `#spectate-ui`.
- Spectate render call: `renderer.render(spectateGame, { spectate: true, cameraX })`.
  - `spectate: true` skips `drawPlayer`, shake, low-HP vignette, and gate chevrons.
- Spectate input: `←/→` or `A/D` pan; `Esc` / `Backspace` / `Q` returns to level select.
- Pause/death/victory screens link back to Level Select and Main Menu.
- Shop is a full-screen overlay (`#shop-screen`); while `shopOpen`, the simulation pauses, HUD/touch are hidden, and `Esc`/`F` closes it.
- Shop is available only when `game.checkpointRoom === game.roomIndex`; proximity to the merchant is required for `F`, while the pause button passes `force = true`.
- `M` opens/closes `#map-screen` from the title, pause, or mid-run; `I` opens `#codex-screen`. Both swap with each other (`btn-map-codex`, `btn-codex-map`).
- While `mapOpen`, `codexOpen`, or `dialogueOpen`, the fixed-step loop does not advance and HUD/touch are hidden.
- `bossDialogue` events call `queueDialogue()`; `Space`/`Enter`/`Esc` or the **LANJUT** button advances lines. Closing the last line resets `lastTime`/`accumulator`.
- Death retry uses checkpoint respawn when possible, preserving run inventory; otherwise it restarts the current room.
- Portrait phones: `.screen` overlays become fixed full-viewport scroll layers so menus are not clipped by the 16:9 game frame.

## 7. Verification

### Automated core tests

```bash
npm test
```

Current result: **56/56 passing**. Coverage includes:

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
- Warden phase transition and phase-II shockwaves;
- Warden defeat → 3 blessings → gate opens;
- ember blessing damage multiplier;
- Wyrm projectiles damaging the player;
- Wyrm dive/rise cycle and fireballs;
- **Wyrm phase transition and pillar attack**;
- **Wyrm defeat grants a blessing and unlocks chapter V**;
- **8 rooms and 4 bosses (`warden`, `wyrm`, `choir`, `oathbreaker`)**;
- **every boss has intro/phase/defeat dialogue; Oathbreaker adds phase III**;
- **wraith hover/wisp and brute slam/shockwave behaviour**;
- **Hollow Choir notes/beams and gate unlock**;
- **Oathbreaker three-phase transition and final victory**;
- **codex entries for enemies, weapons, bosses, and items**;
- **boss gates resolve against the current room, not a hardcoded index**;
- **two characters expose valid stats and default appearances; applyCharacter swaps HP/damage/speed and falls back to Sera**;
- **setAppearance sanitizes race, armor, skin, and outfit while preserving custom colors**;
- **character speed multiplier changes movement without changing the 30×46 hitbox**;
- **prologue has exactly 12 beats summing to 60 seconds, each with a label and subtitle line**;
- death freezes the simulation.

New tests added for v0.0.5–v0.0.7 menus, character customization, prologue, map, codex, and dialogue are browser-level, not all Node-level.

### Browser smoke tests

Run the server and Chrome with remote debugging:

```bash
npm start
chrome --remote-debugging-port=9333 --user-data-dir=<temp> http://127.0.0.1:4300/
```

Verified through Chrome DevTools Protocol (v0.0.7):

- character screen opens from the title with 2 characters, 5 races, 5 armors, 8 skin tones, and 8 outfit colors;
- selecting Karn, Goblin, Royal, and custom swatches updates the live preview, the game player, and `ashen-vow-character-v1`;
- saved appearance survives leaving and reopening the screen;
- prologue starts from the character screen at beat 1/12, renders the cutscene canvas, shows subtitles, and auto-advances after 5 s;
- `Space` advances a beat, voice toggle changes state, skip starts the run in room 0 with the chosen stats (125 HP for Karn) and appearance;
- Level Select start skips the prologue;
- map/codex still open, render 8 rooms and 4 tabs;
- mobile 390×844 character screen has zero horizontal overflow and the prologue subtitle stays on screen;
- no page exceptions and no console errors.

> `requestAnimationFrame` is throttled when the Chrome page is backgrounded. Call `Page.bringToFront` in CDP before asserting anything that depends on the game loop.

## 8. Debug hooks

`window.__ashen` exists for smoke tests:

- Getters: `game`, `renderer`, `started`, `paused`, `spectating`, `menuView`, `progress`, `shopOpen`, `mapOpen`, `codexOpen`, `dialogueOpen`, `prologueActive`, `prologueIndex`, `prologueBeat`, `prologueVoice`, `character`.
- Navigation: `start`, `restart`, `retry`, `showMenu`, `showLevels`, `showCredits`, `showCharacter`, `closeCharacter`, `enterRoom`, `clearProgress`.
- Character/prologue: `buildCharacterScreen`, `setCharacter`, `setCharacterField`, `saveCharacter`, `beginJourney`, `startPrologue`, `advancePrologue`, `finishPrologue`, `togglePrologueVoice`.
- Overlays: `openMap`, `closeMap`, `toggleMap`, `openCodex`, `closeCodex`, `advanceDialogue`.
- Spectate: `startSpectate`, `stopSpectate`.
- Simulation: `step`, `tap`, `damageBoss`, `chooseBlessing`, `togglePause`.
- Shop/economy: `openShop`, `closeShop`, `buyShopItem`, `respawnAtCheckpoint`, `giveAsh`.
- Inspect: `snap()` returns state, room, HP, relics, ash, weapon/ammo, checkpoint room, boss phase/state, gate, view flags, progress.

## 9. Known limitations / next roadmap

- No save-slot UI; single browser profile progress only.
- Ash is run-scoped and is not persisted with level progress; weapons are re-earned each run.
- Sneak Peek has no touch pan control; camera auto-drifts.
- No new game plus, no difficulty selection, no controller mapping screen.
- Audio is procedural only; no recorded music or voice files. Prologue narration depends on the browser speech-synthesis voices, but subtitles always carry the story.
- Art is procedural; no sprite/tileset pipeline.
- Boss tuning lives in constants inside `src/core.js`; the data tables (`BOSS_INFO`, `ENEMY_INFO`, `CODEX`) are the extension point.
- Enemy AI is platform-aware but not a full navmesh; complex multi-level layouts may still need hand-tuned jumps.
- Codex screens are informational; no unlock tracking or per-entry discovery gating yet.

## 10. Working agreements for future changes

1. Keep `src/core.js` pure and deterministic; add a Node test for every mechanic change.
2. Content counts live in data: adding a room or boss must update `ROOMS`, `BOSS_INFO`, `ENEMY_INFO`/`CODEX`, `LEVEL_META`, and the tests together.
3. Never bypass the phase-transition loop when touching boss damage or death logic; `phaseThresholds` must stay sorted from highest to lowest.
4. Keep menu-first boot; never auto-start gameplay on load.
5. Locked levels must remain viewable only through Sneak Peek, never playable.
6. Preserve the exact credits wording.
7. Verify on desktop and portrait mobile; run `npm test` before committing.
8. Update `README.md` and this file when behaviour or content changes.
9. Checkpoint retry must never erase ash, owned weapons, ammo, shuriken, or blessings.
10. New purchasable items must be added to `SHOP_ITEMS` (and `CODEX.items`) and validated in `buyShopItem()` with a Node test.
11. Every boss must ship with `intro`, one `phaseN` entry per extra phase, and `defeat` dialogue; `emitBossDialogue()` handles the rest.
