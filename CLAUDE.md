# Ashen Vow — Claude Master Plan

> Compressed handoff for continuing **Ashen Vow v0.3.0**.
> Status: **playable, browser-verified, Milestones A and B plus Sigil & Ritual and the Echoes of the Forgotten World expansion complete**.
> Roadmap: [`MASTERPLAN.md`](MASTERPLAN.md).
> Repo: `https://github.com/FahmiGF/Ashen-Vow-` · branch `main` · push account `isshinAshinaSeal`.

## 1. Product definition

**Ashen Vow** is a 2D medieval metroidvania / roguelike-lite played in the browser.
The UI is Indonesian; the tone is dark-fantasy ash and oath imagery.

Non-negotiable v0.1.0 requirements (v0.0.7/v0.0.8 scope preserved):

1. Boot into a **startup menu**, never directly into gameplay.
2. **14 rooms and 6 bosses**; every boss has at least 2 phases and The Oathbreaker and The Sporebound have 3.
3. Every boss speaks at fight start, at each phase, and on defeat.
4. **Level Select** shows all 14 rooms; unfinished rooms are **locked**; room 12 stays hidden until discovered.
5. Locked rooms expose **Sneak Peek**: spectate-only, no player, no HUD.
6. The **map** (`M`) opens from the menu, pause screen, or mid-stage.
7. The **codex** (`O`) indexes enemies, weapons, bosses, and items/consumables. `I` is the in-run inventory.
8. Credits must contain: **“Made by SealiusHQ with a lot of support from Contributors”**.
9. Progress persists across reloads.
10. Combat must be real and testable, not a mock.
11. Every boss room keeps a **Warung Abu checkpoint** at its entrance.
12. Weapons, ammunition, and consumables are bought with run-scoped **ash**; keep `SHOP_ITEMS`, `WEAPONS`, `BOSS_INFO`, `ENEMY_INFO`, and `CODEX` data-driven.
13. **Ten selectable characters/classes** at the menu: Knight (Sera), Elf Archer (Lyna), Assassin (Kael), Brawler (Karn), Mage (Ignis), Gladiator (Varek), Netfighter (Neris), Stormcaller (Astra), Sentinel (Bram), and Warden (Maera), each with a unique active ability.
14. **Character customization** before starting: race (human, elf, goblin, orc, devil), 5 armor styles, skin color, and outfit color, with a live Canvas preview featuring runic altar, sparkling glitter stars, and transition pulse VFX.
15. A **60-second narrative prologue** plays before the first stage on a new journey, with voice-over and always-visible subtitles; it is skippable and never replays from Level Select.
16. **Procedural zone music** with a shared engine, per-zone tracks, boss theme, victory theme, crossfade, and a combat layer; no audio files.
17. **Settings** for audio, one or two rebindable slots per action with conflict resolution, gamepad, and accessibility; stored under `ashen-vow-settings-v1`, independent of progress.
18. **Interactive map v1** with fog of war, zone colours, markers, legend, pan/zoom/recenter, and up to 10 persistent pins.
19. **Five zone definitions** in `src/zones.js`; the current 14 rooms map across four playable zones (`mycelial` rooms 8–13 shipped in v0.1.0) so future biomes do not touch audio or map code.
20. **Mycelial Hollow branch** — entered from room 2 after the Warden falls; 6 rooms, spore trampolines, climbable mycelium, Sporeling/Stalker/Brood Mother, The Sporebound, optional Root of the First Vow behind a 120-HP breakable wall, and a return gate to room 2.
21. **Sigil & Ritual (v0.2.0)** — 4 permanent Sigils, 4 counted Ritual items, 6 consumables, quick-item cycling (`R`), an in-run Inventory overlay (`I`), a Whetstone damage buff, and an in-game Update Log (`src/updates.js`) reachable from the main menu.
22. **Echoes of the Forgotten World (v0.3.0)** — 100 expansion levels in 10 chapters (7 standard + 1 environmental + 1 elite mini-boss + 1 major boss each), 10 biomes, 100 enemy base types with 300 variants, 20 mini-bosses, 10 major bosses, 5 difficulties, 6 modifiers, 5 NG+ tiers, 8 repeatable modes, 4 endgame trials, Thornveil Haven with 10 fixed NPCs / 8 upgrades / 12 quests, 8 settlements, 52 NPCs, 6 seasonal events, 32 visual-only skins, 12 collectible categories with 120 entries, and save-compatible progress under `progress.expansion`.
23. **Expansion hub** (`X` or the main-menu button) with four tabs: **Kampanye**, **Thornveil Haven**, **Ashen Chronicle**, and **Lemari & Jurnal**. All expansion content is real playable data, not documentation-only.

