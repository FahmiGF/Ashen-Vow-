# Ashen Vow — Claude Master Plan

> Compressed handoff for continuing **Ashen Vow v0.39.0**.
> Status: **playable, browser-verified; Milestones A and B plus Sigil & Ritual, Echoes of the Forgotten World, Infinite Frontiers, Overdrive, The Sundered Atlas, Infinite Labyrinth co-op, Hearthfall (The Hollow Court), Skill Points + Panggung Abadi, Taman Peri (Faewood), Speedrun, Pondok Umpan, Fivefold Trials, Puzzle Adventure, Riftwar, Wave Defense, Infinite Realms, Arc VI The Astral Dominion, Stage Access/HACK, Admin Control Center, Eclipse Arc VIII, Update IX Settings 2.0 + 3D Visual Overhaul, Arc X The Eternal Night, The Unwritten Wing, 3D Scary Mode: Blackveil Nightfall, Credit Scenes + Hidden Secrets, The Hunter's Kit + Ghost Combat, The Mourning Choir + Second Shadows, Pirate Tide: Open Sea, Pirate Tide Act II: Sumpah Laut, BAB IX Tidewrought Cistern, and Phase 1 Lighter Ash (lag fix, lazy modes, save profiles, menu hubs) complete**. v0.36.0 shipped Update XXV (ElevenLabs voice, in-engine trailer, ghost GLBs, Vigil Tree, startup guard) and Update XXVI (BAB X The Lanternwake, asset inventory), which are now in the in-game Update Log.
> Live totals: **674 rooms** in `ALL_ROOMS`, **116 bosses**, **262 enemy types**, **18 classes** (+15 Frontier 3D classes), `npm test` **791/791**.
> Roadmap: [`MASTERPLAN.md`](MASTERPLAN.md) (Master Plan 3.0, phases 0–7 to v1.0). The previous plan is archived at [`docs/archive/MASTERPLAN-2.0.md`](docs/archive/MASTERPLAN-2.0.md).
> Repo: `https://github.com/FahmiGF/Ashen-Vow-` · branch `main` · push account `isshinAshinaSeal`.

## 0. v0.39.0 — Update XXVII: Lighter Ash (Master Plan 3.0 Phase 1, save-compatible)

- **Lag fix.** `applySettings()` put `filter: url(#ashen-gamma) brightness() contrast()` on the game canvas even at neutral values, and Chrome re-runs that SVG filter on every composited frame. `canvasFilterFor()` now emits only the parts that differ from 100%. Measured on the dev laptop (Ryzen 7 7435HS, RTX 3050, 144 Hz): GPU main thread 956 → 523 ms/s and renderer main 394 → 220 ms/s in room 9; without GPU compositing the campaign went 29 → 60 fps.
- `src/render.js` — the canvas is opaque (`alpha: false`) and draws its sky from a cached bitmap (`drawSky`); `layer()` bakes at device scale and `blitLayer()` draws 1:1. `#app` is its own stacking context, so `body::before` no longer sits over the canvas. `performance.memory` is sampled at 1 Hz.
- First-open stalls: `content-visibility` on `.level-card` / `.settings2-row` (Level Select first layout 91 → ~5 ms) and `SoundKit.prewarm()` builds the AudioContext while the menu is idle (~200 ms device init off the first click).
- **Mode loader.** `main.js` has `MODE_LOADERS`, `loadMode()`, `lazyMode()` stubs (call sites unchanged) and a generated context `A` between the `@ctx` markers (live getters/setters over shell bindings). Eleven screens live in `src/modes/<mode>_ui.js` and export `install(A)`: moba, wavedefense, pirates, fishing, trials, puzzle, mode3d, updates, frontier, slots, speedrun. Their stylesheets load with them. Lazy progress blocks stay raw at boot (`rawBlock`) and are sanitized on first read (`progressBlock`). `GAME_VERSION` lives in `src/version.js`. `__ashen.lazyModes`, `loadedModes`, `loadMode`; a mode's `__ashen` getter returns `null` until it loads, so smokes `await` entry hooks.
- **Save layer.** `src/save.js` owns every per-profile key: `ashen-vow-slot<N>-<area>-v1` for 3 slots, `ashen-vow-active-slot-v1`, and `ashen-vow-slot-backup-*`. Legacy keys migrate into slot 1 on first boot and slot 1 keeps mirroring them for one release. Writes are debounced (first write immediate, then ≤ 1 per key per 2 s, serialized lazily, flushed on `pagehide`/`visibilitychange`). Export/import is a versioned, FNV-1a-checksummed JSON document per slot; import runs the progress/character/hunter/secrets/3D-horror/archive sanitizers. Delete requires typing `PROFIL N` and keeps a 24 h undo. Settings and voice stay global. In `main.js` use `saveRead`/`saveWrite`, never `localStorage` for per-slot keys (enforced by `tests/budget.test.js`).
- **Menu hubs.** `src/ui/menu_hubs.js` folds the title menu into LANJUTKAN · KAMPANYE · ARC & EKSPANSI · SCARY MODE · MODE ARENA · ARSIP · PENGATURAN. Original buttons keep their ids inside hub panels. `progress.lastEntry` drives LANJUTKAN; `ashen-vow-menu-seen-v1` drives the BARU pips. Hooks: `menuHubs`, `openMenuHub`, `closeMenuHub`, `saves`, `flushSaves`, `showSlots`, `switchSlot`, `exportSlot`, `importSlot`, `deleteSlot`, `undoDeleteSlot`.
- Tools: `npm run probe:boot` (JS parsed before the `ashen-boot-ready` mark, render-blocking sheets, every lazy mode loads cleanly), `npm run probe:campaign` (per-room render cost), `npm run smoke:saves` (22 checks). `tools/smoke-version.mjs` gives every smoke the version from `package.json`.
- Tests: `tests/save.test.js` (10), `tests/budget.test.js` (4: boot never reaches a lazy-only module, mode files ≤ 120 KB, main.js ≤ 695 KB and boot graph ≤ 2850 KB ratchet, no direct per-slot writes). Suite **791/791**; all 32 browser smokes pass.
- Honest limits: boot JS is **2.83 MB**, not the plan's 900 KB — `core.js` statically imports every arc's room data (1.31 MB on its own), so the 900 KB target moves to Phase 3 when core is split. `main.js` is 693 KB, not ≤ 60 KB; arcs still built into it (Atlas, Court, Fallen, Crusade, horror hubs, labyrinth/co-op, realms/eclipse UIs) are the next extractions. The render budget pass on `drawBackground` and the three missing release gates (§9.4) were not done in this release.

## 0. v0.36.0 — Update XXVI: Arc XI The Lanternwake + Asset Inventory (save-compatible)

- `src/lanternwake.js` — **BAB X / Arc XI**, a tenth campaign chapter at rooms **669–673** (four halls + the boss altar). Every hall spawns exactly **20 enemies: 19 normal + 1 guaranteed elite** across four engine archetypes (chaser, ranged, lunge, slam); the five bodies are `wick_moth`, `lantern_wisp`, `taper_hound`, `ash_bearer` and the elite `wickbearer_acolyte`. Halls are generated deterministically per index, so no two halls share a layout.
- **Orsella, The Wickbearer** — `LANTERN_BOSS_INFO.wickbearer`, **4 phases** with thresholds `[0.75, 0.5, 0.25]`, intro/phase2/phase3/phase4/defeat dialogue, 1180 HP, `behaviorKind: 'tidebound'` and `summonType: 'wick_moth'`. Core dispatches the kind to the existing tide-regent machine and now reads `b.summonType` in `spawnTideAdds`, so the summons are the chapter's own body rather than a reskin of drowned thralls. Victory, no gate.
- **Progression** — `progress.lanternwake` inside the existing save key: sequential `halls`, `boss`, `discovered`, `runs`, `bossClears`, best/last time. `lanternwakeUnlocked` requires base `cleared[7]` **and** `progress.cistern.boss`, making it a true continuation. The sanitizer drops skipped halls and any boss clear without four halls.
- `src/core.js` — appends `LANTERN_ROOMS` to `ALL_ROOMS` (**674** rooms) and merges the enemy/boss tables; boss dispatch and phase handlers recognise `wickbearer`; summons honour `summonType`.
- `src/main.js` / `index.html` / `styles.css` — level-select section **BAB X · API SEMBILAN SUMBU** with five cards, `startLanternwakeStage`, boss recording, retry, gate/room routing and debug hooks `lanternwake`, `lanternwakeStart`, `lanternwakeClear`, `lanternwakeBossClear`. `src/zones.js` gains the `lanternwake` zone; `src/music.js` maps the boss to the existing `bossDawn` track.
- `tools/asset-inventory.mjs` (`npm run assets:inventory`) — reads every committed `.glb` through `src/glb.js` and writes **`docs/asset-inventory.md`**: 8 files, 23,184 triangles, 7 rigged characters, a 12-mesh prop kit, LOD/collision coverage, and an explicit gap list (8 Scary ghosts without unique models, 12 unbuilt environment packs). It states plainly that the repository has no `.blend` sources.
- Tests: `tests/lanternwake.test.js` (12) covers the 20-enemy contract, gate chain, four-phase dialogue, unlock chain, sanitizer and live hall/boss runs; all older `ALL_ROOMS` count assertions were updated from 669 to 674. Browser: `npm run smoke:lanternwake`.
- Honest limits: the boss reuses the tide-regent attack machine (data reuse, not a new animation rig); the chapter adds no new audio composition, only a track mapping; no Blender `.blend` sources exist, so the inventory can only describe exported geometry.
- Verification: `npm test` **758/758** (12 new chapter tests, 7 older room-count assertions updated to 674); `npm run smoke:lanternwake` **14 checks** in real Chrome (locked hub, unlock chain, live 20-body hall, four-phase boss victory, saved progress after reload), zero console errors; `npm run assets:inventory` regenerates `docs/asset-inventory.md` from the committed GLBs.

## 0. v0.36.0 — Update XXV: The Vigil Tree & Startup Guard (save-compatible)

- `src/horror_tree.js` — pure Scary Mode skill tree (no DOM, no storage): **3 branches / 9 nodes / 21 ranks**. Points are earned from the horror journal (`HORROR_TREE_BASE_POINTS = 3`, +1 per discovered event, +2 per achievement, +1/+1/+2 per easy/normal/hard clear). Every node maps to a field the simulation already reads: `hpPct`, `flasks`, `crit`, `speed`, `ash`, `wardSeconds`/`wardReduction`, `eventDelay`, and hunter items. `sanitizeHorrorSkills` drops unknown ids, clamps ranks and refuses a rank whose prerequisite is missing.
- `src/scary2.js` — imports `sanitizeHorrorSkills`, so `sanitizeHorrorProgress` repairs `skills` on load; `HorrorJournal` keeps `skills` in memory and in `toJSON()`. This fixes the working tree that referenced an unimported symbol.
- `src/main.js` — new **Pohon Skill** tab in `#scary-screen` (`scaryTreePanel`, `rankHorrorTree`, `resetHorrorTree`), delegated `data-horror-rank` / `data-horror-tree-reset` buttons, `startScaryRun` applies `applyHorrorTree(game, horrorTreeBonuses(...))` once at run start, and debug hooks `horrorTree`, `rankHorrorTree`, `resetHorrorTree`, `applyHorrorTreeBonuses`.
- `index.html` / `styles.css` — `.tree-*` styles and a **startup guard**: `#boot-screen` shows real load stages, and `window.__ashenBootFail` renders a recoverable error card with a diagnostic code (`BOOT-01` timeout, `BOOT-02` module load, `BOOT-03` runtime, `BOOT-04` unhandled rejection) plus **COBA LAGI** and **TETAP BUKA**. `main.js` reports readiness via `window.__ashenBootReady()` after the first frame is scheduled, so an import failure can never leave a silent black screen.
- Tests: `tests/horror_tree.test.js` (10) covers the economy, prerequisites, sanitizer, journal round-trip and live player application; `tests/scary2.test.js` now expects six horror tabs and exempts the tree tab from the settings-row contract.
- Honest limits: the tree is Scary-Mode only and never modifies campaign difficulty, and rank points are derived from local journal progress rather than a server.
- Verification: `npm test` **746/746** (10 new tree tests); `npm run smoke:scary2` **52 checks**, zero console errors, including a real rank purchase/unlock/reset and the startup guard's failure and recovery paths.

## 0. v0.36.0 — Update XXV: Suara ElevenLabs, Trailer & Aset Mode

- `src/voice.js` — pure voice layer: 8 cast members (`narrator`, `warden`, `wyrm`, `oathbreaker`, `tidebound`, `wickbearer`, `ghost`, `trailer`), `VOICE_MODEL = 'eleven_multilingual_v2'`, `VOICE_MAX_CHARS = 600`, `voiceRequestFor`, `resolveVoiceProvider`, `sanitizeVoiceSave`, `voiceSummary`, `voiceBadge`. Save key **`ashen-vow-voice-v1`** (own key, like hunter/secrets), never inside the settings payload.
- `server.js` — `GET /api/voice` returns `{configured, model, cast, maxChars}`; `POST /api/voice` proxies `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128` with `ELEVENLABS_API_KEY` (per-cast overrides via `ELEVENLABS_VOICE_<CAST>`), validates text length and voice-id shape, and caches MP3 by `sha256(voice|model|text)` (64 entries). The key never reaches the client.
- `src/main.js` — `speakVoiceLine()` is the single entry point for prologue, boss dialogue (`speakDialogueLine`, cast from `VOICE_BOSS_CAST[kind]`) and the trailer; ElevenLabs → browser `speechSynthesis` → silence, with the chosen provider recorded in `voiceSave.providerUsed`. Debug hooks `voice`, `trailer`, `openTrailer`, `closeTrailer`, `toggleTrailerPause`, `seekTrailer`, `setTrailerTime`, `refreshVoiceStatus`, `narrate`, `stopVoice`, `setVoice`. State views are installed with `Object.defineProperties` (Object.assign would snapshot them at boot).
- `src/trailer.js` — pure 16-shot / 80 s in-engine trailer (`TRAILER_SHOTS`, `trailerShotAt`, `trailerNarrationAt`, `trailerSummary`) plus deterministic `drawTrailerFrame(ctx, w, h, time)`. Screens: `#trailer-screen` / `#trailer-canvas` with play, ±5 s, voice toggle, progress, clock and engine badge; opened from **TRAILER SINEMATIK** and `menuView = 'trailer'`.
- `tools/export-glb.mjs` — 8 authored ghost characters (`ghost_<id>.glb`, 20 joints, 3 LODs, `_COL` proxy, Idle/Walk/Attack, 2.0–2.4k LOD0 triangles) and 9 mode props (`cistern_arch`, `cistern_pillar`, `lantern_pyre`, `lantern_brazier`, `pirate_wreck`, `pirate_dock`, `veil_shrine`, `dread_altar`, `wd_bastion`). Kit is now **16 files / 4,819.8 KB / 58,802 triangles**.
- `src/webgl3d.js` — `CHAR_ASSETS` exported and extended; enemy draws honour `enemy.model` when it is loaded (fallback to the archetype map), so horror entities use their own bodies. `propNameFor`/`propScaleFor` cover the nine new props.
- `src/mode3d_horror.js` — the five site entities now name `ghost_weeping_mother`, `ghost_hollow_wraith`, `ghost_drowned_bell`, `ghost_forgotten_one`, `ghost_lantern_eater`.
- `tools/asset-inventory.mjs` — ghost coverage is computed from files that exist (`ghost_<id>.glb`), plus a mode-prop coverage table; the document no longer claims ghosts lack models.
- Tests: `tests/voice.test.js` (7), `tests/trailer.test.js` (7), extended `tests/gltf.test.js` (ghost kit, horror model mapping, 21 props). Browser: `npm run smoke:trailer`.
- Honest limits: ElevenLabs needs an API key and network; without both the game speaks with the browser voice or shows subtitles only. The trailer is an in-engine cut, not a re-render of `trailer/ashen-vow-trailer.mp4`. Ghosts share the humanoid skeleton and clip set; only geometry and materials are bespoke.

