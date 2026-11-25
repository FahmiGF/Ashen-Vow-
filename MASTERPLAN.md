# ASHEN VOW — MASTER PLAN 3.0

> **Road to v1.0: every mode finished, deeper, and faster.**
> Status 25 November 2026: **v0.39.0** shipped Phase 1 (*Lighter Ash*); see the Phase 1 status note in §4. Written 24 November 2026 against the live tree at **v0.36.0**. v0.36.0 ships Updates XXV and XXVI, which had sat unreleased on top of v0.35.0 (Tidewrought Cistern). XXV covers ElevenLabs voice, the in-engine trailer, ghost GLBs, the Vigil Tree and the startup guard. XXVI covers BAB X The Lanternwake and the asset inventory. Phase 0 of this plan is that release.
> Live engine totals: **674 rooms** in `ALL_ROOMS`, **116 bosses**, **262 enemy types**, **18 playable classes** (+15 Frontier 3D classes), **776/776** Node tests.
> The previous plan (Master Plan 2.0: Milestones A–F, Parts I–III, Appendices A–F) is kept unchanged at [`docs/archive/MASTERPLAN-2.0.md`](docs/archive/MASTERPLAN-2.0.md). It stays the idea bank for systems this plan does not schedule yet, such as the Wonderland, Alien Mode, the War Update and Prestige.

---

## Document map

| § | Section | What it answers |
|---|---|---|
| 1 | Guiding rules | The rules every phase must keep |
| 2 | Where the game stands | Every mode, its room range and whether it is really playable |
| 3 | Roadmap at a glance | Phases 0–7, version numbers, exit criteria |
| 4 | Phase details | Scope, files touched and acceptance checks for each phase |
| 5 | Per-mode content plan | More levels, bosses and features for **every** mode |
| 6 | New boss roster | All 82 planned bosses with phases and their new attack machines |
| 7 | Enemy AI expansion | 7 behaviours → 16 |
| 8 | Systems and features | Save slots, menu hubs, fast travel, localization, accessibility and more |
| 9 | Optimization plan | Measured baselines, budgets, and how each one is checked |
| 10 | Room-id and save-key ledger | Where new content goes without renumbering anything |
| 11 | Verification gates | What "done" means for each phase |
| 12 | Risks and cut lines | What to drop first if a phase runs long |

---

## 1. Guiding rules

These carry over from Master Plan 2.0 and CLAUDE.md §10. Rules 9–12 are new.

1. **Ship every phase.** Each version leaves the game playable. No phase depends on a later one to be fun.
2. **Real systems only.** No placeholder buttons, fake progression or invented verification numbers. A locked teaser is allowed only when the content behind it is on this roadmap.
3. **Preserve saves.** Every schema change ships a migration, a sanitizer and a test. Room ids 0–673 are never renumbered.
4. **Data-driven content.** Rooms, bosses, enemies, shop items and codex entries live in exported tables. New content must not touch the renderer, audio engine or map renderer.
5. **Pure simulation.** `src/core.js` and every `*_data.js` / chapter module stay free of DOM and audio access. Every mechanic gets a deterministic Node test.
6. **Green before commit.** Run `npm test` and the touched mode's `smoke:*` script before every commit, on desktop and on a 390×844 portrait viewport.
7. **Metroidvania first.** Side modes extend the oath-and-ash identity. They never replace it.
8. **No pay-to-win.** Cosmetics are visual only, and every gameplay system is earned in game.
9. **Measure, then optimize.** Performance claims cite a probe (`profile:frames`, `probe:render`, `bench:sim`, `bench:3d`) with before/after numbers in the same session. Failed experiments are written down, as v0.34–v0.35 did, so nobody repeats them.
10. **New content gets new behaviour.** A new boss can share the boss core (hitboxes, phase controller). It cannot reuse another boss's whole attack machine the way Orsella reuses Vasska's. A new enemy must use one of the 16 behaviours in §7, and every chapter needs at least one behaviour the previous chapter did not have.
11. **Docs stay true.** Every release updates `package.json`, `GAME_VERSION`, the Update Log, CLAUDE.md §0 and this file's §2 table in the same commit. Unversioned "follow-up" updates are not allowed any more: a working-tree update ships as a patch version.
12. **One door per mode.** New modes and arcs go into one of the menu hubs in §8.2. The top-level main menu never grows past 8 entries again.

---

## 2. Where the game stands (24 Nov 2026, v0.36.0)

State legend: **Playable** means it has real rooms, combat and saves. **Partial** means some content is playable and the rest is data. **Data** means tables exist but nothing is playable. **Teaser** means a locked card with nothing behind it.

### 2.1 Campaign and arcs

| Content | Rooms (`ALL_ROOMS`) | Bosses | State | Main gap |
|---|---|---|---|---|
| Base campaign | 0–13 | 6 | Playable | — |
| Echoes of the Forgotten World | 14–113 | 30 (10 major + 20 mini) | Playable | Enemies are 100 types on 7 behaviours |
| The Sundered Atlas | 114–353 | 16 | Playable | — |
| Hearthfall: The Hollow Court | 354–413 | 12 | Playable | — |
| Taman Peri / Faewood | 414–425 | 2 | Playable | — |
| Arc II The Fallen Ones | 426–484 | 15 | Playable | — |
| Arc III The Radiant Crusade | 485–504 | 5 | Playable | Ends on the locked **The Rift** teaser |
| Arc VI The Astral Dominion | 505–524 | 5 | Playable | Ends on the locked **Unwritten Expanse** teaser |
| Arc VIII Eclipse + Godfall | 525–661 | 7 + Godfall floors | Playable | — |
| BAB IX Tidewrought Cistern | 662–668 | 1 (Vasska, 3 phases) | Playable (v0.35.0) | — |
| BAB X The Lanternwake | 669–673 | 1 (Orsella, 4 phases) | Playable (v0.36.0) | Orsella runs Vasska's tide-regent machine |
| Infinite Frontiers Lv 101–200 | none | 10 named | **Data** | Not in `ALL_ROOMS`. `FRONTIER_ROOM_START = 114` collides with Atlas |
| Overdrive Lv 201–300 | none | 10 named + 6 background | **Data** | `OVERDRIVE_LEVEL_SPECS` exist, no rooms |
| Arc IV The Rift | none | 0 | **Teaser** | Nothing behind the card |
| Arc V, Arc VII | none | 0 | Unused numbers | — |
| Unwritten Expanse (Arc VI epilogue) | none | 0 | **Teaser** | Nothing behind the card |