## 2. Stack and constraints

| Area | Choice |
| --- | --- |
| Runtime | Zero-build HTML5 Canvas + vanilla ES modules |
| Server | `server.js`, static files, `http://127.0.0.1:4300` |
| Dependencies | None at runtime, none at test time |
| Simulation | Deterministic fixed timestep, `1 / 120 s`, no DOM |
| Tests | `node --test`, pure Node against `src/core.js` + foundation modules; CDP smoke for browser flows |
| Audio | Procedural WebAudio SFX (`src/audio.js`) and music (`src/music.js`), no audio files |
| Visuals | Procedural Canvas drawing, no image assets |
| Persistence | Progress `ashen-vow-progress-v1`; settings `ashen-vow-settings-v1`; character `ashen-vow-character-v1` |

Do **not** add a framework, bundler, or asset pipeline unless the product scope changes.

## 3. File map

| File | Responsibility |
| --- | --- |
| `index.html` | Canvas shell, HUD, main menu, character screen, prologue screen, level select, credits, map, codex, boss dialogue, Sneak Peek UI, Warung Abu, overlays |
| `styles.css` | Medieval theme, responsive layout, portrait menu fix, touch controls, shop/map/codex/dialogue cards |
| `src/core.js` | Pure simulation: player, characters/appearance, enemies, bosses, dialogue, codex, weapons, projectiles, ash, shop, checkpoints, gates, blessings, events |
| `src/render.js` | Canvas renderer; supports `render(game, { spectate, cameraX })` and all six bosses plus mycelial traversal art |
| `src/audio.js` | Procedural SFX plus master/music/SFX gain buses and `applyVolumes()` |
| `src/music.js` | Procedural `TRACKS` and `MusicManager`: play/crossfade, combat layer, stop, volume, `mycelialBoss` |
| `src/settings.js` | Settings model, two-slot bindings, conflict swap/reset, gamepad mapping, sanitize/load/save |
| `src/expansion.js` | Expansion data and generators: 10 chapters/biomes, 100 levels, enemies/variants, 30 bosses, 52 NPCs, settlements, quests, events, skins, modes, trials, collectibles, progression helpers |
| `src/zones.js` | Legacy `ZONES` + 10 biome zones, `ROOM_ZONES` (14 legacy entries), and `zoneForRoom` / `zoneMusicForRoom` |
| `src/map.js` | Map model (fog, adjacency, pins, stats, 14-node layout) + `MapView` canvas renderer |
| `src/prologue.js` | 12-beat, 60-second prologue timeline plus procedural cutscene art (`drawPrologue`) |
| `src/main.js` | Menus, character customization, prologue playback, progress, settings UI, music sync, map/shop/codex/dialogue UI, fixed-step loop, input, HUD, debug hooks |
| `tests/core.test.js` | 64 deterministic Node tests |
| `tests/expansion.test.js` | 10 tests for expansion data counts, room/boss lookups, unlocks, save migration, quests, events, haven bonuses, modifiers, collectibles |
| `tests/foundations.test.js` | 15 tests for settings, bindings, persistence, gamepad, map fog/pins/stats, zones, music safety |
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
  - `wallHit`, `wallBroken` — the mycelial secret wall absorbs damage or shatters.
  - `flaskReward { maxFlasks }` — Root of the First Vow grants a permanent flask charge.
  - `bounce`, `spore`, `sporeCloud` — spore trampolines and spore attacks.
  - `roomCondition { room, weather, condition }` — expansion biome weather/condition on room entry.
  - `collectible { id, name, category }` — expansion collectible picked up.
  - `echoGain { amount, total }` — expansion currency gained.
  - `campaignComplete { room, chapter }` — final expansion boss defeated.
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
| 8 | Lubang Masuk | The Entry Shaft | Clear sporelings; gate east to 9 | — |
| 9 | Taman Spora | Spore Gardens | Clear sporelings/stalker; gate east to 10 | — |
| 10 | Jembatan Gantung | Hanging Bridges | Clear stalkers; gate east to 11 | — |
| 11 | Sarang Induk | Brood Nest | East gate to 13 (clear); west secret gate to 12 (wall) | — |
| 12 | Relung Tersembunyi | Hidden Alcove | Boss gate back to 11; hidden card until discovered | Root of the First Vow |
| 13 | Altar Spora | Spore Altar | Boss gate back to 2 | The Sporebound |