## 0. v0.35.0 — Update XXIV: Sistem Air Pasang & Dua Relung Rahasia

- `src/cistern.js` — pure chapter module (no DOM): **7 rooms at ids 662–668**, `CISTERN_ROOM_START = 662`, `CISTERN_STAGE_COUNT = 5`, `CISTERN_HALL_COUNT = 4`, `CISTERN_SECRET_IDS = ['alcove', 'lowcave']`, stage metadata, `CISTERN_ENEMY_INFO` (4), `CISTERN_BOSS_INFO.tidebound` (3 phases, thresholds `[0.66, 0.33]`, four dialogue keys), `CISTERN_PALETTE`, and `validateCisternRooms()`.
- Progression in the same module: `defaultCisternProgress`, `sanitizeCisternProgress` (sequential halls, boss requires all halls, secrets never leak through `discovered`), `cisternUnlocked` (needs base `cleared[7]`), `cisternStageUnlocked`/`cisternStageCleared`, `recordCisternStage` (halls only), `recordCisternSecret`, `recordCisternBoss`, `recordCisternRun`, `cisternSummary`, plus `cisternStageForRoom` / `cisternRoomForStage`.
- `src/core.js` — appends `...CISTERN_ROOMS` to `ALL_ROOMS` (**669**) and merges the enemy/boss tables; new `updateTidebound` state machine (trident sweep, harpoon fan, surge, summons), `spawnTideBolt` (reuses the existing `waterbolt` projectile renderer), `spawnTideFan`, `spawnTideAdds`, and a `tidebound` branch in `onBossPhase`.
- `src/render.js` — `drawCisternBackground` (parallax arches, pillars, light shafts, waterline caustics, drips) selected by `room.cistern || room.zone === 'cistern'`; `drawTidebound` boss art; a `bubbles` particle mood; the weather layer now also runs for rooms that carry `particle` (not only `biome`). Optimisation: the glow layer is blitted at native 840×840 (scaled blit measured 7.04–8.13 ms vs 0.17–0.20 ms), `cisternGradient` caches every gradient (11 → 0 per frame), and bubbles draw rings only.
- `src/main.js` — `progress.cistern` in defaults and `loadProgress` (`cistern: _cistern` in the known-key destructure), `startCisternStage` (`activeRunKind = 'cistern'`, `activeCisternStage`), `handleCisternBoss`, `buildCisternCards` inside `buildLevelCards`, `discoverCisternRoom`, gate/boss/roomEnter routing, retry branch, stage-time key regex now accepts `cistern:`, and hooks `cistern`, `startCisternStage`, `unlockCistern`, `cisternClear`, `cisternDiscover`, `cisternBossDown`.
- `index.html` / `styles.css` — `.cistern-section` under `#level-cards` with `#cistern-heading`, `#cistern-progress`, `#cistern-lock-note` and `#cistern-cards`; cistern card accents and a 640 px stacking rule.
- `src/secrets.js` — two hidden level runes (`level:sunken_alcove_whisper` room 667, `level:low_cave_whisper` room 668) for `mode: 'cistern'`.
- `src/music.js` — new `cisternBoss` track and `BOSS_TRACKS.tidebound`.
- `tools/render-probe.mjs` (new, `npm run probe:render`) — per-layer browser timing for the cistern; `tools/frame-profile.mjs` gained a `cistern` scenario (unlock + clear hall 0 before starting room 663); `tools/cistern-smoke.mjs` (new, `npm run smoke:cistern`).
- Tests: `tests/cistern.test.js` (15: structure, gate graph, secret-wall ingress, archetypes, boss data, unlock chain, sanitizer, secrets, run records, live boss to victory, live hall spawns). Suite **736/736**. Browser: `npm run smoke:cistern` **40 checks**, zero console errors, 390×844 clean.
- Honest limits: canvas micro-timings are noisy on software raster; tiled-sprite caching was measured as a regression (10.7 → 19.5 ms) and reverted. New enemies reuse the seven engine archetypes; the chapter adds no new animation system.

## 0. v0.34.0 — Update XXIII: Pasang Tak Berujung & Benteng Karam

- `src/pirates.js` — naval endless: `PIRATE_ENDLESS_STAGE` (`endless_tide`, never a route card), `PIRATE_ENDLESS_SURGE_TIME = 34`, `PIRATE_ENDLESS_START_GOLD = 70`, `PIRATE_ENDLESS_CAPTAIN_EVERY = 3`, `createPirateEndless`, `pirateEndlessSurge` (hull +12 max / +24 heal, damage ×1.06, extra hulls, captain every third surge), `updateEndlessDirector`, endless scaling in `spawnEnemy`, bounty-only captain handling in `sinkShip`, snapshot endless fields (`endless`, `surge`, `surgeTimer`, `surgeNext`, `captains`, live `bossName`), `progress.pirates.endless` + `recordPirateEndless` (never touches `voyages`/`wins`).
- `src/wavedefense.js` — fourth map `sunken_causeway` (24 slots), towers `vow_banner` (support aura +20% damage / +12% rate per level) and `spirit_lantern` (4 s mark, +20% damage taken), enemies `drowned_reaver` (16% armour) and `bone_herald` (+12% armour aura), `waveDefenseRefreshAuras` / `waveDefenseIncomingDamage`, and endless play: `WAVE_DEFENSE_ENDLESS_WAVES = 999`, `endlessWaveDef`, `endless` in `createWaveDefense`, `progress.wavedefense.endless` records that skip campaign wins/losses.
- `src/main.js` — `startPirateEndless` + `beginPirateMatch` refactor, endless hub card and result card, endless HUD objective, retry branch; `wdEndless` mode cards, endless HUD/result copy, `setWaveDefenseMode`, `setWaveDefenseEndless`, `pirateNextSurge`, `renderPirateFrame`, `renderWaveDefenseFrame`.
- `index.html` / `styles-pirates.css` / `styles-wavedefense.css` — `#pirate-endless` card, `#wd-modes` switch, responsive styles; version strings now v0.34.0.
- `tools/frame-profile.mjs` (new) — real frame profiling: LoAF entries, rAF deltas, sampled CPU stacks, direct canvas layer timing for menu/campaign/pirates/pirateEndless/wave/waveEndless. `tools/bg-probe.mjs` (new) — campaign background cost per room type.
- Measured (headless Chrome, 1280×900, software raster): campaign canvas 13.8 ms with `drawBackground` 8.9 ms, Pirates 7–9 ms, Wave Defense 7–9 ms, p95 ≈ 7.1 ms, no frame drops. An `OffscreenCanvas` island-sprite cache regressed the naval canvas 7.04 → 21.07 ms and was reverted; only the per-canvas island gradient cache and single-stroke wakes stayed.
- Benchmarks: `npm run bench:pirates` **10,689–18,095 steps/s**, **3,343 canvas calls/frame**, island predicate **182 ns (2.96×)**; `npm run bench:wavedefense` **0.088 ms/frame** average (24 towers, 120 enemies).
- Tests: `tests/pirates.test.js` (22, plus endless surge/captain/record cases), `tests/wavedefense.test.js` (13, plus new content and endless cases); suite **720/720**. Browser: `npm run smoke:pirates` **49 checks**, `npm run smoke:wavedefense` **66 checks**.
- No new save keys: endless records live inside `progress.pirates` and `progress.wavedefense`.

## 0. v0.33.0 — Update XXII: Pirate Tide: Sumpah Laut

- `src/pirates.js` — Act II of the naval mode: **10 islands** (adds Gosong Bara, Pulau Duka, Karang Bintang Jatuh), **7 ports**, **8 enemy hulls** (adds Pemotong Badai from route 6 and Lewiatan Baja from route 7), **10 captain flagships**, and **10 sequential routes** (adds Perburuan Kabut, Pasang Kosong, Takhta Garam, Kawal Baja, Sumpah Pertama). Targets 4–13 ships; flagship HP now 520–3,200.
- `pirateEnemyPool(match | stage | index | id)` is now exported and gates act-two hulls by route index. `pirateVisibleIslands(match, w, h, zoom)` exposes the camera cull for tests.
- Performance: the renderer culls islands, ships, cannonballs and effects outside the camera, caches the sea gradient per canvas/size, and draws 14 wave rows instead of 18 — measured **4,376 → 3,345 canvas calls/frame (−24%)** at a ten-hull load, and the route-one camera draws **2 of 10 islands**. Island/hull collision now rejects on one axis and compares squared distance before `Math.sqrt`; the A/B predicate benchmark improved from **465 ns to 157 ns per call (~2.9×)** with identical hits. `node tools/pirates-bench.mjs` measured roughly **10,000–11,000 steps/s** on route one (10 hulls, 87 balls) and **19,000–21,000 steps/s** on route ten.
- Save: unchanged `progress.pirates`; the sanitizer validates the entire ten-route chain, so act two cannot be forged open. No new key.
- Tests: `tests/pirates.test.js` now has **20** model tests (counts, act-two chain, hull gating, cull, all ten captains, ramming, pool cap, sanitizer, renderer). Browser `npm run smoke:pirates` is **42/42** with act-two unlock/spawn/clear checks. Full suite **715/715**.

## 0. v0.32.0 — Update XXI: Pirate Tide: Open Sea

- `src/pirates.js` — pure naval simulation and procedural renderer. One **3,200×2,200** open sea, **7 islands**, **5 ports**, **6 enemy ship types**, **5 captain flagships**, **5 sequential routes**, cannon broadsides, island collision, hull-to-hull collision with Black Sloop ramming, AI broadside positioning, gold, hull repair, score, snapshot, progress sanitizer and deterministic RNG. No DOM access in the simulation.
- `src/main.js` — **PIRATE TIDE — OPEN SEA** menu entry, `#pirate-screen` hub and `#pirate-battle` canvas, `progress.pirates`, stage unlock UI, `WASD` steering, `Q/E` port/starboard fire, `Space` both sides, `F` docking, click-to-fire, touch D-pad, pause/result overlays, portrait full-viewport battle canvas sizing, and debug hooks.
- `styles-pirates.css` — responsive hub, live HUD, captain bar, repair prompt, minimap/compass, touch controls and result cards through 390×844, with fixed full-viewport battle layers for portrait and short-landscape phones.
- Save: `progress.pirates` inside the existing `ashen-vow-progress-v1`; records voyages, wins/losses, kills, gold, shots/hits, best score and per-route clears. No new save key. Route clears are sequential and sanitized; hit totals are clamped to shots so accuracy cannot exceed 100%.
- Rules: flagships are not counted as bounty kills, regular patrols stop spawning once the captain appears, and the cannonball pool is hard-capped without consuming a reload.
- Tests: `tests/pirates.test.js` (17 model tests, including all five captains and ramming), browser `npm run smoke:pirates` (36 checks, including portrait battle layout and touch fire). Full suite **711/711**; all 27 browser smoke scripts pass.
- Settings fix: Eclipse graphics presets now mirror their frame cap and resolution scale into Settings 2.0, so the save sanitizer no longer snaps the preset back to its previous value.

## 0. v0.31.0 — Update XX: The Mourning Choir & Second Shadows

- `src/scary2.js` — Scary Mode now ships **8 ghosts / 17 jumpscares**. New ghosts: `weeping_mother` (wail-and-pull, 5 tear projectiles), `mirror_double` (mirror-step to a valid nav point behind the player), `lantern_eater` (watched-stalk: freezes and fades while observed), and `drowned_bell` (toll-shockwave). New events: `the_second_shadow`, `the_counting_knocks`, `the_floor_hand`, `the_glass_twin`, `the_hungry_light`, `the_bell_below`, `the_mourning_wake`. Two achievements and two cosmetic rewards bring the journal to 9/9.
- `src/core.js` — real branches for all four tactics, a new `ghost` event layer spawn, lantern observation contact immunity, one-instance-per-ghost event spawning, and finite/arena guards. `src/main.js` resets event layers per run and handles `ghost` effects.
- `src/render.js` — `drawHorrorEventOverlay` and `drawScaryAura` render double shadows, floor hands/faces, mirror/window faces, inverted corridors, glitch bands, bell ripples, lantern glow, shards, and tears. Dread also draws floor-face and mirror-hall screens.
- `src/dread.js` — 7 Unnatural (adds `mirror_mourner`, `hollow_nurse`) and 18 psychological events (adds `the_bell_that_answers`, `the_empty_choir`, `the_floor_face`, `the_second_reflection`). No new save key.
- Tests: `tests/scary2.test.js` / `tests/scary2core.test.js` / `tests/dread.test.js` / `tests/dreadcore.test.js` cover the new counts, tactics, event lifecycle, and live effects. Full suite 693/693. Browser: `smoke:scary2` (8 ghosts / 17 events), `smoke:dread` (7 Unnatural), plus the version-sensitive regressions.