### 2.2 Scary Mode line

| Layer | State | Notes |
|---|---|---|
| Nightmare Protocol (v0.22) | Playable | 8 ghosts, 17 jumpscares, journal, anti-jumpscare |
| Vigil Tree | Playable (v0.36.0) | 3 branches, 9 nodes, 21 ranks |
| Hunter's Kit (v0.30) | Playable | 5 tools |
| The Dread Beyond (v0.23) | Playable | 5 environments, 3 bosses |
| Arc IX Veil (v0.24) | Playable | 30 stages, 7 bosses |
| Arc X Eternal Night (v0.25–27) | Playable | 40 stages (9600–9639), 9 bosses, 80 Ghost Index entities |
| Stage Archive (v0.26) | Playable | 65+ stages catalogued |
| 3D Blackveil Nightfall (v0.28) | Playable | 5 sites, 15 phases. Its hunters cannot be killed, so it has no boss |

### 2.3 Standalone modes

3D Mode (15 areas, 6 bosses) · Infinite Labyrinth (20 zones, 30 bosses) · Co-op 2–4 (relay) · Fivefold Trials (100 levels, 20 bosses) · Puzzle Adventure (100 stages, 10 bosses) · Riftwar MOBA (28 heroes, 3 maps) · Wave Defense (4 maps, 24 waves + endless) · Pirate Tide (10 routes + endless) · Infinite Realms (6 modes) · Panggung Abadi (6 bosses) · Speedrun · Pondok Umpan (25 fish) · Trailer · Credits & Secrets · Admin. All are playable. Their gaps are depth, not existence.

### 2.4 Engineering baseline (measured or counted from the repo)

| Item | Now |
|---|---|
| `src/main.js` | **799 KB, 19,227 lines**, 57 static `import` statements, **0 dynamic `import()`** |
| JS parsed before the menu | ≈ **3.8 MB** across 71 modules. Every mode loads at boot |
| Stylesheets | **15 render-blocking `<link>`s** (`styles.css` alone is 168 KB) |
| `src/updates.js` | 114 KB of release text loaded at boot |
| GLB kit | 16 files, 4,819.8 KB, 58,802 triangles |
| Campaign frame (headless Chrome, software raster, 1280×900) | canvas 13.8 ms, of which `drawBackground` is 8.9 ms. p95 ≈ 7.1 ms |
| Sim throughput (`bench:sim`) | 10,689–18,095 steps/s |
| Save keys | 13 localStorage keys, one profile, no slots, no export |
| Enemy behaviours | 7 (`chaser`, `ranged`, `lunge`, `slam`, `burrower`, `hover`, `spawner`) |
| Release gates never measured | low/medium/high hardware profiles, 30-min memory soak, co-op network load |

---

## 3. Roadmap at a glance

| Phase | Versions | Name | Theme | Exit criterion |
|---|---|---|---|---|
| **0** | v0.36.0 | *Ledger of Ash* | Ship the unreleased work and make the docs true | Update Log, CLAUDE.md, README and this plan agree on the version and totals |
| **1** | v0.37 – v0.39 | *Lighter Ash* | Optimization and foundations | Boot JS ≤ 900 KB, menu ≤ 8 entries, 3 save slots |
| **2** | v0.40 – v0.42 | *The Unfinished Roads* | Frontiers 101–200 and Overdrive 201–300 playable | +200 rooms, +20 bosses, both modes leave **Data** state |
| **3** | v0.43 – v0.45 | *Living Ash* | Enemy AI 7 → 16, a unique machine for every boss | No two bosses share an attack machine |
| **4** | v0.46 – v0.48 | *Through the Rift* | Arc IV The Rift, Unwritten Expanse, Arc V | No teaser card left without content |
| **5** | v0.49 – v0.53 | *Every Door Opened* | Per-mode expansions (§5) | Every standalone mode gains at least one level pack and one boss |
| **6** | v0.54 – v0.57 | *The Last Vow* | Arc VII, BAB XI–XII, finale Arc XII, true ending | One story ending that ties all the arcs together |
| **7** | v0.58 → **v1.0.0** | *Oath Kept* | Localization, accessibility, release gates, polish | All §11 gates green on 3 hardware profiles |

**Totals at v1.0:** **980 rooms** in `ALL_ROOMS` (+306, up to 1,000 with the reserved arc-pack block), **198 bosses** (+82), **16 enemy behaviours** (+9), and about **300 enemy types** (+38 bespoke bodies, not reskins).

**Dependency order:** Phase 0 → Phase 1 → (Phases 2 and 3 can run in parallel) → Phase 4 → Phase 5 → Phase 6 → Phase 7. Phase 1 comes first because adding 300 rooms on top of a 19k-line `main.js` and a 3.8 MB boot would make every later phase slower to build and slower to load.

---

## 4. Phase details

### Phase 0 — v0.36.0 *Ledger of Ash* (ship and tell the truth)