Room 2 publishes two gates: east to room 3 and west to room 8, both requiring `boss`. Clearing room `i` marks `cleared[i] = true` and raises `unlocked` using both `index + 2` and the actual `nextIndex + 1`, so branch destinations never under-unlock the level select. Progress shape:

```js
{
  version: 1,
  unlocked: 1,
  cleared: [false, false, false, false, false, false, false, false, false, false, false, false, false, false],
  map: {
    discovered: [true, false, false, false, false, false, false, false, false, false, false, false, false, false],
    pins: [] // { x, y, type: 'note'|'water'|'key'|'return', room }
  }
}
```

Stored in `localStorage` key **`ashen-vow-progress-v1`**. A v0.0.7 save (no `map`) migrates by marking every cleared room and room 0 as discovered. Settings live in **`ashen-vow-settings-v1`** and must never be cleared by `clearProgress()`.

### Zones

`src/zones.js` owns five zones: `ashen`, `mycelial`, `cistern`, `frostglass`, `cinder`. Each defines a palette, particle mood, map colour, and music/boss-music IDs. Current mapping:

```js
ROOM_ZONES = ['ashen', 'ashen', 'ashen', 'cinder', 'ashen', 'frostglass', 'frostglass', 'cinder', 'mycelial', 'mycelial', 'mycelial', 'mycelial', 'mycelial', 'mycelial'];
```

Adding a zone or room must not touch `src/audio.js`, `src/music.js`, or `src/map.js`; extend `ZONES`, `ROOM_ZONES`, and `MAP_LAYOUT` instead.

### Bosses — six bosses, up to three phases

| Boss | Kind | HP | Phases | Notes |
| --- | --- | --- | --- | --- |
| **Sir Mordrake, The Fallen Warden** | `warden` | 340 | 2 | Chase, telegraphed slash, ground slam with shockwaves. Phase II is faster and adds shockwaves. |
| **Vhael, The Ashen Wyrm** | `wyrm` | 480 | 2 | Hover, fireball volley, dive. Phase II adds **fire pillars**. |
| **The Hollow Choir** | `choir` | 560 | 2 | Flying spectral choir; spiral **note** projectiles and vertical **beam**; phase II adds echo patterns. |
| **The Oathbreaker** | `oathbreaker` | 720 | 3 | Final boss; slash, dash, volley, nova. Phase III unlocks the full pattern set; defeat ends the run. |
| **The Sporebound** | `sporebound` | 780 | 3 | Mycelial boss; spore projectiles, spore clouds, brood adds. Phase II/III at 66%/33% HP accelerate patterns. |
| **Root of the First Vow** | `root` | 360 | 2 | Optional mini-boss behind the room-11 breakable wall; grants `+1 max flask` and a full refill, then opens the gate back to room 11. |

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

Non-final bosses grant a blessing and open the next gate. `oathbreaker` has `reward: 'victory'`. `root` has `reward: 'flask'`: `finishBoss()` increments `player.maxFlasks`, refills `player.flasks`, emits `flaskReward`, leaves `state = 'playing'` (no blessing), and opens the gate back to room 11; the extra flask is run-scoped, not persisted to meta-progress.

**Bug fixed during v0.0.5 verification:** Wyrm `dive` was clamped to `FLOOR_Y - b.h - 20`, so it never reached its rise threshold and looped in `dive` forever. Clamp is now `FLOOR_Y - b.h`. Do not reintroduce a floor offset above the dive landing threshold.

### Enemies

`ENEMY_INFO` drives base stats and the codex:

| Enemy | HP | Damage | Behaviour |
| --- | --- | --- | --- |
| Crawler | 34 | 8 | Fast ground chase. |
| Sentinel | 64 | 14 | Telegraphed lunge. |
| Hollow Wraith | 48 | 10 | Hovering; keeps distance; fires `wisp` projectiles. |
| Cinder Brute | 120 | 18 | Slow; telegraphed floor slam spawns shockwaves. |
| Sporeling | 30 | 9 | Hops toward the player and emits a slow spore cloud on death. |
| Mycelial Stalker | 76 | 16 | Burrows (immune to contact/projectiles/melee), emerges under the player, then lunges. |
| Brood Mother | 150 | 15 | Ground controller that spawns Sporeling adds during the fight. |