## 0. v0.30.0 — Update XIX: The Hunter's Kit & Ghost Combat

- `src/hunter.js` — pure anti-ghost layer. `HUNTER_ITEMS` has five tools: Suluh Garam (radius 250, damage 18, stun 2.6 s, mark 6 s), Lonceng Kubur (radius 210, stun 3.8 s), Granat Asap (radius 300, stun 1.8 s, invuln 1.4 s), Peluru Roh (42 normal / 120 ghost damage, pierce 3), and Jimat Penjaga (8 s, 60% ghost damage reduction). `HUNTER_SAVE_KEY = 'ashen-vow-hunter-v1'`, `defaultHunterSave`, `sanitizeHunterSave`, `hunterBuy`, `hunterConsume`, `hunterGrant`, `hunterReward`, `hunterSummary`, `isSpiritEnemy`, `isSpiritSource`, and `spiritBounty` are pure and Node-tested.
- `src/core.js` — player `hunterItems`; `setHunterItems`, `addHunterItem`, `useHunterItem`, `spiritTargets`, `rewardSpirit`; `updateEnemies` stun/smoke and mark handling; `updateBoss` stun handoff; spirit-mark damage bonus; ghost-only ward reduction in `damagePlayer`; `spirit_bane` projectile damage/status; one-time `spiritDown` bounty. Ordinary campaign enemies are excluded.
- `src/main.js` — loads/saves `ashen-vow-hunter-v1`, builds `#hunter-shop-screen`, opens from Scary Mode or pause, buys with marks, adds purchased stock to the live run, exposes `__ashen.hunter`, `showHunterShop`, `closeHunterShop`, `buyHunterItem`, `syncHunterFromGame`, `giveHunterMarks`; inventory group PEMBURU; hunter stock in `snap()`.
- `src/render.js` — procedural `spirit_bane` projectile glow and silver round.
- `tests/hunter.test.js` (11) + `tests/huntercore.test.js` (9) cover economy, sanitizer, spirit detection, salt, smoke, ward, marked damage, projectile pierce, bounty dedupe, and normal-enemy exclusion. Browser: `npm run smoke:hunter`.
- Verification: `npm test` 690/690; `npm run smoke:hunter` **checks the real shop and live ghost combat**; no commit was made.

## 0. v0.29.0 — Update XVIII: Credit Scenes & Hidden Secrets

- `src/credits.js` — pure arc-credit catalogue. `CREDIT_ARCS` covers **11 arcs**; `creditArcFor(runKind, kind)` maps the real final-boss kinds; `creditSceneFor` returns a copied role list. `CREDIT_ROLES` credits **Sealius in every role**: Technical Lead, Artist & Designer, Game Design, Systems & Engineering, World & Narrative, UI & UX Design, QA & Verification, Release & Support. `CREDIT_SCENE_FOOTER` is the exact canonical SealiusHQ line. Scene delay 2.4 s, auto-close 22 s.
- `src/secrets.js` — hidden ledger and data: `SECRETS_SAVE_KEY = 'ashen-vow-secrets-v1'`, 32 mode marks, 5 campaign runes (rooms 0/4/7/12/13), sequence matcher with a 4.5 s window, `secretSpotFor` (Speedrun reuses campaign runes), sanitizer, dedupe recorder, summary.
- `src/main.js` — loads/saves the secret ledger; `beginStage` attaches one hidden rune to `game.secretRune`; the shared interact handler calls `tryCollectSecretRune()` before the shop; the global keydown handler advances the hidden sequence in every mode (skipped during settings, rebinding, text entry and cutscenes); `drainEvents` calls `maybeCreditScene(ev)` for every `bossDown`; `openCreditScene`/`buildCreditScene`/`closeCreditScene` drive `#credit-scene-screen`. Debug hooks: `secrets`, `secretSpots`, `secretSequence`, `claimSecret`, `creditScene`, `creditArcs`, `creditArcFor`, `openCreditScene`, `closeCreditScene`.
- `src/render.js` — `drawSecretRune()` renders a faint, unlabelled glyph in the world; collected runes disappear.
- `index.html` / `styles.css` — **#credit-scene-screen** with arc numeral/title/subtitle/line, scrolling Sealius role grid, exact footer, skip button and reduced-motion fallback. The static Credits screen now lists Sealius in all eight roles.
- `tests/secrets.test.js` (10) + `tests/credits.test.js` (4) prove mode coverage, real final-boss mappings, the exact footer, no combat fields, sequence reset/expiry, sanitizer repair and single-record persistence.
- Verification: `npm test` 669/669; `npm run smoke:credits` by real Chrome covers overlay, mappings, final-boss trigger, rune pickup, hidden mode sequence and reload. Secrets and credit scenes write no campaign/reward/combat state.

## 0. v0.28.0 — Update XVII: 3D Scary Mode — Blackveil Nightfall

- `src/mode3d_horror.js` — pure data/progression: **5 sites × 3 phases = 15 stage-levels**, 15 echo objectives, 5 hunters, 20 authored scares, site palettes/props, `horror3DScenery()`, `default3DHorrorSave`, `sanitize3DHorrorSave`, `record3DHorrorResult`, `horror3DSummary` and 6 achievements. Save key **`ashen-vow-3dhorror-v1`** schema 1.
- `src/mode3d_content.js` — imports the five sites and appends five `horror: true` areas, growing `MODE3D_AREAS` from 10 to 15. Existing areas/dungeons/elites/bosses/relics/vaults are unchanged.
- `src/mode3d.js` — `startHorrorSite(siteId)`, `updateHorror`, `updateHorrorCamera`, echo collection, three-phase progression, exit clear, unstoppable hunter chase/attack, fear/sanity, scare queue, `finishHorror`, `horrorSnapshot`, `drainHorrorEvents`. `update()` freezes inactive/cleared horror runs instead of falling back to third-person simulation. `execute3DAttack()` staggers unkillable horror entities without damaging them.
- `src/webgl3d.js` — `propNameFor` / `propScaleFor` map the five new GLB buildings plus `echo_rune` and `exitgate`; first-person runs skip the `sera` player draw; horror entity tint is honoured; collected echo markers are skipped.
- `tools/export-glb.mjs` + `assets/3d/props.glb` — authored `horror_manor`, `horror_asylum`, `horror_chapel`, `horror_mill`, `horror_lighthouse` and regenerated the 129 KB prop kit.
- `src/mode3d_visuals.js` — Canvas fallback buildings, glowing echo runes, exit gate, first-person player skip and `renderHorrorOverlay()` (vignette/darkness, fear HUD, scare silhouettes, prompts, result screen). Projection and shadow now reject non-finite values.
- `src/main.js` — imports the save/site model, `showMode3D('scary')`, `start3DHorrorRun`, `buildHorror3DPanel`, `drain3DHorrorEvents`, menu button/card/select handlers, `R` restart, anti-jumpscare persistence and debug hooks (`horror3D`, `horror3DSnapshot`, `game3D`, `start3DHorror`, `restart3DHorror`, `horror3DCollect`, `horror3DExit`, `render3DFrame`).
- `index.html` / `styles.css` — **3D SCARY MODE: BLACKVEIL NIGHTFALL** menu entry, five-site rail, intensity/anti controls, `scary` submode and horror panel styling.
- `src/audio.js` — `horrorSting`, `horrorWhisper`, `horrorHit`, `horrorSiteEnter` procedural cues.
- Tests: `tests/mode3dhorror.test.js` (12) + updated `tests/gltf.test.js` (15 areas / 5 horror sites / 5 new props). Browser: `npm run smoke:horror3d` 22 checks; WebGL2 available, 31 draw calls, lit 3D canvas, clear + reload persistence, zero console errors.

## 0. v0.27.0 — Update XVI: The Unwritten Wing (Arc X Expansion)

- `src/eternal_data.js` — Arc X now has **8 chapters / 40 stages** (rooms 9600–9639) and **9 bosses**. The new chapter is `unwritten_wing` with five anomaly stages and the four-phase `the_unwritten`; The Eternal Nightfall remains the final chapter and The First Forgotten remains the five-phase finale.
- Each Unwritten Wing stage keeps the 20-enemy contract: 19 normal + exactly 1 elite, using the existing `wraith` / `brute` / `sentinel` / `crawler` archetypes. New stages expose `stageType: 'anomaly'`; standard stages expose `stageType: 'standard'`.
- `src/veil_data.js` — eight new Ghost Index records bring the total to **80**. Original 72 records are unchanged. `src/archive_data.js` adds **3 jumpscare categories / 8 events** (38 events, 13 categories), **3 tools** (30 total), and derives the new stage/boss/ghost records automatically.
- `src/main.js` — Arc X HUD/count labels read the imported data tables instead of hardcoded 35/8/72; archive stage details expose `TYPE` so anomaly stages are visible. `src/core.js` is untouched; existing `loadEternalStage()` / `startEternalBoss()` paths handle the new content.
- Save compatibility: `ashen-vow-eternal-v1` schema 1 is unchanged. New stages use stable stage IDs; existing stage IDs and boss IDs are not renamed. The archive save is unchanged at `ashen-vow-archive-v1` schema 1.
- Tests: `tests/eternal.test.js`, `tests/archive.test.js`, `tests/veil.test.js`, `tests/updates.test.js`; browser smokes `smoke:eternal`, `smoke:veil`, `smoke:archive`.

## 0. v0.26.0 — Update XV: Stage Archive, Level Checker & Supernatural Research