**Scope**
- Commit the working-tree Updates XXV and XXVI as **v0.36.0**: ElevenLabs voice and `/api/voice`, the 16-shot trailer, the 8 ghost GLBs and 9 mode props, the Vigil Tree, the startup guard (BOOT-01…04), BAB X The Lanternwake and `docs/asset-inventory.md`.
- Add an Update Log entry for v0.36.0 to `src/updates.js` and bump `GAME_VERSION` and `package.json` to `0.36.0`. In `tests/updates.test.js`, change the Cistern test to look up `0.35.0` by version instead of `LATEST_UPDATE`, and add a v0.36.0 test.
- Add a **docs-truth test** (`tests/docs.test.js`) that fails when `package.json.version`, `GAME_VERSION`, the first heading of CLAUDE.md §0 and the version in this plan's header disagree. It also asserts that `ALL_ROOMS.length` matches the room total stated in CLAUDE.md.
- Fix the stale facts in CLAUDE.md: Cistern is not "configuration only", the trailer exists, narration can use ElevenLabs, there are 18 classes rather than 10, and GLB assets exist.
- Archive Master Plan 2.0 at `docs/archive/MASTERPLAN-2.0.md` (done in the same change as this plan).

**Acceptance:** `npm test` green; `smoke:lanternwake`, `smoke:trailer` and `smoke:scary2` green; the Update Log screen shows v0.36.0 first.

### Phase 1 — v0.37 – v0.39 *Lighter Ash* (optimization and foundations)

> **Status (v0.39.0, 25 Nov 2026):** shipped as one release. Done: the lag fix (per-frame canvas filter removed; opaque canvas; native-size layer blits), 11 lazy mode screens with stylesheets, `src/version.js`, `src/save.js` with 3 slots, export/import, debounced writes and legacy migration, the 7-hub menu, `tools/boot-probe.mjs`, `tests/budget.test.js`, `tests/save.test.js`. Measured boot JS 3.57 → **2.83 MB**. Not done: the ≤ 900 KB boot budget (blocked by `core.js` importing all arc data — moved to Phase 3), `main.js` ≤ 60 KB (693 KB now), stylesheets 11 → 1 render-blocking, the `drawBackground` render pass, and the first release-gate baseline.

**v0.37.0 — Split and lazy-load**
- Split `src/main.js` into `src/ui/` modules by screen: `boot.js`, `menu.js`, `hud.js`, `level_select.js`, `settings_ui.js`, `codex_ui.js`, `map_ui.js`, `debug_hooks.js`, plus one `src/modes/<mode>_ui.js` per mode. Target: no file over 120 KB, and `main.js` ≤ 60 KB as a router.
- Every mode is loaded with `import()` on first entry. Boot loads only core, render, audio, menu, settings and the save layer. The other modes are not loaded until the player opens them.
- `updates.js` becomes `updates_data.js`, loaded when the Update Log opens. `GAME_VERSION` moves to `src/version.js`.
- Mode stylesheets load with the mode (a `<link>` injected by the mode loader). Only `styles.css` blocks render.
- `window.__ashen` keeps its full surface: `debug_hooks.js` installs lazy getters that `await` the mode module, so the CDP smoke scripts keep working.

**v0.38.0 — Save slots and the save layer**
- New `src/save.js` owns **every** localStorage key. 3 profile slots plus 1 auto-backup. Key scheme: `ashen-vow-slot<N>-<area>-v1`; the existing keys migrate to slot 1 on first boot, and the old keys are kept read-only for one release.
- **Export / import**: one JSON file per slot (versioned, checksummed, passed through every sanitizer on import).
- Debounced writes (at most 1 per 2 s per key, flushed on `visibilitychange`/`pagehide`) in place of the 15 direct `localStorage.setItem` calls in `main.js`.
- Optional **cloud save** through `server.js` (`/api/save`, local-account token) is designed here but built in Phase 7.

**v0.39.0 — Menu hubs and the render budget pass**
- Main menu reduced from ~35 entries to **7**: *Lanjutkan* · *Kampanye* · *Arc & Ekspansi* · *Scary Mode* · *Mode Arena* · *Arsip* · *Pengaturan* (layout in §8.2).
- Render pass on the measured hot spots: `drawBackground` (8.9 of 13.8 ms) gets the same treatment that worked for Cistern (cached gradients, native-size glow blits, ring-only particles) in every room type. Sprite-tile caching stays banned: it was measured slower twice, in v0.34 and v0.35.
- First run of the three missing release gates (§9.4) to record a baseline.

### Phase 2 — v0.40 – v0.42 *The Unfinished Roads*

**v0.40.0 — Frontiers playable, Lv 101–150 (rooms 674–723)**
- New constant `FRONTIER_GLOBAL_START = 674`; `FRONTIER_ROOM_START = 114` is renamed `FRONTIER_LEVEL_OFFSET` because it is a level-number offset, not a room id. Builds `FRONTIER_ROOMS` from `FRONTIER_LEVEL_SPECS` and appends them to `ALL_ROOMS`.
- Chapters 11–15: Benua Hancur, Kekaisaran Terlupakan, Kerajaan Palung Laut, Gurun Abadi, Raksasa Hijau. Bosses: The Skybreaker, Emperor Solvar, The Primordial Leviathan, Zarakh the Sandbound Sovereign, Elder Yggvar (shares lore and model with the 3D Mode boss, but gets a 2D move set of its own).
- The 15 Frontier elite mobs (ranks E1–E7) become real spawns with their 10 modifiers. Mounts and companions are cut from the 2D build (they move to 3D Mode in Phase 5).

**v0.41.0 — Frontiers Lv 151–200 (rooms 724–773)**
- Chapters 16–20: Garis Batas Astral, Dimensi Rongga, Mesin Surgawi, Tanah Purba, Batas Terakhir. Bosses: The Astral Devourer, The Architect of Nothing, Chronos the Eternal Mechanism, Gorath the First Colossus, **Aethron, the Origin Beyond** (5 phases).
- Kingdom Defense (10 towers) is folded into Wave Defense as a fifth map (§5) instead of living as a separate data mode.