### Echoes of the Forgotten World — expansion content

`src/expansion.js` is the single source of truth. `EXPANSION_ROOMS` are generated deterministically and appended as `ALL_ROOMS = [...ROOMS, ...EXPANSION_ROOMS]`; global indices are **14–113**. Legacy `ROOMS` stays at 14 and `ROOM_ZONES` stays at 14 so map/level-select/tests keep their original contract. `ZONES` gains 10 biome zones appended from `BIOMES`.

| Area | Content |
| --- | --- |
| Chapters | 10 × 10 levels: 7 `standard`, 1 `special` (environmental/puzzle + mini-boss), 1 `elite` (mini-boss), 1 `boss` (major boss) |
| Biomes | Hutan Abu, Rawa Tulang, Kawah Gema, Kota Terkubur, Gua Kristal, Padang Badai, Kuil Akar, Lautan Kabut, Menara Waktu, Singgasana Terlupakan |
| Enemies | 100 base types mapped to `chaser`, `lunge`, `ranged`, `slam`, `burrower`, `spawner`, `hopper`; 300 variants |
| Bosses | 20 mini-bosses (`mini_*`, patterns slam/volley/ring/charge/summon/rain) + 10 chapter bosses (`echo_boss_*`, `major: true`); final boss reward `victory` |
| Difficulty | Cerita, Normal, Veteran, Mimpi Buruk, Master Abu; reward multiplier per mode |
| Modifiers | Kulit Besi, Bilah Kaca, Paceklik, Buruan, Rapuh, Buta Kabut |
| NG+ | 5 tiers; tier 0 is the first journey, tiers 1–4 unlock after campaign completion |
| Modes | Ujian Gema, Boss Rush, Gelombang Abu, Gauntlet, Buruan Besar, Perburuan Relik, Cermin Sumpah, Tanpa Akhir |
| Trials | Gema Tanpa Akhir, Ruang Kenangan, Nama Terakhir, Pertahanan Thornveil |
| Haven | Thornveil Haven + 7 outposts; 10 fixed haven NPCs, 52 NPCs total; 8 upgrades, 12 quests |
| Events | 6 seasonal themes (local month check), missions, reward tracks, shops, 20+ event skins; claimed rewards never expire |
| Collection | 12 categories × 10 items = 120 collectibles; 32 skins total, all visual-only |

Expansion progress lives at `progress.expansion` inside the existing `ashen-vow-progress-v1` save. `sanitizeExpansionProgress()` fills defaults, clamps numbers, filters unknown IDs, preserves unknown top-level fields and `__mission_*` counters, and never deletes earned cosmetics, claimed event rewards, quests, stash, modes, flags, or stats.

Expansion run wiring in `src/main.js`:

- `startExpansionLevel(localIndex, options)` sets `activeRunKind = 'expansion'`, applies difficulty/modifiers/NG+/skin, provisions echo-based ash, and transfers the event stash into run consumables.
- `startExpansionMode()` / `startExpansionTrial()` start at the mode's `startIndex` and force the mode's modifiers.
- `drainEvents()` routes `gatePass`, `bossDown`, `collectible`, `echoGain`, and `campaignComplete` to expansion handlers only when `activeRunKind === 'expansion'`.
- `handleExpansionBoss()` marks clears, advances quests/events, grants skins on chapter milestones, unlocks the next chapter, and handles the final campaign completion.
- `handleExpansionCollectible()` persists the ID and advances `collectibles`/category quests and events.

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

`game.ash` is run-scoped currency. Rewards: crawler `8`, sentinel `15`, wraith `16`, brute `22`, sporeling `10`, stalker `20`, brood mother `32`, Warden `60`, Wyrm `90`, Choir `110`, Sporebound `150`, Root `80`, Oathbreaker `160`. Each kill emits `ashGain`.

`SHOP_ITEMS` (exported) drives both the shop UI and `game.buyShopItem(id)`:

| Item | Cost | Type | Effect |
| --- | --- | --- | --- |
| Pike Penjaga | 35 | weapon | Adds `pike`, equips it. |
| Busur Abu | 55 | weapon | Adds `bow`, equips it, grants 8 arrows. |
| Shuriken ×3 | 14 | consumable | Adds 3 shuriken. |
| Anak Panah ×6 | 12 | ammo | Requires `bow`; adds 6 arrows. |
| Isi Ulang Flask | 10 | flask | Restores all flask charges. |

`canShop()` requires a checkpoint in the current room and proximity (`<110 px` horizontally, `<150 px` vertically) to `room.merchant`. Shop is opened with `F` or the pause button. Purchases are run-scoped; ash is not persisted across full runs. Starting a run directly from Level Select grants a scaled stipend (rooms 2–14: 45, 90, 120, 155, 190, 240) so the shop is usable without replaying earlier rooms.

### Mycelial traversal, gates, and the secret wall

- `bounce` pads: landing on a pad sets `vy = -power` and emits `bounce`; rooms 8 and 9 use them to cross gaps.
- `climbs`: while overlapping a strip and holding jump, the player ascends and sets `player.climbing`; releasing jump drops normally.
- `secretWall { x, y, w, h, hp }` in room 11: melee and player projectiles damage it through `damageWall()`; hits emit `wallHit` and the break emits `wallBroken`. Its west gate uses `requires: 'wall'`.
- `roomGateDefs(room)` returns `room.gates` when present, otherwise `[room.gate]`; `primaryGateDef(room)` picks the first non-secret gate. `updateGate()` iterates all gates, passes the real `next` destination, and sets a 0.6 s `gateLock` after `loadRoom` to prevent double transitions.
- Room 12 is marked `LEVEL_META[12].secret`; its Level Select card shows `???` until `progress.map.discovered[12]` is true.

### Checkpoints

Boss rooms 2, 3, 5, 7, and 13, plus mycelial rooms 8 and 10, define `checkpoint` and `merchant` at the entrance. `loadRoom()` sets `checkpoint` / `checkpointRoom` and emits `checkpoint`. `retryRun()` in `src/main.js` calls `game.respawnAtCheckpoint()` when available:

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

- `menuView`: `title | levels | credits | updates | character | expansion | none`
- `expansionTab`: `campaign | haven | chronicle | wardrobe`; `expansionChapter`, `chronicleEventId`, `havenNpcId`, `wardrobeFilter`
- `started`, `paused`, `spectating`, `shopOpen`
- `mapOpen`, `codexOpen`, `codexTab`, `dialogueOpen`, `dialogueLines`, `dialogueIndex`, `dialogueMeta`
- `settingsOpen`, `settingsTab` (`audio | controls | gameplay`), `settingsCapture`, `settingsConflict`
- `settings` (`audio`, `gameplay`, `bindings`), loaded from `ashen-vow-settings-v1`; `desiredMusic`, `audioUnlocked`, `padHeld`, `mapView`, `mapPinType`, `mapDrag`
- `character` (`characterId`, `race`, `armor`, `skin`, `outfit`), persisted in `localStorage` key `ashen-vow-character-v1`
- `prologueActive`, `prologueIndex`, `prologueTimer`, `prologueTotal`, `prologueVoice`; `prologueDone` is the deferred start callback
- `spectateGame` is a separate `AshenGame` instance, never the live run.

Rules:

- Boot: `menuView = 'title'`, `started = false`, HUD hidden.
- `MULAI PERJALANAN` → `beginJourney()` → `startPrologue(() => startRun(0))`.
- `PILIH PENJAGA` → `showCharacter()`; roster, race, armor, skin, and outfit buttons call `setCharacter()`, which sanitizes, saves, and applies the appearance to the live game player.
- `startRun()` always applies the saved character after `game.reset()`; Level Select and retry call `startRun()` directly, so they never replay the prologue.
- While `prologueActive`: game simulation is frozen, HUD/touch are hidden, the cutscene canvas renders every frame, and each beat auto-advances after 5 s. `Space`/`Enter` advances, `Esc` skips, `N` toggles voice. Subtitles are DOM text and work without speech synthesis.
- `PILIH LEVEL` → cards for all 14 legacy rooms; room 12 renders as a hidden `???` card until discovered.
- `ECHOES OF THE FORGOTTEN WORLD` (menu button or `X`) → `showExpansion(tab)` → `#expansion-screen` with four tabs. `Esc` returns to the title. Campaign tab selects chapters/levels, difficulty, modifiers, NG+, modes, and trials; Haven handles NPC dialogue, upgrades, and quest claims; Chronicle handles event missions/reward tracks/shop; Wardrobe handles skin equip and the collection journal.
- Locked card: **no `MAINKAN` button**, only `SNEAK PEEK`.
- Unlocked card: `MAINKAN` + `SNEAK PEEK`.
- `SNEAK PEEK` → `startSpectate(index)`, hides HUD/title, shows `#spectate-ui`.
- Spectate render call: `renderer.render(spectateGame, { spectate: true, cameraX })`.
  - `spectate: true` skips `drawPlayer`, shake, low-HP vignette, and gate chevrons.