- `src/archive_data.js` — derived catalogue over existing content: **65 stages** (30 Arc IX + 35 Arc X), 13 chapters, 15 bosses, **30 jumpscare events** in 10 categories, **27 investigation tools**, per-entity required/optional tool matrix, 10 achievements. Stable IDs everywhere; no duplicated stage/ghost records.
- `src/archive.js` — pure managers: `StageArchiveManager`, `StagePreviewManager`, `LevelCheckerService`, `GhostArchiveManager`, `JumpscareIndexManager`, `InvestigationEquipmentManager`, `EvidenceAnalyzer`, `CaptureSystem`, `InvestigationProgressManager`, `ArchiveController` and `sanitizeArchiveSave`. Missing GhostIndex records map to `undiscovered` (not the index's internal `rumored`).
- **Sneak Peek** has two paths: archive preview (no gameplay mutation) and developer preview (requires `developer: true, authorized: true`; no UI control). Archive preview only records preview metadata in `ashen-vow-archive-v1`.
- **Level Checker** uses real campaign `completedStages`/`bossClears`, live GhostIndex evidence/lore and archive scare records. It reports 11 categories and separate main/ghost/collectible/secret/overall percentages; it never auto-awards missing rewards.
- `src/core.js` untouched. `src/main.js` adds `#archive-screen` (six tabs), `#archive-preview-screen`, entry buttons from Scary Mode/Veil/Eternal, handlers, and hooks `__ashen.archive`, `archiveData`, `openArchive`, `closeArchive`, `archivePreview`, `archiveCheck`, `archiveDocGhost`, `archiveDocScare`, `archivePrepare`, `archiveCapture`, `archiveSave`.
- Save: **`ashen-vow-archive-v1`** schema 1. Arc IX (`ashen-vow-veil-v1` v2) and Arc X (`ashen-vow-eternal-v1` v1) remain separate and are read live, never restructured by the archive.
- UI: `styles-archive.css`; responsive stage grid, status badges, checker bars, ghost/scare lists, equipment matrix, isolated preview scene. `prefers-reduced-motion` disables fog animation.
- Tests: `tests/archive.test.js` (21); suite **638/638**. Browser: `npm run smoke:archive` (**29 checks**, including 390×844). Benchmark: `node tools/archive-bench.mjs`.
- Honest limits: archive progression validation is local/deterministic, not server-authoritative; no authenticated archive claim endpoint. Only Arc IX/X exist; future arcs use the same catalogue shape. Multiplayer archive discovery is local, not real-time server sync.

## 0. v0.25.0 — Update XIV: Scary Mode — The Eternal Night (Arc X)

- `src/eternal_data.js` — Arc X content: 7 chapters, 35 stages (rooms **9600–9634**), 8 bosses (boss rooms **9700+**, `first_forgotten` has five phases), 7 Spectral Pursuit variants, 10 investigation templates, 12 equipment items in 6 categories over 5 tiers, 11 world events, 5 co-op roles/tasks, 10 Index Rank milestones, 10 achievements and 16 setting definitions.
- `src/eternal.js` — pure Arc X model: campaign helpers, room/enemy contract, `InvestigationGenerator` (deterministic seed, validation, stable IDs, authored fallback), `SpectralHunt`, workshop tiers/costs, `WorldEventDirector` (schedule/objectives/replay/journal), `GhostResearchExpedition` (roles, voting, reconnect, one reward), `EternalPerfMonitor`, `sanitizeEternalSettings`/`sanitizeEternalSave`, and `EternalController` with the Dashboard 2.0 snapshot.
- `src/veil_data.js` — Ghost Index expanded to **72 records** (66 standard + 6 secret) and **12 classifications** (Revenant, Wisp, Aberration, Spectral Beast, Mimic, Primordial added), advanced fields for every record, `INDEX_MAX_RANK = 100`, and Sanity 3.0 definitions. Arc IX's original six chapters/stages/bosses are unchanged.
- `src/veil.js` — `SanityMeter` now carries independent exposure/focus (`beginRun`, `addExposure`, `reduceExposure`, `spendFocus`, `recoverFocus`), the rank curve reaches 100 at 72 documented records, ten rank milestones, and save fields. Exposure never becomes permanent damage and Focus only gates optional analysis.
- `src/core.js` — additive `loadEternalStage(stageId)` and `startEternalBoss(bossId)`; Arc X stages use the synthetic arena and the existing 20-enemy contract. No legacy room, boss, gate or campaign save field changed.
- `src/main.js` — Arc X state/settings/save, `#eternal-screen` with **11 tabs** (dashboard, campaign, index, investigation, hunts, workshop, events, expedition, performance, journal, settings), stage/boss/hunt run flow, retry branch, `eternalTick`, shared sanity HUD (exposure + focus), input handlers, `settings.eternal`, and debug hooks `__ashen.eternal`, `eternalChapters`, `eternalStages`, `eternalBosses`, `eternalHuntVariants`, `eternalEquipment`, `eternalWorldEvents`, `eternalRankMilestones`, `openEternal`, `startEternalStage`, `startEternalBoss`, `startEternalHunt`, `eternalUnlockAll`, `eternalGenerateCase`, `eternalCompleteCase`, `eternalUpgrade`, `eternalEvent`, `eternalEventStep`, `eternalEventComplete`, `eternalCreateExpedition`, `eternalJoinExpedition`, `eternalCoopTask`, `eternalCoopComplete`, `eternalGrant`, `eternalSetSetting`, `eternalSetExposure`, `eternalSetFocus`, `eternalSetSanity`, `eternalTick`, `eternalCompleteBoss`.
- `index.html` / `styles-eternal.css` — Arc X hub, Scary Mode entry, and the shared HUD's exposure/focus rows.
- Save keys: `ashen-vow-eternal-v1` (schema 1) for Arc X; `ashen-vow-veil-v1` stays schema 2; settings stay in `ashen-vow-settings-v1` with new `settings.veil` / `settings.eternal` defaults sanitized through Settings 2.0.
- Tests: `tests/eternal.test.js` (17 model tests) and `tests/veilcore.test.js` (live 20-enemy contract, ghosts, five-phase boss); suite **616/616**. Browser: `npm run smoke:eternal` (**30 checks**).

Honest limits: co-op is local/host-authoritative with reconnect tokens, not server matchmaking or verified authority; performance thresholds are instrumentation, not a measured FPS benchmark; Arc X ghosts reuse shared navigation/perception archetypes.

## 0. v0.24.0 — Update XIII: Scary Mode — The Veil of the Forgotten

- `src/veil_data.js` — static content: 6 chapters, 30 stages (rooms **9400–9429**), 7 bosses (`veil_architect` is the five-phase finale), 7 sanity conditions, 7 zones, 14 sanity events, 6 consumables, 8 Mind & Spirit upgrades, 42 Ghost Index entities (36 standard + 6 secret across 6 classifications), 5 investigation tools, 12 cases, 6 daily + 5 weekly rotations, 6 contracts, 5 currencies, 14 achievements, 7 leaderboards, 10 refuge facilities, 8 secrets, 8 collectible categories and 30 settings definitions.
- `src/veil_ai.js` — `GhostPerception`, `GhostMemory`, `GhostNavigation`, `GhostManifestation`, `GhostInvestigation`, `GhostEncounterDirector`, `GhostReplication` and `GhostBrain` with ten behaviours. Attacks fire once per cooldown and only with line of sight; navigation refuses steps without ground, so ghosts never clip through geometry.
- `src/veil.js` — `SanityMeter` (non-lethal, batched 4 Hz zone drain, consumables, temporary conditions, Veil Touched rescue), `GhostIndex` (six research stages, evidence dedupe, filters/search/pagination, completion + rewards), `VeilProgression`, `VeilLeaderboards`, `sanitizeVeilSave` + v1→v2 migration, `sanitizeVeilSettings` / `resolveVeilPresentation`, `VeilController`, room/stage helpers and pooling/pagination helpers. Re-exports both data and AI modules.
- `src/core.js` — additive `loadVeilStage` (loads the synthetic arena, spawns exactly **20 enemies: 19 normal + 1 elite** from 4 archetypes), `startVeilBoss`, `spawnGhost`, `ghostBrain`, `updateGhost` and `banishGhost`; `updateEnemies` dispatches `e.ghostKind` before the generic AI/brain layers.
- `src/main.js` — `#veil-screen` hub with 8 tabs (campaign, sanity, index, investigation, refuge, mind, progress, settings), stage/boss run flow (`activeRunKind = 'veil'`), live sanity HUD, ghost encounters, evidence/document/master actions, missions/cases, settings by path, and debug hooks `__ashen.veil`, `veilStages`, `veilBosses`, `veilGhosts`, `showVeil`, `startVeilStage`, `startVeilBoss`, `veilSpawnGhost`, `veilEvidence`, `veilDocument`, `veilCompleteBoss`, `veilSetSanity`, `veilSetZone`, `veilTick`, `veilUnlockAll`.
- `index.html` / `styles-veil.css` — hub markup, `#veil-hud`, and the Scary Mode **THE VEIL OF THE FORGOTTEN** entry.
- `src/render.js` — `drawVeilAtmosphere(ctx, layer, w, h)`: vignette, low-sanity distortion and Veil Touched tint. Presentation only; no gameplay collision.
- Saves: **`ashen-vow-veil-v1`** (schema 2, own campaign/index/investigation/progression/leaderboards), `settings.veil` inside `ashen-vow-settings-v1`. Campaign, settings and character keys are untouched.
- Tests: `tests/veil.test.js` (25 model tests) + `tests/veilcore.test.js` (8 live-engine tests). Full suite **597/597**. Browser `npm run smoke:veil` = **33 checks**, zero console errors.

## 0. v0.23.0 — Update XII: Scary Mode — The Dread Beyond

- `src/dread.js` — pure expansion module: 5 environments (2D rooms + ceiling spans + separate 3D data), 5 Unnatural enemies with sight/hearing perception and a shared `UnnaturalBrain`, 14 psychological events with `DreadEventDirector`, 3 horror bosses with `DreadBossManager`, 10 exploration tools, `AwarenessManager`, 10 modes, Journal 2.0 (10 categories / 60 entries / mystery board), 8 achievements + 8 cosmetics, `sanitizeDreadSettings` / `resolveDreadPresentation`, and `ScaryModeController`.
- `src/core.js` — additive: `loadDreadEnvironment`, `emitNoise`, `spawnUnnatural`, `updateUnnatural`, `updateUnnaturalKnight`, `updateCeilingDweller`, `updateForgottenTwin`, `vanishUnnatural`/`reappearUnnatural`, `spawnDreadBoss`/`updateDreadBoss`/`dreadBossAttack`. `updateBoss` defers to `updateDreadBoss` for dread bosses; `finishBoss` emits `dreadBossDown` without a blessing. No legacy room, boss, gate or save key changed.
- Rendering: `render.drawDreadWorld` draws all five environments procedurally (deterministic, no per-frame randomness), plus ceiling shadow and mirror sheen.
- UI: `#dread-screen` (7 tabs: environments, Unnatural, bosses, modes, equipment, journal, settings), opened from Scary Mode's **THE DREAD BEYOND** button.
- Debug hooks: `__ashen.dread`, `dreadEnvironments`, `dreadEnemies`, `dreadBosses`, `dreadModes`, `dreadEquipment`, `dreadJournal2`, `openDread`, `enterDread`, `startDreadBoss`, `playDreadMode`, `spawnUnnatural`, `dreadEvent`, `cancelDreadEvent`, `dreadTick`, `groundAwareness`, `setAwareness`, `completeDreadMode`, `recordDread`.
- Save keys: `ashen-vow-settings-v1` (adds `settings.dread`), `ashen-vow-dread-v1` (journal, modes, achievements, rewards). Campaign progress untouched.
- Tests: `tests/dread.test.js` (32 model tests), `tests/dreadcore.test.js` (13 live-engine tests), `tools/dread-smoke.mjs` (browser flow).

## 0. v0.22.0 — Update XI: Scary Mode 2.0 (The Nightmare Protocol)

- `src/scary2.js` — pure horror system. `SCARY_DIFFICULTY` (easy/normal/hard) carries gameplay multipliers (`detection`, `aggression`, `reaction`, `speed`, `damage`, `attackRate`, `searchTime`, `surpriseChance`, `eventChance`, `flanking`), presentation policy, and eight comparison rows. `sanitizeHorrorSettings` produces the single flat `settings.scary` object (legacy v0.21 keys included). `resolveHorrorPresentation(settings, {accessibility, graphics})` returns the three layers: gameplay, jumpscares, visual, audio, camera, enemy, horror; accessibility and the graphics preset can only remove effects.
- `HORROR_TABS` = jumpscare | audio | visual | enemy | comfort; `HORROR_SETTING_DEFINITIONS` (60+ rows, `scary.*` paths) is rendered by the dedicated screen, not the 14-category Settings 2.0 screen.
- `ScareLedger` — repeat prevention + per-session ceiling.
- `HORROR_EVENTS` (10) + `HorrorEventDirector` — requirements, warn/active phases, duration, per-event cooldown, cancellations (room change, death, menu, cinematic, low health, combat, hard timeout), safe exits and `drain()` change list. Auto-start only runs on frame-sized steps (dt < 1.5).
- `SCARY_ENEMIES` (4) + `makeScaryEnemy` — hollow_wraith (follow-and-fade), night_stalker (flank-strike), silent_knight (patrol-and-lunge), forgotten_one (phase-volley-slam).
- `HorrorJournal` — `ashen-vow-horror-v1`; enemies, events, areas, bosses, relics, challenges, clears, counters, rewards, flags; 7 achievements and 7 cosmetic rewards (`HORROR_REWARD_ACHIEVEMENT`).
- `src/core.js` — `setScaryMode({enabled, difficulty})` (never touches `this.difficulty`), `applyScaryScaling` (aggro/speed/reaction/damage stacked once via `e.scaryBase`), `spawnScaryEnemy`, `enemySource`, `reappearScary` (nav node + LOS, never through geometry), `updateScaryEnemy`, and a `if (e.scaryKind) { ... continue; }` dispatch before the generic search/return layer.
- `src/render.js` — `drawHorrorAtmosphere(ctx, layer, w, h)`: desaturation, darkness, fog, vignette, distortion lines, distant silhouette; no flashes and no camera scaling.
- `src/main.js` — Scary Mode screen (`#scary-screen`), `buildScaryScreen`, difficulty cards, journal/achievements/rewards panel, delegated `data-horror-path` inputs, `startScaryRun`, `toggleAntiJumpscare` (also `#btn-pause-anti` in the pause screen), `horrorTick` (frame-driven, records completed events, spawns pursuers), `horrorRenderLayer`, and hooks: `scary2`, `horror`, `horrorEvents`, `horrorJournal`, `horrorTabs`, `scaryEnemies`, `horrorSettings`, `setHorror`, `setHorrorPath`, `startHorrorEvent`, `cancelHorrorEvent`, `recordHorror`, `openScary`, `closeScary`, `startScaryRun`, `previewHorrorAudio`, `previewHorrorVisual`, `resetHorrorSettings`.
- Tests: `tests/scary2.test.js` (28 model tests) + `tests/scary2core.test.js` (9 live-engine tests). Suite 517/517. Browser: `npm run smoke:scary2` (44 checks).

## 0. v0.21.0 — Update X: Perfect Path, Boss Core & Scary Mode

- `src/ai_nav.js` — pure navigation + AI. `NavGraph` samples `room.platforms` into surface nodes, links typed `walk`/`jump`/`drop` edges, and runs A* (`path()`), `lineOfSight()`, `groundAt()`, `setBlocked()`/`invalidate()`. `EnemyBrain` owns perception (range + LOS + memory), the 12-state machine with `AI_TRANSITIONS` validation, path following with repath budgeting, separation, stuck detection (`unstickDir`, `unstickTimer`) and `debugSnapshot()`. `AI_PROFILES` separates melee/ranged/magic/flyer/heavy/assassin/elite/boss.
- `src/boss_core.js` — `AttackHitbox` (windup/active/recovery, cancelOn death|stagger, one hit per target, continuous interval), `HitboxSet`, `BossPhysics` (gravity, ground snap, step assist, wall/arena clamp, decaying knockback, non-finite guard), `PhaseController` (sorted thresholds, duplicate/dying/cooldown guards), `validateBossConfig`, `simulateBossCombat`, `bossDebugSnapshot`.
- `core.js` wiring: `loadRoom`/`loadArena` call `rebuildNav()`; `brainFor()` is lazy; `updateEnemies` reads `view = brain.update(dt, ...)` and uses `view.aggro`, `view.dir`, `view.state`, `view.stuck`; search/return/retreat/assist/guard are driven by `driveBrain()`; `unstickEnemy()` hops with `e.unstickLock`. Bosses get `b.hitboxes = new HitboxSet(b)`; HP is clamped, the phase loop requires `!b.dying`, and the Warden slash uses the registry + LOS. `damagePlayer(amount, sourceX, { source })` records `this.lastHit` and emits it on `playerHurt`.
- `src/scary.js` — `ScareDirector` (off by default, `onPlayerHit`, `preview`, `tick`, `cameraKick`, `snapshot`), `SCARE_PROFILES` per family/boss, `sanitizeScarySettings`, accessibility overrides. Effects always carry `damage: 0` and `blocksInput: false`.
- Settings: `scary.*` lives in `defaultExtendedSettings().scary`, `SETTING_DEFINITIONS` (category `gameplay`), and `sanitizeExtendedSettings` via `sanitizeScarySettings`. No new settings tab (still 14).
- UI: `renderer.drawScareOverlay(ctx, effect, w, h)` + `drawAiDebugOverlay`; `#scare-preview` overlay and `#btn-scare-preview`; `#debug-screen` (AI/Boss/Scary panels), `?dev=1` or F9, `__ashen.openDebug/closeDebug/toggleAiDebug/aiDebug/scary/previewScare/setScary/simulateHit`.
- Version 0.21.0; update-log entry `UPDATE X — PERFECT PATH, BOSS CORE & SCARY MODE`.
- Tests: `tests/ainav.test.js`, `tests/bosscore.test.js`, `tests/scary.test.js` (41 tests). Suite 479/479. Browser: `npm run smoke:updatex` (27 checks). Stress: `node tools/updatex-stress.mjs`.

## 0. v0.20.0 — GLB Asset Pipeline & Real WebGL2 3D Renderer

- `tools/export-glb.mjs` authors the runtime 3D kit into `assets/3d/*.glb`: indexed meshes with UVs, PBR metallic-roughness materials, 11–20 joint skeletons, inverse bind matrices, Idle/Walk/Attack clips, three LODs and a `_COL` collision mesh. Re-run it after changing part authoring; never hand-edit the binaries.
- `src/glb.js` is the pure glTF 2.0/GLB parser (accessors with byteStride, skins, nodes, animations with quaternion SLERP, materials, LOD/collision helpers, mat4/perspective/lookAt). Keep it DOM-free; it is covered by `tests/gltf.test.js`.
- `src/webgl3d.js` is the WebGL2 renderer: GPU skinning, GGX PBR, a 1024² shadow map with PCF, RGBA16F HDR target, 4× MSAA resolve, ACES tonemap, spatial upscale/sharpen, anisotropic filtering, distance-based LOD, instanced props. It composites into `canvas-3d` via `drawImage`, so HUD and smoke pixel checks keep working.
- `render3D()` in `src/mode3d.js` tries the GL path and falls back to `render3DScene()`; `__ashen.gfx3D` exposes state/available/models/props/hdr/msaa/anisotropic/stats.
- `src/gpu.js` measures real capabilities (adapter string, float render targets, anisotropy limit, MAX_SAMPLES, timer query, HRTF, refresh rate). Never fabricate GPU numbers or claim ray tracing.
- `src/mode3d_content.js` holds 10 areas, 5 dungeons, 5 elite types, 5 bosses, 20 relics, 10 vaults. Relic effects clamp in `applyRelics()`; `Ashen3DGame.setArea()` applies region, spawns, elite, boss and vault.
- Spatial audio: `SoundKit.setSpatial()/setListener()/playAt()` use PannerNodes (HRTF in `spatial` mode); the 3D loop drains `game3D.drainSounds()`.
- Tests: `tests/gltf.test.js` covers GLB structure, bind matrices, animation sampling, LOD reduction, props, and content integrity.

## 0.00 v0.18.0 — Eclipse of the Forgotten Gods

- `src/eclipse.js` — pure Arc VIII content and logic: 6 biomes, 30 exact standard stages, 37 rooms (IDs 525–561), 7 bosses, 30 enemies, elemental reactions, damage pipeline, dodge/counter/break/mastery, five classes, seven weapons, 100 Godfall floors, guild/raid model, Awakening, graphics presets, frame sampler, save v2 migration.
- `src/qa.js` — content/room/boss-phase validation, 30-item release gate, bug registry, runtime exception reporter, stuck-enemy detection, network snapshot validation.
- `src/eclipse_ui.js` + `styles-eclipse.css` — single **ECLIPSE OF THE FORGOTTEN GODS** hub with campaign, Godfall, guilds/raids, Awakening, Combat 2.0, graphics, and QA tabs.
- `src/core.js` — imports Eclipse rooms/enemies/bosses/classes/weapons/shop items; `ALL_ROOMS` is **662**, legacy `ROOMS` stays **14**. Enemies expose `archetype`; combat routes through the Eclipse damage pipeline, perfect dodge, break, reactions, mastery, and weapon skills.
- `src/main.js` — progress defaults/sanitization for `eclipse`, `godfall`, `guild`, `awakening`; save backup/quarantine and migration; `startEclipseStage`, `startEclipseGodfall`, `startEclipseRaid`, hub sync, event routing, death/retry branches, music, debug hooks, live frame-time sampling.
- `src/settings.js` — advanced graphics fields, `graphicsPreset`, and 30 FPS frame cap; `weaponSkill` is binding 15.
- Save payload is `schemaVersion: 2` under `ashen-vow-progress-v1`; backup `ashen-vow-progress-v1-backup`; corrupt payload quarantine `ashen-vow-progress-v1-quarantine`.
- Tests: `tests/eclipse.test.js` (13, including live all-phase boss clears). Full suite **413/413**. `npm run smoke:eclipse` (30 checks) drives the real browser hub, 20/4/1 encounter, Godfall, guild/chat, Awakening, Low preset, QA gate, backup save, and frame sampler.
- Unverified gates are intentional: low/medium/high hardware profiling, memory soak, full multiplayer network load, and complete stress soak remain blocked in the release board until measured.

## 0.0 v0.17.0 — Infinite Realms, Astral Dominion, Stage Access & Admin Control Center

- `src/realms.js` — pure deterministic six-mode layer (Riftfall, Relic Expedition, Last Bastion, Echo Maze, Shadow Duel, Chrono Fracture), Stage Access catalogue, HACK config, `progress.realms`, server claim eligibility.
- `src/realms_render.js` — canvas renderers for all six modes.
- `src/realms_ui.js` — mode hub/run shell, Stage Access three-panel browser, read-only Sneak Peek, HACK toolbar (restart, reset, boss phase, teleport, environment, collision, performance, exit), and Arc VI hub.
- `src/astral.js` — Arc VI data: regions, 20 rooms at global IDs **505–524**, 5 enemies, 5 bosses, final four-phase Architect of Eternity, `progress.astral`, locked Unwritten Expanse, validator enforcing 20 enemies / 4 archetypes / 1 elite.
- `src/admin_server.js` — separate admin service: scrypt passwords, HttpOnly sessions + CSRF, optional TOTP, 7 roles / 26 permissions, players, moderation, content validation/overrides, economy, events, reports, announcements, actual process metrics, persistent audit logs, server-verified mode reward claims.
- `admin.html`, `admin.css`, `src/admin.js` — dedicated `/admin` Control Center with 16 sections. Admin state lives in `data/admin-state.json` (gitignored) and `/data/` is blocked from static serving.
- `server.js` — routes `/admin` and `/api/*`, tracks real request/latency/memory/WebSocket metrics, rejects new co-op upgrades during maintenance, and serves public platform/status, player sync, realm run registration/claim endpoints.
- Save: `progress.astral` and `progress.realms` inside `ashen-vow-progress-v1`. Legacy keys and sizes stay intact; `ALL_ROOMS` is now 525 and legacy `ROOMS` remains 14.
- Co-op remains the zero-dependency `/ws` relay (campaign/Hearthfall/Labyrinth, 2–4 players). No external multiplayer service is required.
- Tests: `tests/astral.test.js`, `tests/realms.test.js`, `tests/admin.test.js`; full suite **400/400**. Browser smoke `npm run smoke:realms`.

## 0.1 v0.16.0 — Wave Defense: The Last Rampart

- `src/wavedefense.js` — pure deterministic castle-defense mode: 3 maps with 24 build slots each, 24 waves, 12 towers (Ballista, Catapult, Trebuchet, Mage Tower, Cannon Tower, Frost Spire, Flame Keep, Poison Grove, Tesla Coil, Sniper's Nest, Holy Chapel, Rift Obelisk), 12 enemy types, 6 bosses, 3 difficulties, three tower levels, early-wave bonus, 62% sell refund, and castle HP. Renderer caches the static battlefield and caps enemies/projectiles/effects.
- `src/main.js` — **WAVE DEFENSE — THE LAST RAMPART** hub and battlefield: map/tower/difficulty pickers, canvas placement, tower panel, wave control, 1×/2×/3× speed, pause, result, 8 Hz HUD updates, boss bar, battle feed, responsive pointer coordinates, and debug hooks `showWaveDefense`, `startWaveDefenseBattle`, `waveDefenseBuild`, `waveDefenseUpgrade`, `waveDefenseSell`, `waveDefenseNextWave`, `waveDefenseStep`, `waveDefenseWin`, `waveDefenseDamageCastle`, `waveDefenseSetWave`.
- Save: `progress.wavedefense` inside `ashen-vow-progress-v1`; records runs, wins, losses, best wave/score, per-map runs/wins, and tower usage through `sanitizeWaveDefenseProgress` / `recordWaveDefense`.
- Tests: `tests/wavedefense.test.js` (10 tests: data counts, economy, build/upgrade/sell, wave spawn/leak, boss wave, 24-wave victory, defeat, sanitizer, snapshot/renderer). Browser smoke `npm run smoke:wavedefense` (59 checks); benchmark `npm run bench:wavedefense`.

## 0.05 v0.15.0 — The Fivefold Trials, Puzzle Adventure & Riftwar

- `src/trials.js` — pure biome-combat expansion for all 20 labyrinth biomes: 100 standard levels generated from a data-driven 20-enemy / 4-archetype / 1-elite template (19 normal + 1 guaranteed elite), four 5-enemy waves, per-biome bosses, one-shot boss rewards, arena builder and boss overrides, and `progress.trials` with a sanitizer that rejects out-of-order clears and forged bosses.
- `src/puzzle.js` — pure Puzzle Adventure framework: 23 puzzle categories over 8 real engines (path, pipes, image, sequence, beam, gear, toggle, swap), deterministic generation from a known solution, automatic solvability validation, an editor publish gate, a co-op snapshot codec, **10 arcs / 100 stages**, 10 Metroidvania abilities, ten puzzle bosses, an index/lore dataset (`PUZZLE_ARCS`, `PUZZLE_LORE`, `PUZZLE_TYPE_LORE`), and `progress.puzzle`. Every arc finale is a boss-timed puzzle with a 90-second phase limit (`PUZZLE_BOSS_TIME_LIMIT`); expiry records `stats.timeouts` and never grants progress. Hint purchases (`PUZZLE_HINT_COST = 100` Gema) reveal the next recorded solution move; `payPuzzleHint()` is pure and refuses insufficient funds without mutating progress.
- UI: **THE FIVEFOLD TRIALS** hub (20 biome cards, five levels each plus a gated boss arena) and **PUZZLE ADVENTURE — THE LOST MECHANISM** hub with an interactive board for every engine. Trial levels run through `game.loadArena` + `spawnEnemy`; puzzle stages are solved on the DOM board.
- `src/moba.js` — pure Riftwar MOBA layer: `MOBA_HEROES` (all 13 core + 15 frontier classes = 28 unique heroes), 3 battlefields, 6 minion types, 12 jungle mobs, 6 epic bosses, lane towers/guards/nexuses, deterministic 5v5 simulation, four-slot abilities, movement/auto-attack, waves, gold/levels, win/loss, camera and canvas renderer. Save lives in `progress.moba` through `sanitizeMobaProgress` / `recordMobaMatch`.
- UI: **RIFTWAR — MOBA 5V5** menu entry and hub (roster filter, hero/map/lane/difficulty pickers, codex), plus `#moba-battle` canvas with top bar, team scoreboards, player HUD, ability bar, pause/result overlays and `styles-moba.css`. Debug hooks: `moba`, `showMoba`, `startMobaBattle`, `leaveMoba`, `mobaStep`, `mobaCast`, `mobaWin`, `mobaDamageCore`.
- Tests: `tests/trials.test.js` + `tests/puzzle.test.js` + `tests/moba.test.js`; browser smokes `npm run smoke:fivefold` and `npm run smoke:moba`.

## 0.05 v0.11.0 — Speedrun: Satu Nyawa

- `src/speedrun.js` — pure rules and records: `SPEEDRUN_START_MULTIPLIER = 2` with one step per cleared cycle (`speedrunMultiplier(cycle)`), `SPEEDRUN_LIVES = 1`, `SPEEDRUN_RULES`, `speedrunMaxSubsteps(scale)`, `defaultSpeedrunProgress`, `sanitizeSpeedrunHistory` (newest-first, `SPEEDRUN_HISTORY_LIMIT = 10`, clamps every field), `sanitizeSpeedrunProgress`, `speedrunSummary`, and `recordSpeedrun` (appends to the history, mutates the live save object and reports `isRecord`).
- `src/core.js` — `this.oneLife` (set by the run, cleared by `reset()`): `respawnAtCheckpoint()` returns `false`, and a pit fall sets `state = 'dead'` instead of teleporting the player back to spawn. No other core behaviour changes.
- `src/main.js` — `activeRunKind = 'speedrun'`; `showSpeedrun` / `buildSpeedrunScreen` / `startSpeedrun(cycle, opts)` / `finishSpeedrun` / `handleSpeedrunClear`. The frame loop multiplies the accumulator by the multiplier while keeping the 1/120 s fixed step; `bossDown` for `oathbreaker` sets `speedrunCleared` and the escalation restarts the campaign at the next multiplier. Death opens `#speedrun-summary-screen` instead of the generic death screen, `retryRun` cannot revive, and HUD `#speedrun-badge` shows `⚡ 3× · 1 NYAWA · PUTARAN 2` (danger styling from 5×). Hooks: `speedrun`, `showSpeedrun`, `startSpeedrun`, `finishSpeedrun`.
- `index.html` / `styles.css` — **SPEEDRUN — SATU NYAWA** menu entry, hub `#speedrun-screen` (records, five rules, 2×→∞ ladder), death summary `#speedrun-summary-screen`, and `.speedrun-*` styles.
- Save: `progress.speedrun` (`runs`, `deaths`, `clears`, `bestMultiplier`, `bestCycles`, `bestTime`, `bestRooms`, `lastMultiplier`, `lastTime`, `history[]`) inside `ashen-vow-progress-v1`, sanitized on load; each history entry is `{ multiplier, clears, rooms, time, died, at }`.
- Tests: `tests/speedrun.test.js` (9 tests: multiplier ladder, sanitizer, records, history cap/order/junk, substep budget, checkpoint refusal, lethal vs non-lethal pits) plus updated update-log assertions. Total suite **274/274**. Browser smoke `node tools/speedrun-smoke.mjs` drives the real UI (2× start, faster-than-wall-clock pacing, lethal pit, one-life summary, restart, Oathbreaker escalation to 3×, second death at 3×, history, reload persistence) and `node tools/speedrun-mobile.mjs` repeats the hub, badge, summary and history checks at 390×844.

## 0.1 v0.10.0 — Taman Peri (Faewood)

- `src/fairy.js` — pure fairy-biome content: `FAIRY_ZONE` (faewood), 10 sequential stages at global rooms **414–423**, 2 boss arenas (424–425), 10 `FAIRY_ENEMY_INFO` mobs (Tiny Cap, Puff Spore, Glow Midge, Thorn Pixie, Myconid Guard *elite*, Shroom Brute, Fae Duelist, Lantern Moth, Magma Blob, Elder Spore *spawner*), 4 tiny NPCs (Pipp, Nia, Moss, Wick), `FAIRY_BOSS_INFO` with **Gelora, Slime Magma** (4 phases, 1600 HP) and **Sylvara, Peri Naga Spektral** (4 phases, 2600 HP, `reward: 'victory'`), `DRAGON_FORMS` (phase 3 = heaven **Sylvara, Seraph of the Woven Sky**, phase 4 = hell **Vharos, Demon Lord of the Last Vow**), `fairyBossUnlocked`, progress helpers and a `progress.fairy` sanitizer.
- `src/core.js` — `FAIRY_ROOMS` appended to `ALL_ROOMS` (**426** rooms total), `FAIRY_ENEMY_INFO`/`FAIRY_BOSS_INFO` merged into `ALL_ENEMY_INFO`/`ALL_BOSS_INFO` (**72** bosses). `hurtBoss()` applies `forms` inside the existing phase loop: it rewrites boss name/title/colour, sets `formMusic`, sets `game.arenaTheme`, and emits `bossForm`. `loadRoom()` clears `arenaTheme` and emits `npcHello`; `finishBoss()`/`reset()` clear the arena theme. No legacy room, gate, or CODEX entry changed.
- `src/cutscene.js` — `BOSS_CUTSCENE` (20 s, 5 beats) and `POST_CREDIT` (30 s epilogue about the fallen Demon Lord and Opus freed), plus `cutsceneFor`, `cutsceneBeatAt` and the procedural `drawCutscene` renderer.
- `src/music.js` — `faewood`, `magmaBoss`, `fairyBoss` and `celebration` tracks; `BOSS_TRACKS` maps both fairy bosses, and `desiredTrack()` uses `celebration` when a Faewood run reaches `victory`.
- `src/render.js` — `game.arenaTheme.palette` / `.particle` override the room palette and particle mood without mutating room data, and `drawFairies()` draws the tiny NPCs.
- `src/main.js` — `progress.fairy` sanitisation, hub (`menuView = 'fairy'`, `showFairy`, `buildFairyScreen`, `startFairyStage`, `startFairyBoss`), `activeRunKind = 'fairy'` run flow, `handleFairyBoss`, event routing for `gatePass`/`roomEnter`/`bossDown`/`npcHello`/`bossForm`, retry branch, cutscene playback (`startCutscene`/`finishCutscene`/`playFinalBossCutscene`/`queuePostCredit`), a 2.4 s post-victory delay before the epilogue, and HUD phase numerals IV/V plus form banners. Debug hooks: `fairy`, `showFairy`, `startFairyStage`, `startFairyBoss`, `cutscene`, `startCutscene`, `finishCutscene`, `runKind`.
- `index.html` / `styles.css` — **TAMAN PERI — FAEWOOD** menu entry, `#fairy-screen` hub, `#cutscene-screen` (canvas + subtitles + skip), fairy/cutscene styles, and v0.10.0 version strings (`72 BOSS`, `426 RUANG`).
- Tests: `tests/fairy.test.js` (12 deterministic tests: content, chain, boss seal, progress sanitizer, forms/`arenaTheme`, cutscene durations, real core fights for both bosses) plus updated count assertions in `tests/court.test.js`/`tests/expansion.test.js` and the 0.10.0 update-log check. Total suite **264/264**. Browser smoke `node tools/fairy-smoke.mjs` passes **57 checks** (hub, ten-stage chain through the real gates, boss seal, cutscene, heaven/hell forms, `celebration`, 30 s epilogue, reload persistence, no console errors). Portrait-phone layout smoke `node tools/fairy-mobile.mjs` (390×844 touch, `npm run smoke:fairy:mobile`) checks the title menu, the Faewood hub, the in-game Update Log (Faewood entry, form/epilogue copy, 15 November 2026 date) and the cutscene screen for horizontal overflow; the cutscene screen is forced to `position: fixed` in the portrait media query so cinematics escape the 16:9 frame.

## 0.25 v0.9.0 — Skill Point & Panggung Abadi

- `src/skills.js` — pure Skill Point model: two branches, 6 nodes, 23 ranks (`ult_damage` +15%/rank, `ult_cooldown` −6%/rank, `ult_crit` +5%/rank at ×1.75, `vow_vigor` +12 HP, `ash_harvest` +10%, `flask_bearer` +1 flask), `skillBonuses`, `spendSkillPoint`, `resetSkillRanks`, `grantSkillPoints`, `grantBossSkillPoints` (2 first kill, 1 every third repeat), `skillSummary`, and `sanitizeSkillState` under **`progress.skills`**.
- `src/bosspack.js` — Panggung Abadi: 6 new bosses (Malveth the Ash King, Ilyra the Glass Warden, Abbot Vurn the Hollow, Valkyr of the Ninth Storm, Seraph of the Last Dawn, The Oath Eater) with 3–5 phases, descending `phaseThresholds`, full intro/phase/defeat dialogue, one echo-boss pattern each, `music` ids, and sequential progress helpers under **`progress.pack`**.
- `src/core.js` — imports `PACK_BOSS_INFO` into `ALL_BOSS_INFO` (70 bosses total, no new rooms); `skillBonuses` + `applySkillBonuses()` apply HP/flask deltas and ash/damage multipliers; `useAbility()` now wraps `performAbility()` so one scale (`ultDamage × crit`) applies to `hurtEnemy`, `hurtBoss` and ability projectiles; `emit({ type: 'ultimate' })`; skill ash multiplies enemy/boss rewards. `reset()`/`applyCharacter()` clear stale skill deltas so re-applying after a reset never loses the bonus.
- `src/music.js` — six new boss tracks (`bossAsh`, `bossGlass`, `bossAbbot`, `bossStorm`, `bossDawn`, `bossJudge`), `BOSS_TRACKS` + `bossTrackFor(kind, fallback)`, and `setBossPhase(phase, maxPhases)` / `clearBossPhase()` for filter opening, low pulse layer and stronger percussion per phase.
- `src/main.js` — `progress.skills` / `progress.pack` sanitization, `applyCharacterToGame()` also applies skill bonuses, `awardBossSkillPoints()` on every `bossDown` / `labyrinthBossDown`, character-screen Skill Point panel (`buildSkillPanel`, `spendSkillPointAt`, `resetSkills`), Panggung Abadi hub section (`packSection`, `startPackRun`, `handlePackBoss`, `activeRunKind = 'pack'`), boss music selection in `desiredTrack()`, and per-phase music in `syncMusic()`. Debug hooks: `skills`, `pack`, `skillSummary`, `spendSkill`, `resetSkills`, `applySkills`, `awardBossSkillPoints`, `startPackRun`, `bossMusicFor`, `runKind`.
- `index.html` / `styles.css` — Skill Point panel markup/styles and pack card grid; version strings now v0.9.0.
- Optimization: `AshenGame.compactRemoved()` replaces `Array#filter` in projectile/fx/enemy hot loops; `tools/sim-bench.mjs` measures **1.27×** step throughput (25,091 vs 19,683 steps/s at 120 Hz).
- Tests: `tests/skills.test.js` (12 deterministic tests: model, economy, core ultimate scaling, reset re-apply, pack metadata/dialogue/music, pack progress, MusicManager safety) + 2 updated count assertions. Total suite **251/251**. Browser smoke `node tools/skill-smoke.mjs` passes 18 checks (v0.9.0 boot, 6-node panel, spend/persist, 6 pack cards, locked progression, boss theme, full gauntlet, reload persistence, no console errors).

## 0a. v0.14.0 — The Radiant Crusade (Arc III) + Arc II expansion

- `src/crusade.js` — pure, deterministic third arc: 5 levels, 20 rooms (`CRUSADE_ROOM_START = 485`, ids 485–504), 15 mobs + 6 elites, 5 bosses, 5 banners, 3 upgrade tracks, Valor Chain, paladin chain, Arc IV rift flag, and `progress.crusade` with a full sanitizer.
- Valor Chain: hits fill it (`VALOR_MAX 10`), damage empties it, chain raises damage (1 + 0.06/step), and at chain ≥ 5 `crusaderStrike()` spends 4 chain for a heavy shield-breaking blow (`G`). `paladinChainTick()` grows the Paladin's own chain in phase 2; `breakPaladinChain()` staggers him.
- Rooms: 3 halls + 1 boss per level, Kemah Perang checkpoint at slot 0, Banner Shrine at slot 2. Boss gates chain levels; the Paladin's gate is null. `The Rift` menu entry is intentionally disabled.
- Core: `ALL_ROOMS` appends `CRUSADE_ROOMS` (too 505, last id 504); `ALL_BOSS_INFO` gains `crusade_*`; `ALL_ENEMY_INFO` gains 21 entries. Paladin purity shield 200, other crusade bosses 140.
- UI: `#crusade-menu-screen` (camp canvas, 6 options, rift locked), `#crusade-screen` (tabs levels/banners/bestiary/camp/archive), `#crusade-clear-screen` (Arc IV teaser), `#crusade-hud` (valor bar, banners, paladin chain, strike button), and `styles-crusade.css`. Clear opens the war camp on next boot.
- `src/fallen.js` grew to 11 regions / 59 rooms / 15 bosses: `weeping_orchard` (465), `bellfall_quarter` (470), `sunless_vault` (475), `penitent_stairway` (480), interleaved by `order`; unlock uses `unlockAfter` (any-of boss list), and room progress is addressed by global id so old saves stay valid.
- Debug hooks: `__ashen.crusade`, `showCrusadeMenu`, `showCrusade`, `buildCrusadeMenu`, `buildCrusadeScreen`, `startCrusadeLevel`, `startCrusadeBoss`, `crusadeStrike`, `unlockCrusadeNow`, `buyCrusadeUpgrade`, `addCrusadeSigils`.
- Tests: `tests/crusade.test.js` (22) + `npm run smoke:crusade` (56 browser checks, zero console errors). `__ashen.step()` now runs the active arc tick so Valor/Radiance advance under test.
- Fixed a v0.13.0 import bug: `tickFallen()` called `radianceGain()` without importing it, which threw on the first boss hit in a Fallen run.

## 0. v0.13.0 — The Fallen Ones (Arc II: Heavenly Descent)

- `src/fallen.js` — pure, deterministic second campaign: 7 regions, 39 rooms (`FALLEN_ROOM_START = 426`, ids 426–464), 17 enemies + 6 elites, 11 bosses (7 story + 4 optional), 6 abilities, 4 upgrades, sky weapons, 5 Echoes, 3 endings, and a complete progress model under `progress.fallen`. v0.14.0 expanded it to 11 regions / 59 rooms / 15 bosses.
- Ascension: `ascendProgress(progress)` requires base `cleared[7]`; boot calls it, so an old save that already felled The Oathbreaker lands in the heavenly menu. `THE BELOW` returns to the original title screen.
- Mechanics: Radiance → Blinding Burst, Judgment Mark (detonate while still, clear on move/attack), Shadow Stance (+35% damage, HP drain, 15% floor), and **Purity Shield implemented in `core.hurtBoss()`** — while `b.purityShield > 0`, raw damage drains the shield but passes only 15% to HP and emits `purityHit`. `spawnBoss()` seeds `purityShield`/`purityMax` from `FALLEN_BOSS_INFO`.
- Echoes carry over from base progress (`fallenEchoesFor`, cap 5); abilities reset. Eclipse requires all four optional bosses and is re-checked by the sanitizer.
- UI: `#fallen-menu-screen` (six options, figure canvas, theme toggle), `#fallen-screen` (tabs regions/bestiary/echoes/upgrades/archive), `#fallen-ending-screen`, `#fallen-hud` (radiance, marks, shadow, shards, abilities), and `styles-fallen.css`. Keys: `B` burst, `V` shadow, `N` cleanse.
- Debug hooks: `__ashen.showFallenMenu`, `showFallen`, `buildFallenMenu`, `buildFallenScreen`, `startFallenRegion`, `startFallenBoss`, `fallenBurst`, `fallenShadow`, `fallenCleanse`, `chooseFallenEnding`, `ascendNow`, `ascendIfEligible`, `buyFallenUpgrade`, `addFallenShards`, and `__ashen.fallen`.
- Tests: `tests/fallen.test.js` (30) + `tools/fallen-smoke.mjs` (39 browser checks). Room totals in `tests/court|fairy|expansion` include the 39 new rooms; `ALL_BOSS_INFO` includes 11 new bosses.

## 0b. v0.7.0 — Infinite Labyrinth & Co-op

- `src/labyrinth.js` — pure, deterministic Cursed Realms data and logic: 20 zones, 40 named enemies, 30 bosses (3–7 phases, Common–Mythic rarity, phase dialogue), 40 cursed/ritual/corrupted items across 8 categories, 8 rituals, 6 Forbidden Synergies, 11 cycle modifiers, 10 modes, 10 elite tiers, reward chambers, checkpoint serialization, local leaderboard, mastery and save sanitizer (under `progress.labyrinth`).
- `src/coop.js` — transport-agnostic co-op: lobby (room code/password/ready/leader), party scaling, downed/revive rules, quantized snapshot codec, delta frames, interest management, interpolation buffer, movement validation, rate limits, fair personal loot, session registry and reconnect tokens.
- `server.js` — adds a zero-dependency RFC 6455 WebSocket relay at `/ws` (room grouping, sender tagging, spoof stripping, 24 KB cap, rate limit, host migration). Set `HOST=0.0.0.0` for LAN co-op; the static server still binds loopback by default.
- `src/core.js` — additive APIs: `loadArena`, scaled/elite `spawnEnemy`, `spawnBoss(kind, overrides)`, `setAllies`/`setAllyInput`/`updateAllies`, `labyrinthBossDown` finish branch, per-boss dialogue overrides, incoming/heal multipliers and crit chance. Legacy rooms, gates, blessings and side content are untouched.
- UI: main menu **MULTIPLAYER — CO-OP** opens the shared lobby with **Kampanye / Hearthfall / Labyrinth** mode buttons; the Labyrinth hub keeps its own co-op tab. Guest snapshots carry `scene`, `roomIndex`, player IDs and boss metadata, so each guest controls its own avatar while the host remains authoritative. Debug hooks: `__ashen.showLabyrinth`, `showCoop`, `startLabyrinth`, `labyrinth`, `chooseLabReward`, `finishLabRun`, `labHostCoop`, `labJoinCoop`, `labStartCoopSession`, `startCoopGuestForTest`, `applyCoopTestSnapshot`.
- Tests: `tests/labyrinth.test.js` + `tests/coop.test.js` + `tests/coop-relay.test.js` (determinism, wave director, items/rituals/synergies, loadout, save, checkpoint, real core arena/boss/allies, snapshot/delta/interp, lobby/revive/loot/session, relay spoofing/targeting/capacity/bad JSON/host migration). `tools/lab-smoke.mjs` drives the real browser + live WebSocket co-op, including campaign host and guest avatar application.

## 0.5 v0.8.0 — Hearthfall: The Hollow Court

- `src/court.js` — pure content + progression layer: 6 zones / 60 rooms at global indices **354–413**, 24 enemies, 12 bosses (mini-bosses 3 phases, zone bosses 4 phases, full dialogue), 8 data-driven weapons, 12 tools, 6 house rooms / 24 furnishings / 8 NPC residents with affinity + 3-step quests, 2 replayable trials (the boss rush spans all twelve bosses), court NG+ 0–4, and `progress.court` sanitization. It has no imports, so core can depend on it without a cycle.
- `src/core.js` — additive wiring: `ALL_ROOMS` = legacy + expansion + Atlas + court (414 rooms), `ALL_ENEMY_INFO` / `ALL_BOSS_INFO` include court entries, `WEAPONS` merges `COURT_WEAPON_META`, and melee/projectile attacks now support court profiles (`attacks[]`, `projectile`, `lifesteal`, `shockwave`) without changing sword/pike/bow behaviour. Court bosses also exercise the generic phase loop through phase IV, including the echo-boss escalation branches.
- `src/core.js` — the roster now has 13 classes; the three court-native classes are Ashwright (`cinder_rush`), Hearthkeeper (`warmth_ward`), and Glassblade (`mirror_lance`), each with a real active ability rather than a stat-only variant.
- `src/music.js` — seven procedural court tracks: `hearthfall`, `glassorchard`, `hollowcourt`, `cinderworks`, `lastvigil`, `courtBoss`, `hearth`.
- `src/zones.js` — the five court zones are registered through the existing zone contract; `zoneIdForRoom` already prefers `room.zone`.
- `src/main.js` — hub (`menuView = 'court'`) with four tabs (journey / house / residents / arsenal), court run flow (`activeRunKind = 'court'`), boss/clear recording, house and NPC actions, boss-rush/gauntlet trial flow, NG+ controls, debug hooks (`showCourt`, `startCourtRoom`, `startCourtTrial`, `courtAction`, `court`).
- `index.html` / `styles-court.css` — **HEARTHFALL — THE HOLLOW COURT** menu entry and responsive hub.
- `tools/court-bench.mjs` — measured hot paths. On the dev machine: room lookup **5.82×** faster than `Array.find`, cached house bonus aggregate **7.85×** faster than the cold path, resident lookup roughly equal (0.98×) because the roster is only eight entries.
- Tests: `tests/court.test.js` has 22 deterministic tests (content counts, room validator, boss 3–4 phases/dialogue, phase-IV transition, zone gates, zones/music, enemy/boss integration, weapons, house economy/cache, tools, NPC dialogue/quests, trials/NG+, mark pacing, save sanitizer, loadout, real simulation). Total suite **237/237**. Browser smoke `npm run smoke:court` passes the real 60-room/12-boss hub, house/NPC actions, room 354 run, clear + save, reload persistence, and the first two bosses of the twelve-boss rush with no console errors.

## 0.06 v0.12.0 — Pondok Umpan (fishing)

- `src/fishing.js` — pure data and arithmetic: **9 baits** in 3 price tiers (25/50/100 coins: worm, cricket, cheese / minnow, clam, squid / sliced fish, shrimp, glowworm), **25 fish** in 5 rarities (`FISH_RARITIES`), `fishingCatchTable(baitId)` (exact per-fish odds, each bait column sums to exactly 100 via largest-remainder rounding), `baitTierChances`, `baitHighTierChance`, `rollFishingCatch`, `reelZone`/`reelHit` (hit half-width 30% → 7% of the bar by rarity), `rollFishWeight`, `defaultFishingProgress`, `sanitizeFishingProgress` (starter grant happens once, `starter: true`), `fishingCast` (spends one bait), `fishingLandCatch` (pays value, records heaviest), `fishingEscape`, `fishingBuyBait`, `fishingSummary`, `fishingIndex`, and `drawFishingIcon(ctx, …)` procedural canvas art (6 body shapes, patterns). No DOM access.
- `src/main.js` — `menuView` gains `fishing | baitShop | fishIndex`; `fishingState()` lazily owns `progress.fishing`. Functions: `showFishing`/`closeFishing`, `buildFishingScreen` (bait rack, pond card, cast button label), `selectFishingBait`, `beginFishingCast`/`fishingReelLoop`/`strikeFishingReel` (marker sweeps 1.35 s; TARIK button, `Space`, `Enter` or tap), `openBaitShop`/`buildBaitShop`/`buyFishingBait`, `openFishIndex`/`buildFishIndex`/`setFishIndexTab`/`paintFishIcons`. The index cards hold `<canvas data-fish-icon>` art plus the nine per-bait odds. HUD writes are cached (`hpCache`, `roomHudCache`, `speedBadgeCache`) so the frame loop only touches the DOM when values change.
- `index.html` / `styles-fishing.css` — **PONDOK UMPAN — MEMANCING** menu entry, `#fishing-screen` hub with `#fishing-cast` reel overlay, `#bait-shop-screen` wooden shack (plank roof, wallet), and `#fish-index-screen` with rarity tabs. Every grid uses `minmax(min(Npx, 100%), 1fr)` with a single-column fallback under 420 px.
- Save: `progress.fishing` (`coins`, `bait{}`, `caught{}`, `records{}`, `selectedBait`, `starter`, `casts`, `catches`, `escapes`, `earned`, `bestKg`, `bestFish`) inside `ashen-vow-progress-v1`, sanitized on load. A new save starts with **10 worms and 250 coins**.
- Tests: `tests/fishing.test.js` (14 tests: bait prices/pools, odds normalize to 100, higher bait favours rarities, weighted rolls, reel windows, weight ranges, starter grant once, shop economy, cast bait consumption, catch records, summary rates, index columns, defensive ids). Speedrun gained `speedrunLadder` + `speedrunStats` with 2 extra tests. Total suite **291/291**. Browser smoke `node tools/fishing-smoke.mjs` (**84 checks**) drives the real hub, shack, purchases, reel hit/miss, index canvases and reload; `node tools/gadget-audit.mjs` (**207 checks / 10 viewports**, 320×568 → 1920×1080) proves zero horizontal overflow and ≥20 fps pacing.

## 0.1 v0.19.0 — Ultimate Settings & 3D Visual Overhaul

- `src/settings2.js` — 14 categories, 148 definitions, six graphics presets, 10 audio buses, 14 languages, sanitize/search/value helpers and diagnostics metadata. Saved through `src/settings.js` under the unchanged `ashen-vow-settings-v1` key at schema version 2.
- `src/difficulty.js` — six profiles (Story, Easy, Normal, Hard, Nightmare, Abyssal), unlock checks, campaign warnings. `src/core.js` applies incoming damage, enemy HP/speed/detection/attack-rate/reaction/aggression, boss damage/HP/action rate, flask recovery, hazards, elite scaling and reward multipliers without changing 20-enemy/4-archetype/1-elite rooms or boss-room separation.
- `src/mode3d_visuals.js` — illustrated Canvas renderer used by `src/mode3d.js`; layered characters, armor, weapons, NPCs, three enemy silhouettes, elite, root-titan boss, six regions, architecture, vegetation, weather, fog, post-processing and HUD. This is a detailed procedural vector renderer, **not** rigged glTF/PBR assets.
- Settings 2.0 UI in `index.html` / `styles.css` / `src/main.js`: search, Apply/Cancel, reset category/all, diagnostics, HUD Layout Editor, language shell with RTL, graphics gamma filter, difficulty cards, 3D region selector.
- Verification: `npm test` **420/420**; `npm run smoke:settings3d` drives Chrome through fourteen tabs, search, Low preset, independent mixer channels, Apply persistence, six difficulties, HUD editor, six 3D regions, reload persistence and zero console errors.
- Honest limits: HDR/ray tracing/upscalers/GPU-VRAM telemetry/secondary output devices are capability-gated and reported unsupported when absent; localization covers the settings shell and language/RTL direction, not every string; the proposed additional 3D areas, dungeons, elites and bosses were not added. Do not describe the vector renderer as authored PBR/rigged assets.

## 1. Product definition

**Ashen Vow** is a 2D medieval metroidvania / roguelike-lite played in the browser, featuring an optional dedicated third-person **3D Mode**.
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
13. **Eighteen selectable characters/classes** at the menu, each with a unique active ability. The original ten: Knight (Sera), Elf Archer (Lyna), Assassin (Kael), Brawler (Karn), Mage (Ignis), Gladiator (Varek), Netfighter (Neris), Stormcaller (Astra), Sentinel (Bram) and Warden (Maera). Hearthfall adds Nara Ashwright, Elowen Hearthkeeper and Ione Glassblade; Eclipse adds Dawn Paladin, Rift Assassin, Worldroot Druid, Chrono Weaver and Void Herald.
14. **Character customization** before starting: race (human, elf, goblin, orc, devil), 5 armor styles, skin color, and outfit color, with a live Canvas preview featuring runic altar, sparkling glitter stars, and transition pulse VFX.
15. A **60-second narrative prologue** plays before the first stage on a new journey, with voice-over and always-visible subtitles; it is skippable and never replays from Level Select.
16. **Procedural zone music** with a shared engine, per-zone tracks, boss theme, victory theme, crossfade, and a combat layer; no audio files.
17. **Settings** for audio, one or two rebindable slots per action with conflict resolution, gamepad, and accessibility; stored under `ashen-vow-settings-v1`, independent of progress.
18. **Interactive map v1** with fog of war, zone colours, markers, legend, pan/zoom/recenter, and up to 10 persistent pins.
19. **Five zone definitions** in `src/zones.js`; the current 14 rooms map across four playable zones (`mycelial` rooms 8–13 shipped in v0.1.0) so future biomes do not touch audio or map code.
20. **Mycelial Hollow branch** — entered from room 2 after the Warden falls; 6 rooms, spore trampolines, climbable mycelium, Sporeling/Stalker/Brood Mother, The Sporebound, optional Root of the First Vow behind a 120-HP breakable wall, and a return gate to room 2.
21. **Sigil & Ritual (v0.2.0)** — 4 permanent Sigils, 4 counted Ritual items, 6 consumables, quick-item cycling (`R`), an in-run Inventory overlay (`I`), a Whetstone damage buff, and an in-game Update Log (`src/updates.js`) reachable from the main menu.
22. **Echoes of the Forgotten World (v0.3.0)** — 100 expansion levels in 10 chapters (7 standard + 1 environmental + 1 elite mini-boss + 1 major boss each), 10 biomes, 100 enemy base types with 300 variants, 20 mini-bosses, 10 major bosses, 5 difficulties, 6 modifiers, 5 NG+ tiers, 8 repeatable modes, 4 endgame trials, Thornveil Haven with 10 fixed NPCs / 8 upgrades / 12 quests, 8 settlements, 52 NPCs, 6 seasonal events, 32 visual-only skins, 12 collectible categories with 120 entries, and save-compatible progress under `progress.expansion`.
25. **The Fallen Ones (v0.13.0)** — Arc II second campaign: heavenly menu takeover after room 7, 7 regions, 39 rooms (426–464), 17 enemies + 6 elites, 11 bosses (7 story + 4 optional), 6 abilities, Radiance/Blinding Burst, Judgment Mark, Shadow Stance, Purity Shield, Echoes carry-over, Shards of Halo upgrades, and Dawn/Dusk/Eclipse endings. Progress lives at `progress.fallen` in the existing save key.
24. **Expansion hub** (`X` or the main-menu button) with four tabs: **Kampanye**, **Thornveil Haven**, **Ashen Chronicle**, and **Lemari & Jurnal**. All expansion content is real playable data, not documentation-only.
24. **The Radiant Crusade (v0.14.0)** — a third war-camp menu after any Fallen ending, 5 siege levels / 20 rooms (485–504), 5 bosses ending in the 3-phase Giant Paladin Templar Knight, the Valor Chain + Crusader Strike, 5 permanent banners, 3 Sigil upgrade tracks, 21 enemies, a locked The Rift teaser, and `progress.crusade`; Arc II becomes 11 regions / 59 rooms / 15 bosses. Detailed in §0a.
25. **Infinite Frontiers: Beyond the Veil (v0.4.0)** — Dedicated third-person **3D Mode** (Thornveil Forest vertical slice with interactive tribal village, NPCs Elder Tova / Scout Rian / Shaman Lyra, 3 enemies, Thornveil Alpha elite mob, Elder Yggvar colossal boss, 3D traversal, lock-on combat, parry); **Levels 101–200** across 10 chapters (11–20); **15 playable classes** with 4 abilities and 3 specializations each; **15 Elite Mobs** across 7 ranks (E1–E7) with 10 modifiers; **15 weapon categories** and 8 regional materials; **12-layer visual customization** with 10 dyes; **Kingdom Defense** tower defense (10 towers); **10 mounts and 10 companions**; **2D & 3D Map Editor** with visual scripting nodes; and complete **30-point release checklist**. Accessible from main menu via **ASHEN VOW: 3D MODE** and **INFINITE FRONTIERS**.

## 2. Stack and constraints

| Area | Choice |
| --- | --- |
| Runtime | Zero-build HTML5 Canvas + vanilla ES modules |
| Server | `server.js`, static files, `http://127.0.0.1:4300` |
| Dependencies | None at runtime, none at test time |
| Simulation | Deterministic fixed timestep, `1 / 120 s`, no DOM |
| Tests | `node --test`, pure Node against `src/core.js` + foundation modules; CDP smoke for browser flows |
| Audio | Procedural WebAudio SFX (`src/audio.js`) and music (`src/music.js`), no audio files |
| Visuals | Procedural Canvas 2D for the main game; the 3D modes use WebGL2 with script-generated GLB assets (`tools/export-glb.mjs`, 16 files) and a Canvas fallback. There are no `.blend` sources |
| Persistence | Progress `ashen-vow-progress-v1`; settings `ashen-vow-settings-v1`; character `ashen-vow-character-v1`; plus mode keys `-horror-v1`, `-dread-v1`, `-veil-v1`, `-eternal-v1`, `-archive-v1`, `-3dhorror-v1`, `-hunter-v1`, `-secrets-v1`, `-voice-v1` |

Do **not** add a framework or bundler unless the product scope changes. The only asset pipeline is the zero-dependency GLB exporter in `tools/export-glb.mjs`.

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
| `src/zones.js` | Legacy `ZONES` + 10 biome zones + 5 court zones, `ROOM_ZONES` (14 legacy entries), and `zoneForRoom` / `zoneMusicForRoom` |
| `src/court.js` | Hearthfall: 6 zones / 60 court rooms, 24 enemies, 12 bosses (3–4 phases), 8 weapons + profiles, 12 tools, 6 house rooms, 24 furnishings, 8 NPC residents, `progress.court` save logic |
| `src/fairy.js` | Faewood finale: 10 sequential stages + 2 boss arenas at rooms 414–425, 10 enemies, 4 tiny NPCs, 2 four-phase bosses, dragon heaven/hell forms, `progress.fairy` |
| `src/lanternwake.js` | BAB X / Arc XI: 5 rooms at 669–673, 5 enemies, 4-phase `wickbearer` boss, `progress.lanternwake` |
| `tests/lanternwake.test.js` | 12 tests for the 20-enemy contract, gates, boss phases, save sanitizer and live runs |
| `tools/asset-inventory.mjs` | Reads `assets/3d/*.glb` and writes `docs/asset-inventory.md` with a real coverage gap list |
| `src/horror_tree.js` | Scary Mode Vigil Tree: 3 branches / 9 nodes / 21 ranks, point economy, sanitizer, run-start bonuses |
| `tests/horror_tree.test.js` | 10 tests for the tree model, journal persistence and live `applyHorrorTree` application |
| `src/cistern.js` | BAB IX Tidewrought Cistern: 7 rooms (662–668), 4 enemies, 3-phase `tidebound` boss, palettes, `progress.cistern` model + sanitizer + `validateCisternRooms` |
| `tools/cistern-smoke.mjs` | 40-check CDP smoke: locked/unlocked level select, live gate chain, secret wall, boss victory, reload, 390×844 |
| `src/cutscene.js` | 20-second final-boss portrait and 30-second post-credit epilogue timelines plus procedural `drawCutscene` art |
| `src/speedrun.js` | Speedrun rules, 2×+ multiplier ladder, record/history sanitizer, deeper stats/ladder and substep budget for the one-life challenge mode |
| `src/fishing.js` | Fishing data and rules: 9 baits, 25 fish, exact catch odds, reel windows, bait-shack economy, save sanitizer, index rows and procedural fish art |
| `styles-fishing.css` | Fishing hub, bait shack, reel overlay, fish index and Speedrun deep-stats styles with phone/tablet/landscape fallbacks |
| `src/map.js` | Map model (fog, adjacency, pins, stats, 14-node layout) + `MapView` canvas renderer |
| `src/prologue.js` | 12-beat, 60-second prologue timeline plus procedural cutscene art (`drawPrologue`) |
| `src/main.js` | Menus, character customization, prologue playback, progress, settings UI, music sync, map/shop/codex/dialogue UI, fixed-step loop, input, HUD, debug hooks |
| `tests/core.test.js` | 65 deterministic Node tests |
| `tests/expansion.test.js` | 10 tests for expansion data counts, room/boss lookups, unlocks, save migration, quests, events, haven bonuses, modifiers, collectibles |
| `tests/foundations.test.js` | 15 tests for settings, bindings, persistence, gamepad, map fog/pins/stats, zones, music safety |
| `src/fallen.js` | Arc II data and pure rules: 11 regions, 59 rooms, 32 enemies, 15 bosses, abilities, Echoes, endings, upgrades, mechanics, progress sanitizer/API |
| `src/crusade.js` | Arc III data and pure rules: 5 levels, 20 rooms, 21 enemies, 5 bosses, banners, Valor Chain, upgrades, `progress.crusade` sanitizer/API, Arc IV rift flag |
| `styles-fallen.css` | Heavenly second menu, arc hub tabs, ending screen, and in-run Radiance HUD |
| `tests/fallen.test.js` | 30 tests for The Fallen Ones, including real-core boss and enemy integration |
| `tools/fallen-smoke.mjs` | 39-check CDP smoke: second menu, hub, region run, boss kill, rewards, ending gating, persistence |
| `tests/fairy.test.js` | 12 tests for Faewood content, stage chain, boss seal, progress sanitizer, heaven/hell forms, cutscene timing and real core boss fights |
| `tests/speedrun.test.js` | 11 tests for speedrun multipliers, records, run history, deep stats/ladder, sanitizer, substep budget and core one-life behaviour |
| `tests/fishing.test.js` | 14 tests for bait tiers and prices, odds normalization, catch rolls, reel windows, starter grant, shop economy, catch records and the index |
| `tests/court.test.js` | 22 tests for Hearthfall content, rooms, bosses/phases, zone gates, weapons, house, tools, classes, NPC quests, save, pacing, loadout and simulation |
| `tests/cistern.test.js` | 15 tests: room/gate/secret structure, archetypes, boss data, progression/sanitizer, live boss and wall runs |
| `tools/render-probe.mjs` | Per-layer renderer timing in a real browser (`npm run probe:render`) |
| `tools/court-bench.mjs` | Measured room/resident lookup and house-bonus cache benchmark |
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
- Boot into `fallenMenu` when `progress.fallen.ascended` and `menuTheme !== 'base'`; `THE BELOW` and `showBaseMenu()` return to the original title. While `fallenEndingOpen`, the base victory screen is suppressed in favour of `#fallen-ending-screen`.
- Fallen runs set `activeRunKind = 'fallen'`, override player HP from `createFallenRun`, route `gatePass`/`bossDown`/`roomEnter`/`purityHit` in `drainEvents`, and tick Radiance/Judgment/Shadow per fixed step via `tickFallen`.

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

Current result: **322/322 passing** across the legacy, expansion, Atlas, Overdrive, Hearthfall, Skill Point, Faewood, speedrun, fishing, Fallen Ones, labyrinth/co-op and update-log suites. Coverage includes:

- **The Fallen Ones: 39 contiguous rooms and a valid gate graph; 17 enemies on the six engine archetypes; 11 bosses with 2–3 phases and intro/phase/defeat dialogue; region and boss unlock chaining; sanitizer repairs (out-of-order halls, phantom bosses, unearned abilities, capped echoes, forged Eclipse); Echoes derivation from base progress; Shards of Halo upgrades and weapons; Radiance/Burst, Judgment, Shadow and Purity formulas; deterministic boon rolls; a real `AshenGame` boss fight proving the Purity Shield absorbs raw damage and breaks.**

- **court: 60 rooms / 24 enemies / 12 bosses (3–4 phases) / 8 weapons / 12 tools / 13 selectable classes / 6 house rooms / 24 furnishings / 8 NPCs**;
- **stage timing: `progress.stageTimes` records best/last/clear count per stage; live clock and timer in the top-right; inventory shows loadout and active keybinds; graphics settings control AA, FOV, render distance, particle density, and quality bias**;
- **court pacing: cheapest tool within four rooms, cheapest weapon within six, and a full clear funds every weapon/tool without buying the whole house**;
- **court phase IV transition and the three court-native abilities (`cinder_rush`, `warmth_ward`, `mirror_lance`)**;
- **court boss phases, dialogue, zones, music, weapon combos/projectiles/lifesteal/shockwave, house bonuses and cache, tools by slot, NPC gifts/quests, save sanitization, and a live room-clear simulation**;
- **Faewood: 10 stages + 2 boss arenas at rooms 414–425, the stage chain arrives in order, and both bosses stay sealed until all ten stages are cleared**;
- **fairy mobs cover tiny swarmers, one elite (Myconid Guard) and a spawner (Elder Spore); every stage can spawn its own roster**;
- **both fairy bosses have descending phase thresholds, full intro/phase/defeat dialogue and their own music ids**;
- **the spectral dragon rewrites name/title/colour and swaps `game.arenaTheme` to heaven at phase 3 and hell at phase 4, then ends the run with `victory`**;
- **`progress.fairy` sanitizes impossible states while keeping valid clears, and the summary reports stages, bosses, runs, best time and completion percent**;
- **the boss portrait runs 20 s and the post-credit epilogue 30 s, both built from beats that sum to the declared duration**;
- **faewood registers a zone entry plus `faewood`, `magmaBoss`, `fairyBoss` and `celebration` tracks, and `MusicManager` stays safe without an AudioContext**;
- **Speedrun starts at 2× and climbs one step per cleared cycle, and a death ends the run with the highest multiplier reached stored as the record**;
- **one life disables `respawnAtCheckpoint()` and makes pit falls lethal in core, while the same pit stays survivable outside the mode**;
- **the speedrun substep budget grows with the multiplier but stays capped, so the 120 Hz simulation keeps its determinism at high speed**;
- **speedrun history keeps the newest ten attempts first, clamps junk entries, drops non-objects, and survives a save round-trip**;
- **speedrun deep stats group the ladder by multiplier, report clear rate/averages and ignore corrupt history**;
- **nine baits cost 25/50/100 coins, every bait's fish odds and every bait column in the index total exactly 100, and better bait measurably raises the tier-4/5 share**;
- **a fresh fisherman starts with 10 worms and 250 coins, the starter grant never refills spent worms, and buying refuses unaffordable or unknown baits without touching the wallet**;
- **casting spends exactly one bait, a centred strike lands and pays the fish value, a wild strike escapes but still consumes the bait, and the index marks only caught species**;

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

### v0.12.0 fishing + gadget verification

- `npm run smoke:fishing` (**84 checks**): starts with 10 worms/250 coins, nine-bait rack, wooden shack with 25/50/100 shelves, buying one cricket/2 glowworms, refused unaffordable purchase, bait selection, real cast → reel overlay, centred strike catch (coins + index + save), wild strike escape (bait spent), illustrated index (25 painted canvases, 6 tabs, 9 odds per fish, mythic filter), reload persistence, no console errors.
- `npm run audit:gadgets` (**207 checks / 10 viewports**): title, Speedrun hub, fishing hub, bait shack and fish index at 320×568, 360×640, 390×844, 414×896, 844×390, 768×1024, 1024×768, 1366×768, 1440×900 and 1920×1080 — no horizontal overflow, no off-screen screen-links buttons, ≥20 fps menu/run pacing on phone and desktop.
- `npm run smoke:speedrun` (**55**) and `npm run smoke:speedrun:mobile` (**54**) still pass with the new deep-stats panel; Faewood smokes (**57** / **44**) unchanged.

## 8. Debug hooks

`window.__ashen` exists for smoke tests:

- Getters: `game`, `renderer`, `started`, `paused`, `spectating`, `menuView`, `progress`, `expansion`, `atlas`, `labyrinth`, `court`, `settings`, `musicTrack`, `audioState`, `mapData`, `shopOpen`, `mapOpen`, `codexOpen`, `dialogueOpen`, `prologueActive`, `prologueIndex`, `prologueBeat`, `prologueVoice`, `character`, `fallen`.
- Fallen: `showFallenMenu`, `showFallen`, `buildFallenMenu`, `buildFallenScreen`, `startFallenRegion`, `startFallenBoss`, `fallenBurst`, `fallenShadow`, `fallenCleanse`, `chooseFallenEnding`, `ascendNow`, `ascendIfEligible`, `buyFallenUpgrade`, `addFallenShards`.
- Hearthfall: `showCourt`, `closeCourt`, `buildCourtScreen`, `startCourtRoom`, `startCourtTrial`, `courtAction(action, data)`.
- Navigation: `start`, `restart`, `retry`, `showMenu`, `showLevels`, `showExpansion`, `showCredits`, `showSettings`, `closeSettings`, `showCharacter`, `closeCharacter`, `enterRoom`, `clearProgress`.
- Expansion: `buildExpansionScreen`, `startExpansionLevel`, `startExpansionMode`, `startExpansionTrial`, `claimQuest`, `buyHavenUpgrade`, `equipSkin`, `claimEventMission`, `claimEventTier`, `buyEventShop`.
- Settings: `buildSettings`, `applySettings`.
- Character/prologue: `buildCharacterScreen`, `setCharacter`, `setCharacterField`, `saveCharacter`, `beginJourney`, `startPrologue`, `advancePrologue`, `finishPrologue`, `togglePrologueVoice`.
- Overlays: `openMap`, `closeMap`, `toggleMap`, `openCodex`, `closeCodex`, `advanceDialogue`.
- Spectate: `startSpectate`, `stopSpectate`.
- Fishing: `fishing` (getter: state, summary, index, shop, reel, tab), `showFishing`, `closeFishing`, `openBaitShop`, `openFishIndex`, `buyBait`, `selectFishingBait`, `beginFishingCast`, `strikeFishingReel`, `setFishIndexTab`.
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
- Music and SFX are procedural only; there are no recorded music files. Tracks are short patterns, so long sessions may notice looping. Voice lines (prologue, boss dialogue, trailer) use ElevenLabs through `/api/voice` when `ELEVENLABS_API_KEY` is set, then the browser's speech synthesis, then subtitles only; subtitles always carry the story.
- 2D art is procedural; there is no sprite/tileset pipeline. 3D uses script-generated GLBs; 12 environment packs are still unbuilt (see `docs/asset-inventory.md`).
- All five configured zones now have playable rooms: Tidewrought Cistern became playable in v0.35.0 (BAB IX, rooms 662–668), and BAB X The Lanternwake follows at rooms 669–673.
- Infinite Frontiers levels 101–200 and Overdrive levels 201–300 are data only (not in `ALL_ROOMS`); Arc IV The Rift and Arc VI's Unwritten Expanse are locked teasers. Master Plan 3.0 Phases 2 and 4 schedule them.
- No fast travel or save slots yet (Master Plan 3.0 Phases 6 and 1). Several arcs already have multiple endings (Atlas, Fallen), and an in-engine 80-second trailer exists (`src/trailer.js`).
- Boss tuning lives in constants inside `src/core.js`; the data tables (`BOSS_INFO`, `ENEMY_INFO`, `CODEX`) are the extension point.
- Enemy AI is platform-aware but not a full navmesh; complex multi-level layouts may still need hand-tuned jumps.
- Codex screens are informational; no unlock tracking or per-entry discovery gating yet.
- Fishing is a single lake with fixed species data: no weather, season or time-of-day modifiers yet, and the pond art is CSS rather than a simulated body of water.
- Bait stock and coins are local save data; there is no server-authoritative fishing economy.

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
21. Fishing odds must stay normalized: every bait's tier split and every bait column in the index must total exactly 100.0 (largest-remainder rounding), and `tests/fishing.test.js` must prove it.
22. The ten-worm starter grant is one-shot (`starter: true`); sanitizers must never refill consumed bait.