**v0.42.0 — Overdrive playable, Lv 201–300 (rooms 774–873)**
- Builds `OVERDRIVE_ROOMS` from `OVERDRIVE_LEVEL_SPECS`: 10 chapters × 10 levels, with the boss seat on level 10 of each chapter.
- Chapter bosses: The Sunken Emperor, The Prism Devourer, The Forge Titan, The Mother of Thorns, The Starbound Regent, The Pale Frost Monarch, The Grand Horologist, The Unmade, The Sandstorm Sovereign, **The First God** (5 phases).
- The 8 spell schools (32 spells) become a real spell slot next to the weapon (`Q` to cast, mana regenerates from hits). The 8 legendary weapons drop from chapter bosses. The 6 special level types (Endless Dungeon, Colossus Trial, Time Trial, Treasure Vault, Cursed Expedition, Gauntlet Tower) become playable level variants.
- The 6 *background bosses* (World Colossus, Roaming Nemesis, Sky Behemoth, Abyssal Creature, Ancient Guardian, Rival Champion) become roaming encounters that can appear in any Overdrive level after chapter 3.
- Of the 12 Overdrive mode specs, 4 ship (World Boss Hunt, Endless Descent, Colossus Arena, Spell Mastery). The rest are marked "folded into Infinite Realms / Labyrinth" in data, so the game no longer advertises them.

### Phase 3 — v0.43 – v0.45 *Living Ash*
- v0.43.0: behaviours 8–12 from §7 in `src/ai/behaviours.js` (pure), each with a Node test that drives the state machine. Echoes chapters are rebalanced so each one uses at least 3 behaviours.
- v0.44.0: behaviours 13–16. A **boss machine registry** (`src/boss_machines/`) gives every boss its own attack list. Orsella gets her own wick-and-flame machine (see §6). The Atlas guardians and Echoes mini-bosses that share "pattern families" get at least one signature move each.
- v0.45.0: **enemy readability pass**. Each behaviour gets a wind-up telegraph (colour flash plus sound cue) of at least 0.35 s on Normal, and the Codex shows the behaviour icon for each enemy.

### Phase 4 — v0.46 – v0.48 *Through the Rift*
- v0.46.0 **Arc IV — The Rift** (rooms 874–900). Opens from the Radiant Crusade's red crack. 5 regions × 5 rooms + 2 secret rooms: *Rift Mouth*, *Inverted Bastion*, *Sea of Glass Knives*, *Hollow Orchard of Echoes*, *The Seam*. New mechanic: **Fracture** — the room flips between two layouts every N seconds, and some platforms exist in only one layout. 6 bosses (§6).
- v0.47.0 **Unwritten Expanse** (rooms 901–915). Opens from the Astral Dominion's ending. Mechanic: **Ink** — the player writes 1 of 3 glyphs into the level before entering (bridge, wall, light). 3 bosses.
- v0.48.0 **Arc V — The Ashfall Accord** (rooms 916–935). A diplomatic war arc between the Crusade and the Fallen. 4 regions × 5 rooms, with a **faction choice** at room 920 that changes 2 of the 5 bosses. Uses the Valor Chain and Radiance meters together.

### Phase 5 — v0.49 – v0.53 *Every Door Opened*
Per-mode packs in §5, grouped by release:
- v0.49.0 Scary line (new Veil and Eternal stages, Blackveil sites 6–7, 3 new ghosts)
- v0.50.0 Arena modes (Labyrinth, Trials, Puzzle, Speedrun)
- v0.51.0 Strategy modes (Wave Defense, MOBA, Realms)
- v0.52.0 Sea and leisure (Pirate Tide Act III, Fishing 2.0)
- v0.53.0 3D Mode and Co-op

### Phase 6 — v0.54 – v0.57 *The Last Vow*
- v0.54.0 **BAB XI — Frostglass Cathedral** (rooms 956–961; this was Milestone D in Master Plan 2.0). Mechanic: frozen glass that cracks on the second landing. Boss: Ysolde, the Glass Abbess (3 phases).
- v0.55.0 **BAB XII — Cinder Maw** (rooms 962–967). Mechanic: a lava tide that rises on a timer, the inverse of the Cistern. Boss: Gharrow, Maw of Cinders (4 phases).
- v0.56.0 **Arc VII — The Hollow Meridian** (rooms 936–955). The arc that bridges the timelines: one arc visits a future version of each base room. 5 bosses.
- v0.57.0 **Arc XII — The Last Vow** (rooms 968–979), the finale. It needs Arcs II–VII, VIII and BAB X–XII cleared. 3 bosses, ending with **The Unbroken Oath** (6 phases, one per major arc). It has a **true ending** and an **Oath Ledger** epilogue screen listing which endings and arcs the player completed.

### Phase 7 — v0.58 → v1.0.0 *Oath Kept*
- Full localization (Indonesian and English for all gameplay text, not only settings) with a string table and a missing-key test.
- Accessibility: one-handed preset, hold-to-toggle for every hold input, colour-blind palettes for telegraphs, captions for all ghost audio cues, and a "no flashing" global switch.
- Cloud save (optional, `/api/save`) with conflict resolution by `updatedAt` plus a manual choice screen.
- Release gates in §11 on 3 hardware profiles, a 30-min soak, and a 4-player co-op load test.
- v1.0.0 credits keep the exact line "Made by SealiusHQ with a lot of support from Contributors".

---

## 5. Per-mode content plan

Every mode gets more levels, at least one new boss, and at least one feature. The "Phase" column shows the version.

### 5.1 Campaign and arcs