- Spectate input: `←/→` or `A/D` pan; `Esc` / `Backspace` / `Q` returns to level select.
- Pause/death/victory screens link back to Level Select and Main Menu.
- Shop is a full-screen overlay (`#shop-screen`); while `shopOpen`, the simulation pauses, HUD/touch are hidden, and `Esc`/`F` (or the rebound `interact` key) closes it.
- Shop is available only when `game.checkpointRoom === game.roomIndex`; proximity to the merchant is required for `interact`, while the pause button passes `force = true`.
- `M`/`Tab` (rebindable action `map`) opens/closes `#map-screen` from the title, pause, or mid-run; `I` opens `#codex-screen`. Both swap with each other (`btn-map-codex`, `btn-codex-map`).
- While `mapOpen`, `codexOpen`, `settingsOpen`, or `dialogueOpen`, the fixed-step loop does not advance and HUD/touch are hidden.
- Settings open from the title (`btn-settings-menu`) or pause (`btn-pause-settings`). Every change persists immediately. Rebinding captures the next key; `Esc` cancels; a used key offers **TUKAR** (swap with the other action) or **BATAL**.
- Music selection: `desiredTrack()` returns `victory`, the zone's boss track (`boss`, or `mycelialBoss` in Mycelial Hollow) while a live boss is present, otherwise the current room's zone track, and `menu` outside a run. `syncMusic()` crossfades and fades the combat layer in when enemies are near. Music only starts after the first user gesture (`audioUnlocked`).
- Map discovery: entering a room and clearing it both call `discoverCurrentRoom()`; fog reveals direct neighbours as outlines. Pins are placed by clicking the map, removed by right-clicking near one, and capped at 10. The room-12 card stays hidden until the room is discovered.
- `bossDialogue` events call `queueDialogue()`; `Space`/`Enter`/`Esc` or the **LANJUT** button advances lines. Closing the last line resets `lastTime`/`accumulator`.
- Death retry uses checkpoint respawn when possible, preserving run inventory; otherwise it restarts the current room.
- Portrait phones: `.screen` overlays become fixed full-viewport scroll layers so menus are not clipped by the 16:9 game frame.

## 7. Verification

### Automated core tests

```bash
npm test
```

