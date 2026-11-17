# Ashen Vow — Claude Master Plan

> Compressed handoff for continuing **Ashen Vow v0.15.0**.
> Status: **playable, browser-verified; Milestones A and B plus Sigil & Ritual, Echoes of the Forgotten World, Infinite Frontiers, Overdrive, The Sundered Atlas, Infinite Labyrinth co-op, Hearthfall (The Hollow Court), Skill Points + Panggung Abadi, Taman Peri (Faewood), Speedrun (one life, escalating game speed), and Pondok Umpan (fishing, bait shack, illustrated index) complete**.
> Roadmap: [`MASTERPLAN.md`](MASTERPLAN.md).
> Repo: `https://github.com/FahmiGF/Ashen-Vow-` · branch `main` · push account `isshinAshinaSeal`.

## 0.0 v0.15.0 — The Fivefold Trials & Puzzle Adventure

- `src/trials.js` — pure biome-combat expansion for all 20 labyrinth biomes: 100 standard levels generated from a data-driven 20-enemy / 4-archetype / 1-elite template (19 normal + 1 guaranteed elite), four 5-enemy waves, per-biome bosses, one-shot boss rewards, arena builder and boss overrides, and `progress.trials` with a sanitizer that rejects out-of-order clears and forged bosses.
- `src/puzzle.js` — pure Puzzle Adventure framework: 23 puzzle categories over 8 real engines (path, pipes, image, sequence, beam, gear, toggle, swap), deterministic generation from a known solution, automatic solvability validation, an editor publish gate, a co-op snapshot codec, 10 Arc 1 stages, 10 Metroidvania abilities, five puzzle bosses, and `progress.puzzle`.
- UI: **THE FIVEFOLD TRIALS** hub (20 biome cards, five levels each plus a gated boss arena) and **PUZZLE ADVENTURE — THE LOST MECHANISM** hub with an interactive board for every engine. Trial levels run through `game.loadArena` + `spawnEnemy`; puzzle stages are solved on the DOM board.
- Tests: `tests/trials.test.js` + `tests/puzzle.test.js`; browser smoke `npm run smoke:fivefold`.

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
| `src/zones.js` | Legacy `ZONES` + 10 biome zones + 5 court zones, `ROOM_ZONES` (14 legacy entries), and `zoneForRoom` / `zoneMusicForRoom` |
| `src/court.js` | Hearthfall: 6 zones / 60 court rooms, 24 enemies, 12 bosses (3–4 phases), 8 weapons + profiles, 12 tools, 6 house rooms, 24 furnishings, 8 NPC residents, `progress.court` save logic |
| `src/fairy.js` | Faewood finale: 10 sequential stages + 2 boss arenas at rooms 414–425, 10 enemies, 4 tiny NPCs, 2 four-phase bosses, dragon heaven/hell forms, `progress.fairy` |
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
- Audio is procedural only; no recorded music or voice files. Tracks are short patterns, so long sessions may notice looping. Prologue narration depends on browser speech-synthesis voices, but subtitles always carry the story.
- Art is procedural; no sprite/tileset pipeline.
- Only four of the five configured zones have playable rooms; Tidewrought Cistern exists only as configuration until Milestone C.
- No fast travel, trailer, branching story, or multiple endings yet (Milestones D–E).
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