| Mode | More levels | New bosses | New features | Phase |
|---|---|---|---|---|
| Base campaign | +12 rooms (BAB XI–XII) | Ysolde, Gharrow | **Fast travel** between Warung Abu checkpoints; ash banking (25% of run ash kept on death) | 6 |
| Echoes | +10 *Echo Remix* levels (one per chapter: the same layout, mirrored, with new behaviours) | 0 new; 20 mini-bosses get signature moves | Chapter Mastery medals (no-hit, under par, all relics) | 3 |
| Sundered Atlas | +8 secret rooms (1 per zone, behind ability gates the player already has) | 1 secret boss: **The Cartographer** (4 phases) | Atlas map completion % and a 5th ending for 100% | 5 |
| Hearthfall | +6 rooms: the **Undercroft** of the house | **The Hearth Below** (3 phases) | Furnishing sets with set bonuses (cosmetic only); resident affinity level 6 | 5 |
| Faewood | +5 stages: **Moonlit Glade** night variant | **Nyx-Ilra, Moth Queen** (3 phases) | Fairy companion that follows the player and lights dark rooms | 5 |
| Arc II Fallen | +5 rooms in an optional **Choir Reprise** region | **The Eighth Voice** (4 phases) | New Game+ for the arc with remixed Purity Shields | 5 |
| Arc III Crusade | +5 rooms: *Siege Reversed* (defend the camp) | **Templar Marshal Kesh** (3 phases) | Banner loadout (equip 2 of 5 banners) | 5 |
| Arc VI Astral | +15 rooms (Unwritten Expanse) | 3 (§6) | Ink glyphs | 4 |
| Arc VIII Eclipse | Godfall floors 101–150 | **Godfall Warden** every 25 floors (2 new) | Weekly seeded Godfall modifier (local clock, like seasonal events) | 5 |
| BAB IX Cistern | +2 rooms: *Pump Heart* challenge | 0 | Tide timer challenge mode | 5 |
| BAB X Lanternwake | +2 rooms: *Ninth Wick* secret | **The Unlit** (2 phases, secret) | Light radius mechanic: wicks extend vision | 3 |
| Infinite Frontiers | **100 rooms** (Lv 101–200) | 10 | Elite ranks E1–E7 live | 2 |
| Overdrive | **100 rooms** (Lv 201–300) | 10 + 6 roaming | Spell slot, legendary weapons, 6 special level types | 2 |
| Arc IV The Rift | 27 rooms | 6 | Fracture | 4 |
| Arc V Ashfall Accord | 20 rooms | 5 (2 depend on faction) | Faction choice | 4 |
| Arc VII Hollow Meridian | 20 rooms | 5 | Future-room overlays | 6 |
| Arc XII The Last Vow | 12 rooms | 3 | True ending, Oath Ledger | 6 |

### 5.2 Scary Mode line