Current result: **103/103 passing**. Coverage includes:

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
- **14 rooms and 6 bosses (`warden`, `wyrm`, `choir`, `oathbreaker`, `sporebound`, `root`)**;
- **every boss has intro/phase/defeat dialogue; Oathbreaker and Sporebound add phase III**;
- **wraith hover/wisp and brute slam/shockwave behaviour**;
- **sporeling hop, stalker burrow/emerge/lunge, and brood mother add spawning**;
- **spore trampolines launch the player and mycelium climbing raises them**;
- **the secret mycelial wall takes 120 damage from melee/projectiles, opens its gate, and room 12 stays secret until discovered**;
- **room 2 west gate enters Mycelial Hollow after the Warden falls; the Sporebound's final gate returns to room 2**;
- **Sporebound phase II/III transitions, defeat blessing, and room 2 persistence**;
- **Root of the First Vow grants `+1 max flask`, refills charges, and stays `playing`**;
- **mycelial room discovery and clear state extend the 14-slot progress arrays**;
- **Hollow Choir notes/beams and gate unlock**;
- **Oathbreaker three-phase transition and final victory**;
- **codex entries for 7 enemies, 3 weapons, 6 bosses, and items**;
- **boss gates resolve against the current room, not a hardcoded index**;
- **five characters expose valid stats and default appearances; applyCharacter swaps HP/damage/speed and falls back to Sera**;
- **setAppearance sanitizes race, armor, skin, and outfit while preserving custom colors**;
- **character speed multiplier changes movement without changing the 30×46 hitbox**;
- **prologue has exactly 12 beats summing to 60 seconds, each with a label and subtitle line**;
- **default settings define two unique bindings per action; sanitize clamps audio/gameplay and repairs broken bindings**;
- **settings persist under their own key and survive reload/corrupt JSON**;
- **rebinding swaps with the conflicting action and never leaves duplicate keys**;
- **gamepad mapping respects standard buttons and axis deadzones**;
- **map layout covers every room with two-way valid exits**;
- **fog of war reveals neighbours, and map stats count discovery/bosses/relics/pins**;
- **pins are sanitized, capped at 10, and removable**;
- **every room maps to a known zone with its own track, palette, and particle mood**;
- **MusicManager is safe without an AudioContext**;
- **expansion data targets: 100 levels, 10 chapters with 7+1+1+1 composition, 10 biomes, 100 enemies, 300 variants, 20 mini-bosses, 10 major bosses, 52 NPCs, 8 settlements, 8 upgrades, 12 quests, 6 events, 32 skins, 12 categories / 120 collectibles, 8 modes, 5 NG+ tiers, 4 trials**;
- **legacy `ROOMS` stays at 14 and `CODEX` at 7 enemies / 6 bosses while `ALL_ROOMS` reaches 114 and `ALL_BOSS_INFO` 36**;
- **expansion rooms connect 14→113 and the final boss uses reward `victory`**;
- **level unlock gates, boss lookups, and mini/major boss classification**;
- **save migration preserves sparse clears, quests, upgrades, event claims, stash, modes, flags, stats, and unknown fields**;
- **quest progress matches objective types and freezes completed quests**;
- **event progress only advances active months; claimed missions/tiers/shop items and cosmetics survive expiry**;
- **haven bonuses stack, modifiers multiply, collectible counts group by category, and save summaries report correctly**;
- death freezes the simulation.

New tests added for v0.0.5–v0.1.0 menus, character customization, prologue, settings, map, zones, music, codex, dialogue, and Mycelial Hollow are partly browser-level; the pure model layers have Node tests.

### Browser smoke tests

Run the server and Chrome with remote debugging:

```bash
npm start
chrome --remote-debugging-port=9333 --user-data-dir=<temp> http://127.0.0.1:4300/
```

Verified through Chrome DevTools Protocol (v0.3.0 Echoes of the Forgotten World smoke, **15/15 checks, no console errors**):

- boot reports v0.3.0 on the title screen with clean expansion progress;
- campaign tab renders 10 chapters, 10 levels, and progression controls;
- Thornveil Haven renders 10 NPCs, 8 upgrades, 12 quests, and 8 settlements;
- Ashen Chronicle shows 6 events with the November festival active;
- wardrobe renders 32 skins and a 12-category collection journal;
- starting level 1 enters expansion room 14 with enemies and challenge state;
- starting Ujian Gema uses its expansion start room and mode modifier;
- a haven upgrade and quest claim spend/earn echoes and persist flags;
- chronicle mission and tier claims persist and grant rewards;
- equipping an event skin updates the active run and save;
- expansion progress, event rewards, haven upgrade, and skin survive reload;
- the expansion hub reopens with the saved summary after reload;
- defeating a chapter boss clears the level, grants echoes, and opens a blessing;
- the final chapter boss completes the campaign and unlocks New Game Plus;
- no runtime exceptions or console errors during the flow.

Verified through Chrome DevTools Protocol (v0.1.0 Mycelial Hollow smoke, 36/36 checks, no console errors):

- boot exposes `window.__ashen`, 14 level cards, and starts in Ashen Hall (room 2);
- the Warden spawns, defeat offers a blessing, and the west gate opens only after choosing one;
- walking through the west gate enters room 8, discovers it in memory and localStorage, and the spore trampoline launches the player;
- holding jump inside the mycelium strip climbs; clearing rooms 8→9→10→11 transitions through the real east gates;
- sword swings deal 120 damage to the secret wall, the west secret gate enters room 12, and discovery persists;
- Root spawns at 360 HP, dies to `damageBoss`, grants `+1 max flask` plus a full refill, marks room 12 cleared, and opens the return gate;
- the brood nest east gate enters room 13; the Sporebound spawns at 780 HP, reaches phase II/III, offers a blessing, and its gate returns to room 2 with the Warden still defeated;
- all six mycelial rooms are discovered and cleared in progress and localStorage; reload preserves discovered/cleared/unlocked state and reveals the room-12 card.

Verified through Chrome DevTools Protocol (v0.0.8):

- boot has `window.__ashen`, title visible, settings button, map canvas, FPS badge;
- settings open from the title, render 3 tabs / 3 audio sliders / 24 bind buttons / 3 gameplay selects, then close;
- changing the music slider persists `31` to `ashen-vow-settings-v1` while progress stays in its own key;
- rebinding Jump to `KeyL` detects the Dash conflict, swaps to `jump: [KeyL, KeyW]` / `dash: [ShiftLeft, Space]`, and reset-all restores defaults;
- audio unlocks on a pointer event, creates an AudioContext, starts `menu`, then crossfades to `ashen` after starting room 0;
- clicking the map places a pin, saves it to `ashen-vow-progress-v1`, and renders 6 stat cells;
- start/step, pause, shop, codex, and map overlays all open and close without page exceptions or console errors.

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

- Getters: `game`, `renderer`, `started`, `paused`, `spectating`, `menuView`, `progress`, `expansion`, `settings`, `musicTrack`, `audioState`, `mapData`, `shopOpen`, `mapOpen`, `codexOpen`, `dialogueOpen`, `prologueActive`, `prologueIndex`, `prologueBeat`, `prologueVoice`, `character`.
- Navigation: `start`, `restart`, `retry`, `showMenu`, `showLevels`, `showExpansion`, `showCredits`, `showSettings`, `closeSettings`, `showCharacter`, `closeCharacter`, `enterRoom`, `clearProgress`.
- Expansion: `buildExpansionScreen`, `startExpansionLevel`, `startExpansionMode`, `startExpansionTrial`, `claimQuest`, `buyHavenUpgrade`, `equipSkin`, `claimEventMission`, `claimEventTier`, `buyEventShop`.
- Settings: `buildSettings`, `applySettings`.
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
- Per-action gamepad rebinding is not available (gamepad buttons are fixed to the standard layout); difficulty, modifiers, NG+, repeatable modes, and endgame trials exist in the expansion hub.
- Expansion enemies reuse seven AI archetypes rather than 100 bespoke scripts; boss patterns reuse six configurable families. Content is data-driven and real, but not every enemy/boss is hand-animated.
- Seasonal events use the local clock and are intentionally offline/local; there is no server-authoritative event verification.
- Audio is procedural only; no recorded music or voice files. Tracks are short patterns, so long sessions may notice looping. Prologue narration depends on browser speech-synthesis voices, but subtitles always carry the story.
- Art is procedural; no sprite/tileset pipeline.
- Only four of the five configured zones have playable rooms; Tidewrought Cistern exists only as configuration until Milestone C.
- No fast travel, trailer, branching story, or multiple endings yet (Milestones D–E).
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
12. Settings and keybindings must stay in `ashen-vow-settings-v1`; clearing progress must never clear them. Add a clamp/sanitize test for every new setting.
13. New rooms must add a `MAP_LAYOUT` node with two-way exits and a `ROOM_ZONES` entry; the map is generated, never hand-written.
14. New zones must define palette, particle, map colour, and track IDs in `ZONES`, plus a track in `TRACKS`. Do not special-case zone names in `main.js`.
15. Keep `window.__ashen` in sync with new UI state so CDP smoke tests can drive real flows.
16. Preserve the expansion invariants: legacy `ROOMS` 14 entries, `ROOM_ZONES` 14 entries, `CODEX` 7 enemies / 6 bosses, and save keys `ashen-vow-progress-v1` / `ashen-vow-character-v1` / `ashen-vow-settings-v1`.
17. Expansion levels use global indices 14–113 through `ALL_ROOMS`; never renumber legacy rooms.
18. Cosmetics are visual-only. Never add combat stats to `COSMETIC_SKINS`, event rewards, or wardrobe items.
19. Event rewards that were already claimed must survive event expiry and save reloads; test this whenever event logic changes.
20. New expansion data belongs in `src/expansion.js`; keep `src/core.js` free of hardcoded chapter tables.