| Mode | More levels | New bosses | New features | Phase |
|---|---|---|---|---|
| Nightmare Protocol | 3 new ghosts (**The Bellringer's Child**, **Ash Widow**, **The Counting Man**) → 11 | — | Per-ghost "tell" tutorial cards in the journal | 5 |
| Vigil Tree | +1 branch (*Witness*: evidence and Ghost Index perks), 9 → 12 nodes, 21 → 30 ranks | — | Respec costs nothing in Story/Easy | 5 |
| Hunter's Kit | +3 tools (Iron Thread, Mirror Shard, Candle of Names) → 8 | — | Tool upgrade tier II for every tool | 5 |
| Dread Beyond | +2 environments (*Drowned School*, *Radio Tower*) → 7 | **The Static Saint** (3 phases) | Co-op Dread expedition (uses the Eternal expedition relay) | 5 |
| Arc IX Veil | +1 chapter, 5 stages → 35 | **The Veilwright's Echo** (4 phases) | Case replay with evidence timeline | 5 |
| Arc X Eternal Night | +1 chapter, 5 stages → 45 (rooms 9640–9644) | **The Last Lantern** (5 phases) | Ghost Index to 90 entities; Index Rank cap 100 → 120 | 5 |
| Stage Archive | Catalogues all new stages | — | Archive search and filter by ghost or tool | 5 |
| 3D Blackveil | +2 sites (**Saint Orra's Bell Tower**, **Blackwater Ferry**) → 7 sites / 21 phases | **The Keeper of Blackveil**, the first 3D horror entity that can be killed (3 phases) | Flashlight battery as a resource; hide-in-locker | 5 |

The 20-enemy horror contract (19 normal + 1 elite, 4 archetypes) stays in force for every new stage.

### 5.3 Standalone modes

| Mode | More levels | New bosses | New features | Phase |
|---|---|---|---|---|
| 3D Mode | +3 areas (Frontier mount plains, Overdrive Astral Citadel, Rift Mouth) → 18 | **Aethron's Shadow** (3D) | Mounts and companions from Frontier data become real in 3D | 5 |
| Infinite Labyrinth | +4 zones → 24 | +4 bosses → 34 | Daily seed (local clock) and a ghost replay of your best run | 5 |
| Co-op | Campaign arcs Fallen and Crusade join Campaign / Hearthfall / Labyrinth | — | Reconnect after drop; spectator slot; host migration | 5 |
| Fivefold Trials | +4 biomes, 20 levels → 120 | +4 biome bosses → 24 | Medal targets per level | 5 |
| Puzzle Adventure | +2 arcs, 20 stages → 120 | +2 puzzle bosses → 12 | Level editor for puzzle stages (reuses the map editor data model) | 5 |
| Riftwar MOBA | +1 map (**Glass Rift**) → 4 | +1 epic boss → 7 | +6 heroes → 34; bot difficulty tiers | 5 |
| Wave Defense | +2 maps (Kingdom Defense map from Frontiers, **Lanternwake Pass**) → 6 | +2 bosses → 8 | 10 Kingdom Defense towers merged into the 14 → 18 towers after dedupe | 5 |
| Pirate Tide | **Act III**: 5 routes → 15, 2 islands | +5 captains → 15; sea boss **The Drowned Crown** | Ship upgrades (hull, sails, cannons) bought with gold | 5 |
| Infinite Realms | +2 modes (Rift Hunt, Ink Duel) → 8 | — | Realm modifiers shared with Labyrinth | 5 |
| Panggung Abadi | +4 bosses → 10 | Encore versions of Vasska, Orsella, Aethron and The First God | Boss Rush ladder with time medals | 5 |
| Speedrun | +3 courses (Cistern, Lanternwake, Rift) | — | Split timer per room, ghost of personal best | 5 |
| Pondok Umpan | +2 lakes (Cistern sump, Faewood pond) → 3 | **Leviathan Kecil** gets a boss reel (3 phases) | Weather and time of day change the odds; the per-bait columns still sum to 100.0 | 5 |
| Trailer | Re-cut for v1.0 with new arcs | — | Chapter trailers per arc | 7 |
| Credits & Secrets | Credit scenes for the 6 new arcs/chapters | — | Hidden mode marks for every new mode → 40 | 6 |
| Admin | — | — | Save-slot inspector; per-slot audit | 1 |

---

## 6. New boss roster (82 bosses)

Every boss ships with `intro`, one `phaseN` per extra phase, and `defeat` dialogue. Each gets its **own machine** in `src/boss_machines/` (rule 10).

| # | Boss | Home | Phases | Signature machine |
|---|---|---|---|---|
| 1–10 | Skybreaker, Emperor Solvar, Primordial Leviathan, Zarakh, Elder Yggvar (2D), Astral Devourer, Architect of Nothing, Chronos, Gorath, **Aethron (5)** | Frontiers | 3–5 | Flight sweeps; flame thrones; sea surge; sand pyramids rising; root tethers; gravity well; room-geometry swap; clock-hand sweeps; ground-quake columns; first-flame cross |
| 11–20 | Sunken Emperor, Prism Devourer, Forge Titan, Mother of Thorns, Starbound Regent, Pale Frost Monarch, Grand Horologist, The Unmade, Sandstorm Sovereign, **The First God (5)** | Overdrive | 3–5 | Each counters one spell school; the First God cycles through all 8 |
| 21–26 | World Colossus, Roaming Nemesis, Sky Behemoth, Abyssal Creature, Ancient Guardian, Rival Champion | Overdrive (roaming) | 2–3 | Roam between rooms; the Rival copies the player's last 3 attacks |
| 27–32 | **Riftmaw** (3), **The Inverted Paladin** (3), **Glass Knife Saint** (3), **Echo-Mother** (4), **Seam Warden** (4), **The Rift Itself** (5) | Arc IV | 3–5 | Built on Fracture: attacks exist in only one layout |
| 33–35 | **Inkless Scribe** (3), **The Blank Choir** (3), **The Unwritten** (5) | Unwritten Expanse | 3–5 | Erase the player's glyphs; write hazards |
| 36–40 | **Accord Herald** (3), **Ser Varga / Seraph Lune** (faction, 3), **Ash Diplomat** (3), **Twin Banners** (duo, 4), **The Treaty-Breaker** (5) | Arc V | 3–5 | Duo boss with a shared HP pool; faction-swapped move sets |
| 41–45 | **Meridian Clockmaid** (3), **Future Mordrake** (3), **Future Vhael** (4), **The Hollow Hour** (4), **Meridian Oathbreaker** (5) | Arc VII | 3–5 | Future versions of base bosses with new phases |
| 46–47 | **Ysolde, the Glass Abbess** (3), **Gharrow, Maw of Cinders** (4) | BAB XI–XII | 3–4 | Floor cracking; rising lava tide |
| 48–50 | **Ash Regent** (3), **The Last Warden** (4), **The Unbroken Oath** (6) | Arc XII | 3–6 | One phase per major arc's mechanic |
| 51 | **The Unlit** (2) | Lanternwake secret | 2 | Darkness: the boss is visible only inside wick light |
| 52–58 | Cartographer (4), Hearth Below (3), Nyx-Ilra (3), Eighth Voice (4), Templar Marshal Kesh (3), 2 Godfall Wardens (3) | Arc packs | 3–4 | — |
| 59–62 | Static Saint (3), Veilwright's Echo (4), The Last Lantern (5), Keeper of Blackveil (3) | Scary line | 3–5 | Sanity and evidence aware; anti-jumpscare respected |
| 63–82 | Aethron's Shadow (3D), 4 Labyrinth bosses, 4 Trials biome bosses, 2 Puzzle bosses, MOBA Glass Rift boss, 2 Wave Defense bosses, Drowned Crown + 5 Pirate captains | Standalone | 2–5 | Mode-native (for example, the Pirate bosses are ships) |

The Panggung Abadi encores and the Leviathan Kecil boss reel are not counted as new bosses: they reuse a machine on purpose. **Orsella** is not on the list because she already exists, but Phase 3 gives her a machine of her own: wick lances, a lantern-ring arena, and a phase-4 "all nine wicks" ultimate.

---

## 7. Enemy AI expansion (7 → 16 behaviours)

All behaviours live in `src/ai/behaviours.js` as pure state machines on top of the existing EnemyBrain (12 states) and NavGraph A*. Every behaviour has a Node test that steps it 600 ticks and checks its signature action.

| # | Behaviour | Status | Signature |
|---|---|---|---|
| 1 | chaser | exists | Close distance, melee |
| 2 | ranged | exists | Keep distance, fire |
| 3 | lunge | exists | Mark, then dash |
| 4 | slam | exists | Jump and ground slam |
| 5 | burrower | exists | Dig, then surface under the player |
| 6 | hover | exists | Fly and drift |
| 7 | spawner | exists | Summon children |
| 8 | **shielder** | new (v0.43) | Front shield; must be hit from behind or parried |
| 9 | **pack** | new (v0.43) | 3–5 share a target and flank from both sides |
| 10 | **sniper** | new (v0.43) | Long telegraph laser; breaks line of sight to cancel |
| 11 | **mimic** | new (v0.43) | Disguised as a chest or prop; ambushes |
| 12 | **support** | new (v0.43) | Heals or buffs nearby enemies (like Bone Herald in WD) |
| 13 | **teleporter** | new (v0.44) | Blinks behind the player after a visible sigil |
| 14 | **kamikaze** | new (v0.44) | Rushes in and explodes; can be knocked back |
| 15 | **trapper** | new (v0.44) | Lays hazards (webs, ink, ice) on the platforms |
| 16 | **phase-walker** | new (v0.44) | Exists in one Fracture layout; built for Arc IV |

**Budget:** AI update ≤ 0.6 ms for 40 enemies at 1/120 s (`bench:sim` gets a 40-enemy scenario). Pathfinding queries are capped at 4 per tick and share a cache per room.

---

## 8. Systems and features

### 8.1 Save slots, backup and cloud
Covered in Phase 1 (v0.38) and Phase 7. Slot cards show class, play time, furthest arc and the date of the last save. Deleting a slot asks to type the slot name and keeps a 24-hour undo backup.

### 8.2 Main menu hubs (35 → 7)

| Top level | Contains |
|---|---|
| **Lanjutkan** | Resume the last played mode (hidden on a new save) |
| **Kampanye** | Start Journey, Level Select, Choose Guardian, Difficulty, Map, Codex |
| **Arc & Ekspansi** | Echoes, Sundered Atlas, Hearthfall, Faewood, Fallen*, Crusade*, Astral, Eclipse, Frontiers, Overdrive, The Rift*, Unwritten*, Accord*, Meridian*, The Last Vow* (* hidden until unlocked, as today) |
| **Scary Mode** | Scary Mode, 3D Blackveil, Stage Archive, Vigil Tree, Hunter's Kit |
| **Mode Arena** | 3D Mode, Labyrinth, Trials, Puzzle, Riftwar, Wave Defense, Pirate Tide, Realms, Panggung Abadi, Speedrun, Pondok Umpan, Co-op |
| **Arsip** | Update Log, Trailer, Credits, Secrets, Stage Access (dev), Admin (hidden) |
| **Pengaturan** | Settings 2.0 |

Rules: a hub shows a "NEW" pip when it contains something unseen. Keyboard and gamepad focus returns to the last-used card. Boot still lands on the menu and never auto-starts gameplay.

### 8.3 Other features (scheduled)
- **Fast travel** between Warung Abu checkpoints in the base campaign and chapters (Phase 6).
- **Ash banking**: 25% of run ash is kept on death, so the rule "ash is run-scoped" becomes "mostly run-scoped" (Phase 6, behind a difficulty flag; off on Nightmare and Abyssal).
- **Codex discovery gating**: entries unlock on first sighting (Phase 3).
- **Sneak Peek touch pan** (Phase 1).
- **Per-action gamepad rebinding** (Phase 7).
- **Music variation**: every zone track gets an A/B section and a 4-bar variation so long sessions loop less (Phase 5).
- **Full localization** (Phase 7).

### 8.4 Not scheduled (kept in the Master Plan 2.0 archive)
Wonderland, Alien Mode, the War Update, Prestige ranks, the Advanced Map Editor 2.0, the player-facing Kingdom Rush tower campaign, paid cosmetics. They can enter a later plan after v1.0.

---

## 9. Optimization plan

### 9.1 Budgets

| Metric | Baseline (§2.4) | Target | Phase | Checked by |
|---|---|---|---|---|
| JS parsed before the menu is interactive | ≈ 3.8 MB | **≤ 900 KB** | 1 | New `tools/boot-probe.mjs`: sums `transferSize` of scripts loaded before `__ashenBootReady` |
| Largest single JS file | 799 KB (`main.js`) | **≤ 120 KB** (`core.js` exempt until Phase 3, then ≤ 180 KB) | 1, 3 | `tests/budget.test.js` (fails on regressions) |
| Render-blocking stylesheets | 15 | **1** | 1 | `boot-probe` |
| Time to menu (cold, local server) | not measured | **≤ 1.2 s** desktop, ≤ 2.5 s on the low profile | 1 | `boot-probe` |
| Campaign canvas frame (software raster) | 13.8 ms | **≤ 8 ms**, `drawBackground` ≤ 4 ms | 1 | `profile:frames`, `probe:render` |
| Per-frame gradient allocations | 0 in Cistern, unknown elsewhere | **0 in every room type** | 1 | `probe:render` counter |
| p95 frame, heaviest mode (Godfall / MOBA) | not measured | ≤ 12 ms, no long animation frames over 50 ms in a 60 s run | 1 | `profile:frames` |
| Sim throughput | 10.7k–18.1k steps/s | **≥ 20k steps/s** with 40 enemies | 3 | `bench:sim` |
| 30-min memory soak | not measured | heap growth ≤ 10%, no detached canvases | 1, 7 | New `tools/soak.mjs` (CDP heap snapshots at 0/15/30 min) |
| GLB kit | 4,819.8 KB | **≤ 3.5 MB** via quantized positions/normals in `export-glb.mjs` (no new dependency) | 5 | `assets:inventory` reports size |
| 3D frame (`bench:3d`) | — | ≤ 16.7 ms on the medium profile with 3 LODs | 5 | `bench:3d` |
| Save writes | 15 direct writes | ≤ 1 write per 2 s per key, flushed on `pagehide` | 1 | `tests/save.test.js` |
| Co-op relay | not measured | 4 players at 20 Hz snapshots ≤ 40 KB/s per client | 7 | New `tools/coop-load.mjs` |
| HUD DOM writes | written only when changed (since v0.12) | kept; extend to every mode HUD | 1 | Audit in `audit:gadgets` |

### 9.2 Techniques that are allowed
- Dynamic `import()` per mode; lazy `<link>` per mode stylesheet.
- Gradient and path caching per canvas (proven in Cistern and Pirate Tide).
- Camera culling for every mode that draws off-screen entities (proven in Pirate Tide).
- Native-size glow blits (proven: 0.17–0.20 ms against 7.04–8.13 ms upscaled).
- Object pools for projectiles and particles (perf.js already exposes budgets).
- Axis-rejection before distance checks for collision (proven in Pirate Tide).

### 9.3 Techniques that were measured slower (do not retry without new evidence)
- OffscreenCanvas sprite cache for islands: 7.04 → 21.07 ms (v0.34).
- Tile sprite cache for cistern arches and pillars: 10.7 → 19.5 ms (v0.35).

### 9.4 Hardware profiles for release gates
- **Low**: 4× CPU throttle, software raster, 1280×720, Graphics preset Low.
- **Medium**: 2× throttle, GPU raster, 1920×1080, preset Medium.
- **High**: no throttle, GPU raster, 2560×1440, preset High.
All three run in headless Chrome via CDP, so they can be repeated on any machine. The numbers are recorded in the Update Log entry of the release that measured them.

---

## 10. Room-id and save-key ledger

### 10.1 Room ids (append-only)

| Range | Content | Count | Phase |
|---|---|---|---|
| 0–673 | Everything shipped (see §2.1) | 674 | — |
| 674–723 | Frontiers Lv 101–150 | 50 | 2 |
| 724–773 | Frontiers Lv 151–200 | 50 | 2 |
| 774–873 | Overdrive Lv 201–300 | 100 | 2 |
| 874–900 | Arc IV The Rift (25 + 2 secret) | 27 | 4 |
| 901–915 | Unwritten Expanse | 15 | 4 |
| 916–935 | Arc V The Ashfall Accord | 20 | 4 |
| 936–955 | Arc VII The Hollow Meridian | 20 | 6 |
| 956–961 | BAB XI Frostglass Cathedral | 6 | 6 |
| 962–967 | BAB XII Cinder Maw | 6 | 6 |
| 968–979 | Arc XII The Last Vow | 12 | 6 |
| 980–999 | Reserved for arc packs in §5.1 (Echo Remix, Undercroft, Moonlit Glade, Choir Reprise, Siege Reversed, secret rooms) | up to 20 | 3–5 |
| 9600–9644 | Scary: Arc X stages (9640–9644 new) | 45 | 5 |

Allocation rule: a new chapter takes the next free block and records it here in the same commit. `validate<Chapter>Rooms()` asserts that the block does not overlap with any other.

### 10.2 Save keys
Phase 1 moves every key below into `ashen-vow-slot<N>-*` and keeps the old keys readable for one release:
`progress-v1` (main, schema v2), `settings-v1` (global, **not** per slot), `character-v1`, `horror-v1`, `dread-v1`, `veil-v1`, `eternal-v1`, `archive-v1`, `3dhorror-v1`, `hunter-v1`, `secrets-v1`, `voice-v1` (global). New progress blocks go inside `progress` (`progress.frontierRooms`, `progress.overdriveRun`, `progress.rift`, `progress.expanse`, `progress.accord`, `progress.meridian`, `progress.frostglass`, `progress.cindermaw`, `progress.lastVow`), each with its own sanitizer.

---

## 11. Verification gates

| Gate | Applies to | Pass condition |
|---|---|---|
| Unit | every commit | `npm test` green; every new mechanic has a test |
| Docs truth | every release | `tests/docs.test.js` green (version and room total agree everywhere) |
| Budget | every commit from v0.37 | `tests/budget.test.js` green (file sizes, boot list) |
| Smoke | the mode touched | its `smoke:*` script green with zero console errors, desktop and 390×844 |
| Layout | every UI change | `audit:gadgets` green with no horizontal overflow on 10 viewports |
| Perf | Phase 1 and every 3rd release | §9.1 targets on the Medium profile; Low profile must stay playable (p95 ≤ 25 ms) |
| Soak | Phase 1, Phase 7 | 30 minutes with heap growth ≤ 10% |
| Save | every schema change | migration test from a v0.35.0 fixture save and from the previous release |
| v1.0 | release | all of the above on Low/Medium/High, a 4-player co-op load test, and a full playthrough of the true ending with the debug hooks off |

---

## 12. Risks and cut lines

| Risk | Mitigation | Cut first if late |
|---|---|---|
| Splitting `main.js` breaks the CDP smoke scripts | `debug_hooks.js` keeps the whole `window.__ashen` surface; run every smoke script in v0.37 | — (this phase cannot be cut) |
| 200 Frontiers/Overdrive rooms feel generic | Each chapter needs 1 new behaviour and 1 signature room mechanic; Echo-style special/elite/boss level types | Ship Overdrive chapters 1–5 in v0.42, chapters 6–10 in v0.45 |
| Boss count outpaces quality | Rule 10: one machine per boss; dialogue is required | The standalone-mode bosses in §6 rows 63–82 |
| Save migration to slots loses progress | Old keys stay read-only for one release; export runs before migration | — |
| Scope keeps growing | §8.4 lists what is out; new ideas go to the 2.0 archive, not this plan | Phase 5 packs for Realms, Puzzle and MOBA |
| Procedural audio loops get tiring | A/B sections plus variation bars | Chapter-specific tracks (map the new chapters to existing tracks first) |
| No `.blend` sources for 3D | Keep GLBs script-generated; document it in `asset-inventory.md` | New 3D areas in §5.3 |
