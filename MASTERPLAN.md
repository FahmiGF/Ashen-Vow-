# ASHEN VOW — MASTER PLAN

> **Version 2.0 — v1.0 roadmap + post-launch expansion.**
> Status snapshot: **Milestones A (v0.0.8) and B (v0.1.0) complete, plus content update v0.2.0 (Sigil & Ritual)** · Milestones C–F planned · Expansion design draft.
> The full game stays a zero-build, dependency-free HTML5 Canvas + ES-module project.

## Document map

| Part | Sections | Scope |
| --- | --- | --- |
| **Part 0 — v1.0 roadmap** | Milestones A–F | Ship v1.0: five zones, ~30 rooms, bosses, endings, fast travel, accessibility |
| **Part I — Expansion core** | 1–13 | New regions, enemies, bosses, tower defense, loadouts, skill trees, prestige, map editor, NPCs, Alien Mode, equipment, modes |
| **Part II — Production foundations and The Spire of Oaths** | 14–27 | Assets, events, publishing, UI/elements, tech, QA, roadmap, Spires, Hush, Rift Gate, talking bosses, music, presentation, priority |
| **Part III — The War Update (2026 Exclusive)** | 28–43 | Five war zones, 45 rooms, 10 arenas, factions, races, classes, 44 weapons, six bosses, Bazaar, skins, stats, inventory |
| **Appendices** | A–F | Element chart, UI audit, Wonderland room list, priority order, QA matrix, name alternatives |

**Guiding rules** (apply to every part):

1. **Ship every milestone.** Each milestone leaves the game playable and shippable; no milestone depends on a future one to be fun.
2. **Real systems only.** No placeholder buttons, fake progression, or fabricated verification. New screens read real game state.
3. **Preserve saves.** Progress lives in `ashen-vow-progress-v1`; settings in `ashen-vow-settings-v1`. Every schema change ships a migration and a test.
4. **Data-driven content.** Rooms, zones, bosses, enemies, shop items, and codex entries live in exported tables. Adding content must not require touching the renderer, audio engine, or map renderer.
5. **Pure simulation.** `src/core.js` never touches the DOM or audio. Every mechanic gets a deterministic Node test; browser flows are verified through `window.__ashen` and CDP.
6. **`npm test` green before every commit**, on desktop and portrait mobile.
7. **Metroidvania first.** Tower defense, roguelike runs, Alien Mode, and the map editor expand the original identity. They never turn the game into disconnected systems.
8. **No pay-to-win.** Expansion content is earned in-game. Cosmetics are the only paid layer, and every gameplay system is reachable without paying.

---

## Part 0 — v1.0 Roadmap (Milestones A–F)

> This part is the shipping roadmap. The expansion begins after v1.0 and must not delay Milestones C–F.

### Guiding rules for v1.0

1. **Ship every milestone.** Each milestone must leave the game playable and shippable; no milestone may depend on a future one to be fun.
2. **Real systems only.** No placeholder buttons, fake progression, or fabricated verification. New screens read real game state.
3. **Preserve saves.** Progress lives in `ashen-vow-progress-v1`; settings in `ashen-vow-settings-v1`. Every schema change ships a migration and a test.
4. **Data-driven content.** Rooms, zones, bosses, enemies, shop items, and codex entries live in exported tables. Adding content must not require touching the renderer, audio engine, or map renderer.
5. **Pure simulation.** `src/core.js` never touches the DOM or audio. Every mechanic gets a deterministic Node test; browser flows are verified through `window.__ashen` and CDP.
6. **`npm test` green before every commit**, on desktop and portrait mobile.

### Current state — v0.2.0 / Milestones A + B + Sigil & Ritual

| Area | Shipped |
| --- | --- |
| Audio engine | `src/music.js` procedural tracks, master/music/SFX buses, crossfade, combat layer, per-zone themes, `mycelialBoss` track |
| Settings | Audio, rebindable keys (one or two slots + conflict swap), gamepad, screen shake, flashing, contrast, colourblind, text size, frame cap, FPS counter |
| Persistence | Settings stored separately; v0.0.7 progress saves migrate into the map model; 14-room progress arrays extend without reindexing |
| Interactive map | Fog of war, zone colours, player/boss markers, tooltips, legend, pan/zoom/recenter, 10 persistent pins, 14-node layout |
| Zones | Five zone definitions (`ashen`, `mycelial`, `cistern`, `frostglass`, `cinder`) with palette, particle, map colour, music IDs |
| Content | 14 rooms, 6 bosses, 10 playable characters, 3 weapons, 7 codex enemies, codex, prologue, 18-item shop, checkpoints, Mycelial Hollow branch |
| Items | 4 permanent Sigils, 4 Ritual items, 6 consumables, quick-item cycling, in-run inventory, Whetstone damage buff |
| Meta UI | In-game Update Log backed by `src/updates.js`, inventory overlay, HUD quick-item badge |
| Tests | 93 Node tests + browser smoke coverage for gates, trampoline, climb, secret wall, boss phases, flask reward, persistence, shop, inventory, and update log |

Known gaps after v0.2.0: Tidewrought Cistern, Frostglass Cathedral, and Cinder Maw have zone configuration but no playable rooms; no trailer; no branching story or endings; no fast travel. Sigil & Ritual is a content update, not Milestone C.

### Milestone B — v0.1.0: Mycelial Hollow — COMPLETE

**Goal:** prove the zone system by shipping the first genuinely new biome.

**Shipped:**
- 6 rooms in `mycelial`: entry shaft, spore gardens, hanging bridges, brood nest, hidden alcove, boss arena.
- New enemies: Sporeling (explodes into a slow cloud), Mycelial Stalker (burrows and re-emerges), Brood Mother adds.
- Main boss: **The Sporebound** (3 phases; area denial + adds).
- Optional mini-boss: **Root of the First Vow** behind a breakable wall; rewards a permanent flask charge.
- New traversal: spore trampolines (bounce pads) and climbable mycelium.
- Music: `TRACKS.mycelial` plus a dedicated `mycelialBoss` variant.
- Map: layout nodes + exits added; fog reveals through the new route; room 12 stays hidden until discovered.
- **Acceptance verified:** a new player can reach and clear the zone from Ashen Hall; save/reload keeps discovery; `npm test` covers spore trampoline, burrow, boss phases, and the flask reward (79/79), and a 36-check CDP smoke passes with no console errors.

### Milestone C — v0.2.0: Tidewrought Cistern

**Goal:** water as a mechanic, not a colour.

- 6 rooms in `cistern`: floodgate hall, pump room, submerged archive, leviathan trench, hidden vault, boss arena.
- Water states: drained / rising / flooded; valves stay open across the room visit.
- New enemies: Drowned Warden (shield front, vulnerable back), Tide Serpent (sweeps through water), Sump Crawler.
- Main boss: **The Tidewright** (2 phases; raises water, then electrifies it).
- Optional boss: **The Drowned Choir** (variant of Hollow Choir mechanics) rewarding a relic that lets the player breathe longer.
- Fast travel: unlock a ferry shrine in the cistern that connects cleared zone entrances (see Milestone E).
- Acceptance: water physics deterministic in Node; fast-travel unlock persists; no soft-lock when water rises while the player is in a tight corridor.

### Milestone D — v0.3.0: Frostglass Cathedral + Cinder Maw

**Goal:** finish the five-zone map and the main boss roster.

- 5 rooms in `frostglass`: nave, frozen choir loft, mirror gallery, bell shaft, boss arena.
- 5 rooms in `cinder`: slag road, forge, wyrm nest (rework of Sarang Wyrm), ash throne, final approach.
- New main boss in Frostglass: **The Glass Saint** (2 phases; mirror clones, shatter zones).
- Rework **The Oathbreaker** into the true final encounter across three phases with arena changes.
- **Story beats:** after the third main boss, play the **cinematic trailer** in-engine; before the final boss, present the Oath Index choice.
- Optional boss: **The Forgotten Shield** in Frostglass, rewarding a permanent max-HP increase.
- Acceptance: all ~30 rooms reachable; trailer plays once and is skippable/replayable from the codex; the Oath Index records choices.

### Milestone E — v0.5.0: Story, endings, and fast travel

**Goal:** turn progression into a narrative.

- **Oath Index**: a persistent record of promises made to bosses/NPCs, shown in the codex.
- Two endings:
  - **Keep the Vow** — sacrifice the relic; the ash cycle continues.
  - **Break the Vow** — free the realm; the player loses the relic but unlocks New Game+.
- Ending selection uses choices recorded through the run; both endings are reachable, tested, and save-safe.
- Fast travel between cleared zone shrines, with a map interaction and confirmation.
- NPC dialogue in safe rooms; optional lore entries that feed the Index.
- Acceptance: both endings verified end-to-end via `window.__ashen`; ending choice persists; fast travel cannot skip locked content.

### Milestone F — v1.0.0: Accessibility, polish, and ship

**Goal:** release quality.

- Accessibility pass: focus-visible on every menu, reduced-motion respect, screen-reader labels for HUD resources, colourblind palettes for zone markers, remappable gamepad buttons, text size audited on every screen.
- Settings: separate music/SFX sliders (done), controller deadzone option, hold/toggle options for dash and interact.
- Performance: profile every zone at 60 FPS on integrated graphics; pooled particles/projectiles; no GC spikes during boss fights.
- Save robustness: atomic writes for progress, versioned migration tests from v0.0.7 → v1.0.
- Localization: Indonesian (default) plus English string table; story text externalised.
- Trailer/marketing build: in-engine trailer, screenshots, itch.io page, Steam-ready build notes.
- Definition of done:
  1. Five zones and ~30 rooms playable from menu to ending.
  2. Five main bosses + three optional bosses, all with phases and dialogue.
  3. Two endings reachable, Oath Index recorded, fast travel working.
  4. Every action rebindable; gamepad and keyboard both complete the game.
  5. Settings and progress survive reload, version migration, and settings reset.
  6. `npm test` green; CDP smoke covers boot, menus, each zone entry, both endings.
  7. No horizontal overflow at 390×844; all menus scroll; no console errors.
  8. README, MASTERPLAN, and CLAUDE.md match the shipped build.

### Dependency order

```
A (v0.0.8) ── B (v0.1.0, Mycelial) ── C (Cistern) ── D (Frostglass + Cinder)
                                                      │
                                                      ├── E (Story + endings + fast travel)
                                                      └── F (Accessibility + polish + ship)
```

B is shipped. C can now proceed independently; D reuses the water and trampoline systems before adding new ones. E depends on D because the Oath Index needs the full boss roster. F starts after E content is frozen.

### Extension points

| Need | Touch |
| --- | --- |
| New room | `ROOMS` in `src/core.js`, `ROOM_ZONES` + `MAP_LAYOUT` + `LEVEL_META`; add a map layout node and exit pair |
| New zone | `ZONES` in `src/zones.js` (palette, particle, map colour, track IDs) and a `TRACKS` entry in `src/music.js` |
| New boss | `BOSS_INFO` + `CODEX` in `src/core.js`; Node tests for phases, defeat, and dialogue |
| New enemy | `ENEMY_INFO`, spawn table, renderer branch, codex entry, test |
| New item | `SHOP_ITEMS`, `CODEX.items`, `buyShopItem()` validation, test |
| New setting | `defaultSettings` / `sanitizeSettings` in `src/settings.js`, a row in `buildSettings()`, a test for clamping/persistence |
| New map feature | `src/map.js` model + `MapView`; keep the model Node-testable |

### Risks

- **Save drift**: adding rooms changes array lengths. Always extend with defaults instead of reindexing existing rooms; keep migration tests for old saves.
- **Content cost**: ~30 rooms is the largest single work item. Reuse room grammar (entry, combat, traversal, boss) rather than bespoke scripting.
- **Audio fatigue**: procedural tracks are cheap but can loop noticeably. Crossfade, combat layers, and per-zone palettes are the mitigation; consider longer patterns if playtests complain.
- **Scope creep**: story, endings, and trailer can expand forever. Timebox E to the two endings and the Index; everything else is post-1.0.

---

## Part I — Expansion Core (Sections 1–13)

> The expansion turns the v1.0 game into a larger, replayable 2D action roguelike Metroidvania. It is an expansion of the existing game, not a replacement: existing saves, zones, characters, bosses, and progression remain compatible.

## 1. Core expansion vision

The expansion focuses on six pillars.

| Pillar | Expansion |
| --- | --- |
| Exploration | More interconnected regions, towers, secrets, and biomes |
| Combat | New enemies, bosses, elite variants, and combat mechanics |
| Progression | More skill trees, mastery, prestige, and grindable upgrades |
| Loadouts | Custom builds, presets, weapon combinations, and equipment |
| Creativity | Advanced map editor, custom bosses, terrain, and NPCs |
| Game modes | Alien Mode, survival, endless, challenge, and tower defense |

### 1.1 New progression targets

These are content targets, adjustable to the existing architecture. They are budgets, not promises; the priority order in Section 27.5 decides what ships.

| Target | Count | Notes |
| --- | --- | --- |
| Major regions | 18+ | Seven new story regions, three post-game worlds, plus the five v1.0 zones and Alien Mode |
| Enemy variants | 80+ | Normal, elite, corrupted, alien, and Wonderland families |
| Boss encounters | 35+ | Story, optional, secret, rematch, and challenge variants |
| Tower variants | 40+ | Six base towers with four levels and two specialization branches each |
| Skill trees | 12+ | Combat, exploration, defense, crafting, and Alien research |
| Game modes | 7+ | Campaign plus replayable modes |
| Rooms | ~130 | ~30 v1.0 rooms, ~50 expansion rooms, ~45 War Update rooms, plus towers and secrets |

### 1.2 Design rules

1. **Metroidvania first.** Every new system must feed exploration, combat, or traversal. Tower defense and roguelike runs are optional layers, not replacements.
2. **One world, many doors.** New regions connect to the existing map through locks, shortcuts, elevators, and hidden entrances. No disconnected stage select.
3. **Existing saves survive.** New rooms append to the end of `ROOMS`; old progress arrays extend with defaults. Never reindex an existing room.
4. **Abilities gate, stats do not.** Progression is horizontal first. A new player can beat the campaign with skill; a veteran earns options, not raw power.
5. **Every boss teaches.** A boss's mechanics preview a traversal ability, an element, or a system the player will use next.
6. **No fake content.** If a mode or region is not playable, it is not in the build. The map editor and codex read the same canonical data as the campaign.
7. **Timebox the expansion.** The priority order is a contract. Cut from the bottom, never from accessibility or save safety.

### 1.3 What the expansion is not

- It is not a sequel. The v1.0 story, characters, and endings remain canon.
- It is not a live-service grind. There are no daily chores required to finish the story.
- It is not a separate game. Tower defense, Alien Mode, and the editor live inside Ashen Vow's shell and share its save, settings, and accessibility.
- It is not a pay-to-win product. Gameplay content is earned; cosmetics are the only paid layer.

---

## 2. World expansion — new regions, levels, and the Wonderland

The world grows into a connected map with locked routes, shortcuts, elevators, hidden entrances, and environmental puzzles.

### 2.1 New story regions

| # | Region | Theme | Signature mechanics | Boss | Unlock |
| --- | --- | --- | --- | --- | --- |
| 01 | **The Hollow Cathedral** | Abandoned religious fortress | Moving platforms, collapsing bridges, bell hazards | **The Last Archbishop** | Sacred Flame ability |
| 02 | **Crystal Graveyard** | Underground crystal formations | Reflective laser puzzles, crystal growth | **The Shattered Colossus** | Crystal Dash |
| 03 | **The Stormbound Heights** | Floating islands and wind currents | Lightning hazards, air currents, glide | **Tempest Sovereign** | Air Glide |
| 04 | **The Drowned Mire** | Poisonous water and submerged passages | Poison water, swamp creatures, infected spirits | **Mire Mother** | Abyssal Swim |
| 05 | **The Iron Dominion** | Mechanical fortress | Conveyor belts, moving machinery, artillery | **The Iron Regent** | Mechanical Overdrive |
| 06 | **The Ember Wastes** | Volcanic platforms | Lava flows, heat mechanics, ash storms | **Cinder Titan** | Ember Core |
| 07 | **The Extraterrestrial Rift** | Alien architecture and organic structures | Gravity anomalies, living doors, alien energy | **The Star Devourer** | Alien technology |

Each region has a main route, an optional route, a tower, a settlement, a hidden boss, and at least one secret that only a later ability can open.

### 2.2 Level structures

Every region uses a mix of level types so the world does not feel copy-pasted.

| Type | Purpose | Example |
| --- | --- | --- |
| Main exploration stage | Advance the region's story | The Hollow Cathedral nave |
| Vertical climbing tower | Test traversal and stamina | The Forgotten Spire |
| Underground labyrinth | Maze, keys, and secrets | Crystal Graveyard catacombs |
| Mini-boss chamber | Short, intense fight | Bell Wraith chapel |
| Treasure vault | Reward for a hidden route | Stormbound vault |
| Challenge room | Optional skill test | Mire poison run |
| Time-trial chamber | Movement mastery | Iron Dominion conveyor sprint |
| NPC settlement | Shops, dialogue, quests | Ember Wastes camp |
| Hidden boss arena | Optional boss | The Forgotten General |
| Endless combat arena | Roguelike mode entrance | The Abyssal Coliseum |
| Environmental puzzle room | Ability test | Crystal laser hall |
| Secret post-game area | Long-term mystery | The Wonderland Beyond |

### 2.3 Tower expansion

Towers are exploration landmarks, not decoration.

| # | Tower | Region | Theme | Guardian | Permanent reward |
| --- | --- | --- | --- | --- | --- |
| 1 | **Watchtower of Ash** | Ashen Hall | Burning watchpost | The Ash Herald | Cinderstep |
| 2 | **The Forgotten Spire** | Mycelial Hollow | Overgrown spire | The Mycelial Matriarch | Mycelial Cling |
| 3 | **Clockwork Citadel** | Iron Dominion | Gears and pistons | The Iron Regent | Mechanical Overdrive |
| 4 | **The Bone Observatory** | Hollow Cathedral | Ossuary telescope | The Last Archbishop | Sacred Flame |
| 5 | **Crystal Sentinel Tower** | Crystal Graveyard | Prism lighthouse | The Shattered Colossus | Crystal Dash |
| 6 | **Stormcaller Tower** | Stormbound Heights | Lightning rod | Tempest Sovereign | Air Glide |
| 7 | **The Abyssal Lighthouse** | Drowned Mire | Flooded beacon | Mire Mother | Abyssal Swim |
| 8 | **Alien Signal Tower** | Extraterrestrial Rift | Living antenna | The Star Devourer | Alien technology |
| 9 | **The Eternal Flame Tower** | Ember Wastes | Furnace spire | Cinder Titan | Ember Core |
| 10 | **The King's Bastion** | Endgame | Royal fortress | The Hollow King | Oathbreaker's Crown |

Each tower has multiple floors, unique encounters, hidden collectibles, secret doors, a tower NPC, optional challenges, a tower boss or guardian, and a permanent reward. **Tower Ascension** replays a completed tower with randomized floors, harder enemies, and modifiers; it is the repeatable endgame for traversal players.

### 2.4 The Wonderland Beyond (Magical Wonderland post-game)

> **The user-requested "magical wonderland" level after the last level.** It is a post-game secret region, not a reskin. It unlocks after the final boss and the **Break the Vow** ending, and it is the bridge to the secret worlds in 2.5.

**Unlock:** after the final boss, a mirror in the Frostglass Cathedral's mirror gallery stops reflecting the player and starts reflecting a door. Interact with it while carrying the **Broken Vow** — the remnant left when the relic shatters in the Break the Vow ending. The door opens once per save; the region then appears on the map as a floating island beyond the Extraterrestrial Rift.

**Theme:** a storybook wonderland built from candyglass, playing cards, teacups, and clockwork. It is deliberately bright and wrong: pastel colours, a smiling moon, flowers that whisper the player's promises, and a queen who collects broken vows.

**Rooms (6):**

| # | Room | Type | Mechanics | Enemies |
| --- | --- | --- | --- | --- |
| 1 | **The Rabbit Hole** | Entry / fall | A long fall with shrinking rings; the player lands in a teacup | Card Soldier, Teacup Mimic |
| 2 | **The Tea Garden** | Combat / puzzle | Teacup platforms, boiling tea geysers, a long table that rearranges | Teacup Mimic, Flamingo Knight |
| 3 | **The Card Bridge** | Traversal | Playing-card bridges shuffle and flip; the player must read the suit order | Card Soldier, Cheshire Stalker |
| 4 | **The Clockwood** | Puzzle / stealth | Giant clocks stop and start; frozen platforms and time-locked doors | Cheshire Stalker, Clockwork Hare |
| 5 | **The Queen's Court** | Mini-boss / choice | Croquet with living flamingos; a courtroom where the queen asks three questions | Queen's Guard, Flamingo Knight |
| 6 | **The Heart Throne** | Boss arena | A checkerboard arena that flips; card storms; the queen's three phases | **The Crimson Queen** |

**Traversal mechanics:**

- **Size Shift:** the player shrinks to fit keyholes and grows to break card barriers. The hitbox, camera, and attack range change; damage stays proportional.
- **Card Shuffle:** card bridges reorder on a fixed cadence. The next order is telegraphed by a suit icon in the HUD.
- **Tea Time:** tea geysers erupt on a waltz beat. The player can dash on the beat to avoid them.
- **Clock Stop:** the player stops local time for 2 seconds; moving platforms and enemies freeze, but the player's own cooldowns do not.

**Enemies:**

| Enemy | Behaviour | Counter |
| --- | --- | --- |
| **Card Soldier** | Marches in formation, raises a card shield | Break the shield with a heavy attack or attack from behind |
| **Teacup Mimic** | Disguises as a teacup, lunges when approached | Hit it once to reveal; it is fragile |
| **Cheshire Stalker** | Fades in and out, attacks from the opposite side | Watch the grin; hit after it solidifies |
| **Flamingo Knight** | Long-range croquet shots, reflects projectiles | Dash under the shot; punish the wind-up |
| **Queen's Guard** | Shield wall, calls card soldiers | Break formation with the Size Shift stomp |

**Boss: The Crimson Queen.** Three phases:

1. **Croquet:** she sends flamingo projectiles through hoops; the player must position the hoops to redirect the shots.
2. **Card Storm:** the arena flips; card soldiers form a maze; she summons a hand of giant cards that fall in a pattern.
3. **Heart Execution:** the queen grows to fill the arena; the player uses Size Shift to reach the heart weak point; the floor becomes a checkerboard of safe and deadly squares.

**Reward:** the **Heart Key** (opens the Mirror Palace), the **Wonderland** outfit, the **Cheshire Grin** charm, the **"Wonderland Waltz"** music track, and a codex entry that changes the ending epilogue. The region stays replayable with a **Queen's Trial** rematch.

**Music:** "Wonderland Waltz" — celesta, strings, music box, off-kilter 3/4 waltz that becomes a frantic 6/8 in phase 3. The zone theme has a music-box layer that stops when the player stands still.

**Palette:** magenta, mint, gold, deep purple, and cream. Particle: falling playing cards and sugar dust. The HUD uses a card-suit motif in this zone only.

**Acceptance:**

- The door appears only after the final boss and the Break the Vow ending.
- Size Shift is deterministic in Node: the same inputs produce the same hitbox and collision result.
- The Crimson Queen has three phases, dialogue, and a rematch.
- The Heart Key, outfit, charm, and music track persist across reload.
- The region is reachable from the map and does not break the existing ending flags.

### 2.5 Other secret worlds

These are optional post-game worlds. They ship after the Wonderland and are cut first if the schedule slips.

| World | Rooms | Theme | Boss | Reward |
| --- | --- | --- | --- | --- |
| **The Clockwork Carnival** | 4 | Carousel, gears, ringmaster tents | The Clockwork Ringmaster | Carnival outfit, gear trail |
| **The Mirror Palace** | 4 | Reflections, doppelgangers, mirrored rooms | The Mirror Self | Mirror cape, reflection charm |
| **The Sunken Dream** | 4 | Dream logic, floating furniture, nightmare sea | The Dream Eater | Dreamer outfit, lullaby track |

### 2.6 World map and connectivity

- The map adds region nodes, tower nodes, secret doors, and fast-travel shrines.
- Locked routes show the ability that opens them, not a generic lock.
- Shortcuts are permanent and visible on the map.
- Elevators connect vertical layers; they are not loading screens.
- Hidden entrances are discovered by exploration, not by a quest marker.
- The map remembers fog, pins, and discovery per save.

---

## 3. Enemy expansion

Enemies have individual behaviour, attack patterns, weaknesses, resistances, and interactions with their environment.

### 3.1 Enemy classifications

| Category | Characteristics |
| --- | --- |
| Common | Basic enemies |
| Advanced | More complex attack patterns |
| Elite | Stronger abilities and modifiers |
| Champion | Unique elite encounters |
| Mini-boss | Multi-pattern encounters |
| Boss | Dedicated arenas and phases |
| Corrupted | Special environmental effects |
| Alien | Unpredictable movement and abilities |
| Summoner | Creates additional enemies |
| Guardian | Protects important locations |

### 3.2 New enemy roster

| Enemy | Region | Behaviour | Weakness |
| --- | --- | --- | --- |
| **Ashen Knight** | Hollow Cathedral | Armoured melee, defensive stance | Heavy attack breaks guard |
| **Grave Wraith** | Hollow Cathedral | Floating, temporary phasing | Radiance or a well-timed parry |
| **Shard Crawler** | Crystal Graveyard | Wall-climbing ambush | Crystal damage; knock it off the wall |
| **Clockwork Stalker** | Iron Dominion | Mechanical ranged attacks | Ember; overloads its gears |
| **Rotcap Brute** | Drowned Mire | Heavy area control, poison clouds | Frost; slows its wind-up |
| **Void Parasite** | Extraterrestrial Rift | Unusual movement, attaches to walls | Alien or crystal; purge the parasite |
| **Storm Harpy** | Stormbound Heights | Dive attacks, wind gusts | Storm resistance; ground it with a heavy hit |
| **Magma Knight** | Ember Wastes | Shield and lava trail | Frost; shatters the cooled shield |

### 3.3 Wonderland enemy roster

| Enemy | Behaviour | Counter |
| --- | --- | --- |
| **Card Soldier** | Formation march, card shield | Heavy attack or back attack |
| **Teacup Mimic** | Disguise, lunge | Reveal with one hit |
| **Cheshire Stalker** | Phase in/out, flank | Hit after it solidifies |
| **Flamingo Knight** | Croquet projectiles, reflect | Dash under the shot |
| **Queen's Guard** | Shield wall, summons | Size Shift stomp |
| **Clockwork Hare** | Fast hit-and-run, time-stop | Clock Stop or a trap |

### 3.4 Enemy mutation system

Randomized modifiers appear on higher difficulties and in roguelike modes.

| Mutation | Effect | Counterplay |
| --- | --- | --- |
| Armored | Increased defense | Heavy attacks, armor break |
| Frenzied | Faster attack cadence | Crowd control, spacing |
| Regenerative | Gradually recovers health | Burst damage, poison |
| Volatile | Creates a hazard on death | Ranged kill, dash away |
| Phantom | Occasionally intangible | Area denial, timing |
| Elite | Gains an additional ability | Prioritize, isolate |
| Swarm | Spawns smaller enemies | Area damage, choke points |
| Ancient | Unique attack variations | Learn the new tell |

Enemies can receive multiple compatible modifiers in higher difficulties. Mutations are visible in the bestiary and on the enemy's health bar.

### 3.5 Enemy AI improvements

- Patrol, aggressive, investigation, and retreat states.
- Group coordination and flanking.
- Terrain awareness: ledges, water, hazards, climbable surfaces.
- Boss-specific decision systems.
- Player distance detection and line-of-sight checks.
- Animation-driven attack telegraphs.
- A finite-state machine or behavior tree architecture so new enemy types do not require rewriting combat.

### 3.6 Elemental resistances

Every enemy has a resistance profile. The full element chart is in Appendix A; the short version:

| Element | Strong against | Weak against |
| --- | --- | --- |
| Ember | Rotcap, plant, ice armor | Tide, crystal |
| Frost | Magma, clockwork, frenzy | Ember, storm |
| Storm | Metal, water, flying | Crystal, earth |
| Venom | Living, regenerative | Clockwork, undead |
| Crystal | Armor, constructs | Storm, ember |
| Void | Barriers, summons | Radiance, crystal |
| Radiance | Undead, wraiths, corruption | Void, shadow |
| Alien | Organic, gravity | Radiance, crystal |

---

## 4. Boss expansion

Bosses are memorable encounters with distinct mechanics, dialogue, and music.

### 4.1 New story bosses

| Boss | Region | Special mechanic | Phases |
| --- | --- | --- | --- |
| **The Last Archbishop** | Hollow Cathedral | Sacred arena hazards, bell waves | 3 |
| **The Shattered Colossus** | Crystal Graveyard | Crystal attack patterns, laser reflections | 3 |
| **Tempest Sovereign** | Stormbound Heights | Weather and wind mechanics | 3 |
| **Mire Mother** | Drowned Mire | Environmental hazard management, poison tides | 3 |
| **The Iron Regent** | Iron Dominion | Mechanical attack patterns, conveyor arena | 3 |
| **Cinder Titan** | Ember Wastes | Heat and lava hazards, forge weapons | 3 |
| **The Star Devourer** | Extraterrestrial Rift | Gravity and alien abilities | 4 |
| **The Hollow King** | Endgame | Multi-stage encounter, throne arena | 4 |
| **The Forgotten General** | Secret Tower | Summoned enemy formations | 3 |
| **The Eclipse Seraph** | Post-game | Changing combat conditions, light/dark | 4 |

### 4.2 Wonderland and secret bosses

| Boss | World | Special mechanic | Reward |
| --- | --- | --- | --- |
| **The Crimson Queen** | The Wonderland Beyond | Croquet, card storm, heart execution | Heart Key, outfit, charm |
| **The Clockwork Ringmaster** | Clockwork Carnival | Carousel phases, gear traps | Carnival outfit |
| **The Mirror Self** | Mirror Palace | Copies the player's loadout | Mirror cape |
| **The Dream Eater** | Sunken Dream | Sleep meter, dream logic | Dreamer outfit |

### 4.3 Boss phase framework

Every boss supports:

1. Intro animation and one intro line.
2. Phase 1.
3. Phase transition with a phase-break line.
4. Phase 2.
5. Enraged phase.
6. Optional final phase.
7. Defeat sequence and defeat line.
8. Reward sequence.
9. Boss journal entry.

Phases change attack patterns, movement, arena interactions, and visual effects. A phase change is always readable: a sound cue, a colour shift, and a dialogue line.

### 4.4 Boss rematch system

After defeating a boss in the campaign:

- Unlock its **rematch** from the Practice Arena.
- Unlock its **challenge variant** with modifiers.
- Unlock its **boss journal** entry.
- Unlock its **arena** in the editor.
- Unlock its **enemy and boss asset package**.
- Allow custom boss placement in player-created maps.

### 4.5 Boss journal and codex

The boss journal records phases, weaknesses, lore, dialogue, music track, and first-clear date. It is the canonical source for the bestiary and the editor's boss library.

---

## 5. Tower defense system — Kingdom Rush inspiration

Tower defense is a fully integrated secondary gameplay system, not a separate game. The player builds and upgrades towers in designated defense locations, then fights alongside them.

### 5.1 Tower categories

| Tower | Role | Branch A | Branch B |
| --- | --- | --- | --- |
| **Archer Tower** | Fast ranged attacks, high accuracy | Sniper Tower | Ranger Tower |
| **Arcane Tower** | Magical projectiles, effective against armor | Elemental Tower | Void Tower |
| **Artillery Tower** | Area damage, slower attacks | Siege Cannon | Mortar Tower |
| **Barracks** | Deploys defensive units, blocks progression | Royal Guard | Berserker Barracks |
| **Frost Tower** | Slows enemies, freezing effects | Glacier Tower | Frozen Prison |
| **Necromancer Tower** | Summons temporary spectral defenders | Soul Harvester | Bone Commander |

### 5.2 Tower upgrade structure

Each tower has:

- Base level.
- Level II.
- Level III.
- Level IV.
- Two specialization paths.
- Three to four specialization upgrades.
- A unique ultimate ability.

Example: **Archer Tower**

```
Archer Tower (base)
├── Sniper Tower (precision)
│   ├── Long-range Aim
│   ├── Armor Piercer
│   ├── Eagle Eye
│   └── Ultimate: Deadeye
└── Ranger Tower (rapid fire)
    ├── Rapid Draw
    ├── Twin Volley
    ├── Poison Arrows
    └── Ultimate: Arrow Storm
```

### 5.3 Tower defense modes

- Campaign defense missions.
- Endless waves.
- Boss siege.
- Randomized tower defense.
- Survival defense.
- Alien invasion defense.
- Daily tower challenge.
- Custom map defense.

### 5.4 Hero units

Deployable heroes support towers:

| Hero | Role | Ability |
| --- | --- | --- |
| **Knight Commander** | Frontline tank | Shield wall, taunt |
| **Arcane Mage** | Area caster | Meteor, time slow |
| **Shadow Assassin** | Single-target burst | Teleport strike, poison |
| **Beast Tamer** | Summons and slows | Beast charge, snare |
| **Crystal Guardian** | Defensive control | Crystal wall, reflect |
| **Alien Hunter** | Anti-alien specialist | Gravity snare, bio-bomb |

Each hero has independent abilities, cooldowns, upgrades, and a progression tree.

### 5.5 Integration with the Metroidvania

- Defense locations are rooms or arenas in the main world, marked on the map.
- The player can build before a wave and fight during it.
- Towers persist for the encounter, not the whole game.
- Tower materials drop from region content, not a separate grind.
- The player can pause the build phase; combat cannot be paused in multiplayer-style modes.
- A failed defense retries from the wave start, not the room start.

---

## 6. Advanced loadout system

The loadout system becomes flexible: create, save, duplicate, rename, share locally, and switch between builds.

### 6.1 Loadout slots

| Slot | Examples |
| --- | --- |
| Primary weapon | Sword, spear, greatsword, bow |
| Secondary weapon | Dagger, pistol, shield |
| Armor | Light, medium, heavy |
| Headgear | Helmet, hood, mask |
| Amulet | Defensive and utility bonuses |
| Ring 1 | Combat bonuses |
| Ring 2 | Special effects |
| Relic 1 | Passive abilities |
| Relic 2 | Utility abilities |
| Skill specialization | Selected skill branch |
| Companion | Pet or support entity |
| Combat style | Aggressive, balanced, defensive |

### 6.2 Loadout presets

Players can save multiple builds.

| Preset | Equipment | Playstyle |
| --- | --- | --- |
| **01 — Abyssal Executioner** | Greatsword, heavy armor, void relic | High burst, close range |
| **02 — Arcane Wanderer** | Magic staff, light armor, arcane relic | Long range, ability regeneration |
| **03 — Iron Guardian** | Sword and shield, heavy armor, defense relic | Defensive, counterattacks |
| **04 — Rift Hunter** | Dual daggers, medium armor, alien relic | Mobility, rapid attacks |
| **+ Create New Loadout** | — | — |

### 6.3 Formatting and customization

- Custom names and descriptions.
- Color-coded build categories.
- Custom icons.
- Favorite loadouts.
- Search and filters.
- Sort by damage, defense, mobility, or date.
- Duplicate, compare, reset to default.
- Equipment compatibility warnings.
- Saved presets per game mode.

### 6.4 Loadout synergy engine

| Combination | Synergy |
| --- | --- |
| Fire Sword + Ember Relic | Increased fire affinity |
| Frost Armor + Glacier Ring | Improved freeze resistance |
| Void Staff + Rift Amulet | Improved ability interaction |
| Heavy Shield + Guardian Ring | Improved defensive counterplay |
| Alien Blade + Parasite Core | Alien ability specialization |

Synergies are visible in the loadout interface before equipping.

### 6.5 Loadout mastery

Every build earns mastery XP through gameplay.

Rewards:

- Additional preset slots.
- Cosmetic borders.
- Loadout-specific titles.
- Unique profile emblems.
- Build mastery badges.
- Special visual effects.

Mastery never grants a raw damage multiplier that renders older builds obsolete.

---

## 7. Expanded skill trees and skill points

Skill progression provides long-term goals and meaningful build diversity.

### 7.1 Skill tree categories

1. Weapon Mastery.
2. Defensive Mastery.
3. Mobility Mastery.
4. Arcane Mastery.
5. Shadow Mastery.
6. Summoning Mastery.
7. Survival Mastery.
8. Tower Engineering.
9. Exploration Mastery.
10. Boss Hunter.
11. Alien Adaptation.
12. Relic Mastery.

### 7.2 Example: Weapon Mastery

```
Weapon Mastery
├── Combat Foundation (unlocked)
├── Heavy Strikes — charged attack effectiveness (5 ranks)
├── Quick Recovery — recovery after attacks (5 ranks)
├── Weapon Affinity — weapon specialization (10 ranks)
└── Master Technique — unique combat ability (ultimate)
```

### 7.3 Skill point acquisition

| Activity | Reward |
| --- | --- |
| Level completion | XP |
| Boss defeat | Skill points |
| Secret discoveries | Skill fragments |
| Tower completion | Engineering points |
| Elite encounters | Mastery XP |
| Daily challenges | Bonus fragments |
| Endless mode | Milestone rewards |
| Alien Mode | Alien research points |
| Achievement milestones | Permanent bonuses |

### 7.4 Skill point currencies

| Currency | Source | Used for |
| --- | --- | --- |
| **Skill Points** | Levels, bosses, achievements | General character progression |
| **Weapon Points** | Weapon use, mastery trials | Weapon mastery |
| **Tower Points** | Defense missions | Tower upgrades |
| **Exploration Points** | Secrets, map completion | Exploration tree |
| **Alien Research** | Alien Mode | Alien-specific upgrades |
| **Prestige Tokens** | Prestige ranks | Advanced permanent progression |

### 7.5 Repeatable progression

**Mastery Trials** repeat challenges for XP, mastery XP, skill fragments, tower materials, relic crafting components, and cosmetics. Diminishing returns apply to repetitive low-effort farming; all major progression paths remain achievable through normal play.

---

## 8. Prestige and long-term grind

Prestige unlocks after the required progression milestones.

### 8.1 Prestige ranks

```
Prestige Rank: P-07
Progress: 7,450 / 10,000
Next milestone: Prestige 8
```

Rewards:

- Prestige points.
- Unique cosmetics.
- Additional loadout presets.
- Special titles.
- Prestige-exclusive challenges.
- Additional skill tree branches.

### 8.2 Prestige branches

- Combat Prestige.
- Exploration Prestige.
- Tower Prestige.
- Boss Hunter Prestige.
- Alien Research Prestige.
- Mastery Prestige.

### 8.3 Preservation rules

Prestige must not delete campaign completion, boss unlocks, map editor assets, or purchased permanent content. It resets only the prestige-eligible progression track, never the save.

---

## 9. Advanced map editor 2.0

The map editor becomes a complete level-creation environment. The most important feature: **every boss defeated in the campaign becomes a placeable boss asset in the map editor.** This is an actual unlock connected to campaign progression.

### 9.1 Editor workspace

| Panel | Features |
| --- | --- |
| Terrain | Ground, walls, slopes, platforms |
| Objects | Props, doors, chests |
| Enemies | Normal and elite enemies |
| Bosses | Defeated campaign bosses |
| NPCs | Interactive characters |
| Towers | Defense structures |
| Triggers | Events and conditions |
| Lighting | Shadows and ambient effects |
| Backgrounds | Parallax and scenery |
| Logic | Event and interaction editor |
| Audio | Music and environmental sounds |

### 9.2 Boss unlock integration

The boss asset library reads the canonical campaign completion record, not a manually maintained duplicate list.

When a boss is unlocked, the editor allows:

- Place boss encounter.
- Choose arena.
- Configure starting phase.
- Set boss health scaling.
- Configure rewards.
- Enable or disable the intro sequence.
- Configure boss defeat conditions.
- Set encounter music.
- Configure respawn settings.
- Add optional companion enemies.

Custom boss configurations save separately from the original campaign boss definitions. A custom encounter never overwrites campaign state.

### 9.3 Terrain scaling system

Features:

- Horizontal, vertical, uniform, and freeform scaling.
- Tile snapping and grid snapping.
- Rotation and mirroring.
- Terrain duplication and merging.
- Collision editing and custom collision shapes.
- Slope adjustment and platform thickness.
- Layer management, terrain presets, multi-selection.

Terrain types: stone, cracked stone, mossy ground, wooden platforms, metal platforms, crystal surfaces, lava, ice, alien organic, destructible blocks, one-way platforms, moving platforms, invisible collision, water, gravity-altered terrain.

Terrain physics:

| Property | Configuration |
| --- | --- |
| Friction | Low, medium, high |
| Gravity | Normal, modified |
| Collision | Solid, one-way, none |
| Damage | None, environmental |
| Movement | Static, moving |
| Durability | Indestructible, destructible |
| Trigger | Touch, enter, exit |

### 9.4 Advanced editor tools

**Selection:** rectangle, multi-select, group, layer lock, object hierarchy, duplicate groups.

**Painting:** tile brush, terrain brush, randomized brush, texture brush, eraser, fill.

**World:** biome painter, parallax editor, lighting editor, weather controller, camera zones, background transitions.

**Testing:** play from selected position, spawn test enemies, boss test mode, NPC dialogue test, collision visualization, trigger debugging, performance profiler.

### 9.5 Event and logic editor

Creators build interactive events without code.

Example: **Secret Boss Room**

| Part | Value |
| --- | --- |
| Trigger | Player enters secret chamber |
| Condition | All three seals are activated |
| Action | Open boss chamber and activate arena music |

Supported events: player enters area, interacts with object, enemy defeated, boss defeated, timer completed, item collected, NPC dialogue completed, button activated, door opened, wave completed, health threshold reached.

---

## 10. Interactive NPC system

NPCs are part of gameplay, not dialogue decoration.

### 10.1 NPC categories

| NPC | Function |
| --- | --- |
| Blacksmith | Upgrade weapons |
| Merchant | Buy and sell equipment |
| Archivist | Lore and journal |
| Engineer | Tower upgrades |
| Alchemist | Craft consumables |
| Hunter | Bounty missions |
| Cartographer | Reveal map secrets |
| Summoner | Companion management |
| Alien Researcher | Alien progression |
| Wandering Trader | Randomized shop |

### 10.2 Interaction features

- Dialogue trees.
- Multiple conversation options.
- NPC schedules.
- Quest progression.
- Reputation.
- Friendship levels.
- Shop inventory.
- Item exchange.
- NPC-specific missions.
- Secret dialogue.
- World-state reactions.

### 10.3 NPC quest examples

| Quest | Objective | Reward |
| --- | --- | --- |
| **The Lost Blacksmith** | Find three ancient forging materials | Legendary weapon crafting |
| **The Cartographer's Debt** | Discover hidden rooms across five regions | Map reveal, fast-travel discount |
| **The Alien Researcher** | Collect alien samples and complete research missions | Alien Mode upgrades |
| **The Tower Commander** | Complete defense missions | New tower specializations |
| **The Hatter's Tea Party** | Find three impossible teacups in the Wonderland | Wonderland charm, secret dialogue |

### 10.4 Friendship and schedules

Friendship levels unlock dialogue, cosmetics, lore, and daily stock. Friendship never gates power. NPCs have daily routines, faction ties, and comments on the player's progress.

---

## 11. Alien Mode

Alien Mode is a post-game unlock with new mechanics, enemies, environments, equipment, and progression.

### 11.1 Lore

A mysterious extraterrestrial signal spreads through the world's ancient structures. It comes from a dimension called **The Outer Hive**. The signal is connected to a civilization that existed before the Ashen Kingdom.

### 11.2 Alien regions

1. Bio-Mechanical Landing Zone.
2. Parasite Forest.
3. The Living Hive.
4. Gravity Collapse.
5. The Xeno Laboratory.
6. The Forgotten Starship.
7. The Outer Hive Core.

### 11.3 Alien enemies

| Enemy | Behaviour |
| --- | --- |
| **Xeno Drone** | Fast-moving alien creature |
| **Hive Stalker** | Mobile ambush creature |
| **Void Brute** | Heavy armored opponent |
| **Rift Crawler** | Space-distorting creature |

### 11.4 Alien-specific mechanics

- Gravity inversion zones.
- Organic terrain.
- Alien energy.
- Living doors.
- Biological switches.
- Temporary mutation effects.
- Unstable portals.
- Environmental anomalies.
- Alien equipment crafting.
- Research progression.

### 11.5 Alien equipment

- Xeno Blade.
- Bio-Cannon.
- Plasma Staff.
- Hive Armor.
- Parasite Ring.
- Gravity Core.
- Rift Amulet.
- Neural Implant.

### 11.6 Alien research tree

| Upgrade | Effect |
| --- | --- |
| Xeno Resistance | Improved alien environmental resistance |
| Neural Adaptation | New utility interactions |
| Gravity Control | Additional movement options |
| Bio-Weapon Mastery | Alien weapon specialization |
| Hive Knowledge | Reveals hidden alien structures |
| Rift Synchronization | Unlocks additional portal interactions |

### 11.7 Alien Mode variants

- Alien Campaign.
- Alien Survival.
- Alien Boss Rush.
- Alien Tower Defense.
- Alien Endless.
- Alien Challenge Rooms.
- Alien Custom Maps.

---

## 12. Equipment, weapons, relics, and crafting

### 12.1 New weapon classes

- Greatswords.
- Dual blades.
- Spears.
- War hammers.
- Scythes.
- Crossbows.
- Magical staffs.
- Whips.
- Chakrams.
- Alien bio-weapons.

Each class gets basic attacks, charged attacks, unique combos, weapon mastery, special abilities, weapon-specific animations, and weapon-specific upgrades.

### 12.2 Relic system

Relic rarities: Common, Uncommon, Rare, Epic, Legendary, Mythic, Ancient.

Relics modify combat, mobility, healing, defense, tower performance, exploration, summoning, and alien abilities. Relic sets reward collecting compatible items.

### 12.3 Crafting

| Station | Purpose |
| --- | --- |
| Blacksmith Forge | Weapons and armor |
| Arcane Altar | Enchantments and infusions |
| Relic Workbench | Relic crafting and fusion |
| Tower Engineering Table | Tower parts and upgrades |
| Alien Bio-Laboratory | Alien equipment and research |

Crafting materials come from multiple activities, not one repetitive farming route.

---

## 13. Additional game modes

The game offers more replayable content after campaign completion.

| Mode | Rule | Reward |
| --- | --- | --- |
| **Endless Abyss** | Endless enemy waves with escalating difficulty | Milestone rewards, cosmetics |
| **Boss Rush** | Fight unlocked bosses in succession | Boss themes, titles |
| **Rogue Expedition** | Randomized rooms, equipment, and temporary builds | Meta-upgrades, cosmetics |
| **Castle Siege** | Protect a fortress with towers and player combat | Tower materials, titles |
| **Daily Trials** | Rotating challenges with special rules | Daily track, cosmetics |
| **New Game+** | Carry gear and levels; enemies scale | NG+ dialogue, titles |
| **Nightmare Campaign** | Remixed campaign with modifiers | Exclusive cosmetic |
| **Time Attack** | Per-room and full-run timers | Titles, frames |
| **Exploration Completion** | 100% map and secret completion | Map trophy, lore |
| **Tower Ascension** | Randomized tower floors and modifiers | Tower cosmetics |
| **Custom Challenge** | Player-authored rules and seeds | Community badges |
| **Alien Invasion** | Alien enemies invade existing zones | Alien research |
| **Random Boss Encounter** | A boss ambushes a normal room | Bonus loot |

**Mode rules:**

- Each mode uses a separate run save or slot as appropriate. Hardcore is always isolated; a death never deletes account-wide unlocks.
- No mode grants combat power the campaign cannot earn. Rewards are cosmetics, titles, and lore.
- Leaderboards are server-authoritative. Suspicious runs are flagged for review, not silently deleted.
- Accessibility options apply in every mode.
- Pause, quit, and continue are explicit. A mode that cannot be paused is labelled before entry.
- No entry fee, no pay-to-win, no loot boxes.

---

## Part II — Production Foundations and The Spire of Oaths (Sections 14–27)

> Sections 14–23 are the production, platform, and live-service foundation. Sections 24–27 are the **Spire of Oaths** expansion: five vertical Spires, a secret black-and-white level, new modes, the Rift Gate event portal, talking bosses, layered boss music, a full sound and presentation pass, and a finishable priority order.

### What Part II adds

| Layer | Addition | Why it matters |
| --- | --- | --- |
| Vertical content | Five climbable Spires, one per biome | Turns the room list into a mastery ladder |
| World size | ~50 base rooms, 25–30 Spire floors, and 4 Hush rooms | A campaign-sized world |
| Secret content | The Hush Between, unlocked by 5 Vow Fragments | Rewards exploration and full clears |
| Replayability | New Game+, Boss Rush, Ashen Descent, Time Trial, Hardcore, Daily Challenge, Practice Arena | Gives every player a reason to return |
| Live layer | Rift Gate daily, weekly, and seasonal events plus Blood Moon | A cadence the live-service plan can run on |
| Presentation | Talking bosses, layered music, sound pass, parallax v2, animation | Makes the expansion feel like a sequel |

---

## 14. Asset pipeline and content library

The expansion needs a unified asset library rather than individually hardcoded objects.

### 14.1 Asset categories

| Category | Contents |
| --- | --- |
| Terrain tilesets | Ground, platforms, slopes, walls, decorations |
| Enemy sprites | Idle, walk, attack, hit, death |
| Boss assets | Models, animation sets, arena objects |
| Backgrounds | Multi-layer parallax and scenery |
| Equipment | Weapons, armor, relics, crafting materials |
| Visual effects | Magic, particles, weather, combat |

### 14.2 Asset metadata

Every asset contains:

- Unique asset ID.
- Display name.
- Asset category.
- Asset version.
- Region compatibility.
- Unlock requirements.
- Collision information.
- Animation references.
- Editor compatibility.
- Performance classification.

### 14.3 Asset variants

Support normal, damaged, corrupted, frozen, burning, ancient, alien, animated, and seasonal variants. Variants reuse the underlying asset; they do not duplicate it.

### 14.4 Pipeline rules

- One canonical asset registry shared by campaign, editor, and codex.
- No hardcoded paths in rooms; rooms reference asset IDs.
- Every asset has a fallback and a missing-asset test.
- Every animation has a reduced-motion variant or a static fallback.
- Asset budgets are enforced in CI: texture memory, draw calls, and particle caps.

---

## 15. World events and dynamic encounters

The world feels alive through random events that appear while exploring.

| Event | Description |
| --- | --- |
| Wandering Merchant | Temporary merchant encounter |
| Lost Expedition | Rescue or assist explorers |
| Corruption Surge | Increased corrupted enemy activity |
| Tower Emergency | Defend an attacked tower |
| Alien Breach | Temporary alien portal |
| Ancient Treasure | Hidden reward encounter |
| Traveling Boss | Optional special boss encounter |
| NPC Distress Signal | Quest opportunity |
| Rift Storm | Environmental anomaly |
| Tea Party | Wonderland-only event with a hidden reward |

Events are randomized using region, progression, difficulty, and cooldown conditions. A **world event journal** tracks encountered and completed events. Events never block the critical path.

---

## 16. Map editor publishing and community

The editor expands beyond personal experimentation.

### 16.1 Publishing tools

- Save multiple maps.
- Map descriptions.
- Custom thumbnails.
- Map categories.
- Difficulty tags.
- Recommended loadouts.
- Required unlocks.
- Version history.
- Map validation.
- Local export/import.
- Creator profile.
- Ratings and favorites.

### 16.2 Map types

- Exploration maps.
- Boss arenas.
- Tower defense maps.
- Survival maps.
- Puzzle maps.
- Platforming challenges.
- Alien maps.
- Campaign-inspired maps.

### 16.3 Map validation

Before publishing, automatically check:

- Player spawn availability.
- Reachability of required objectives.
- Missing collision.
- Unreachable exits.
- Boss configuration.
- Invalid triggers.
- Required assets.
- Excessive object counts.
- Performance budgets.

A sandbox testing mode plays the map before publishing.

### 16.4 Moderation and safety

- Report and block tools.
- No executable content in shared maps.
- Asset whitelist; no external URLs.
- Creator display names are moderated.
- Uploads are scanned for invalid data before they appear in the browser.

---

## 17. UI/UX and elemental system overhaul

> **This is the "FIX UI, Element" section.** It audits the current screens, specifies the fixes, and defines the elemental system the HUD must display.

### 17.1 UI audit — current screens and fixes

| Screen | Current problem | Fix |
| --- | --- | --- |
| Main menu | Mixed Indonesian and English labels; no single source of truth | One string table; language switch; consistent title case |
| Level Select | No briefing; locked rooms only show Sneak Peek; no filters | Add **Level Briefing** panel (objectives, rewards, controls tab); add filters and completion badges |
| Codex | Four text tabs; no search; detail pane cramped | Add icons, search, filters, a detail pane, and a "compare" view |
| Map | Pins and tooltips are mouse-first; fog legend is small | Add keyboard/gamepad focus, a list view, a larger legend, and pin notes |
| Settings | Keybind conflicts are unclear; no reset per device | Add a conflict dialog with swap/cancel, reset-to-default, and keyboard/gamepad profiles |
| HUD | Bars lack numbers; status effects have no icons | Add numeric health/resource, status icons with timers, and a boss phase pip row |
| Pause / Death / Victory | Inconsistent return paths | One shared result panel with Retry, Level Select, and Main Menu |
| Character select | Preview and stats are separated | Show stats beside the preview; add a "randomize" and "reset" button |
| Shop | Item comparison is missing | Add stat deltas, owned state, and a confirm step |
| Mobile (390×844) | Some panels overflow horizontally | Scrollable panels, 44px touch targets, safe-area padding, no fixed widths |

### 17.2 Navigation and focus

- Every menu is reachable with keyboard, gamepad, and touch.
- A visible focus ring on every interactive element.
- Focus order follows reading order; no focus traps.
- `Esc` always backs out one level, never quits by accident.
- `I` opens the Inventory and its Controls tab; `M` opens the map; `J` attacks; `U`/`V` ability; `K`/`X` throws a shuriken; all rebindable.
- A **Controls tab** lives inside the Inventory screen and the Level Briefing, so the player never needs the main menu to check a key.
- The Level Briefing opens when a level is clicked, before deployment.

### 17.3 HUD and readability

- Health and resource bars show current/max numbers.
- Status effects show an icon, a stack count, and a remaining-time ring.
- Elemental damage shows the element icon next to the number.
- Boss health shows name, phase pips, and a resistance icon.
- Off-screen threats use a directional cue and a caption.
- The HUD scales with text size and never overlaps the safe area.
- Colourblind mode adds shapes and patterns, not just colour changes.

### 17.4 Elemental system

Eight elements, each with a status effect, a resistance profile, and a UI identity.

| Element | Colour | Status | Effect | Strong vs | Weak vs |
| --- | --- | --- | --- | --- | --- |
| **Ember** | Orange | Burn | Damage over time; ignites oil | Plant, ice, rot | Tide, crystal |
| **Frost** | Cyan | Chill → Freeze | Slow, then immobilize | Magma, clockwork | Ember, storm |
| **Storm** | Violet | Shock | Chain damage; interrupts | Metal, water, flying | Crystal, earth |
| **Venom** | Green | Poison | Stacking damage; healing reduction | Living, regenerative | Clockwork, undead |
| **Crystal** | Pink | Shatter | Armor break; brittle | Armor, constructs | Storm, ember |
| **Void** | Purple-black | Corrode | Disables barriers and summons | Barriers, summons | Radiance, crystal |
| **Radiance** | Gold | Blind | Accuracy down; reveals hidden | Undead, wraiths | Void, shadow |
| **Alien** | Teal | Warp | Random teleport; gravity flip | Organic, gravity | Radiance, crystal |

**Reactions:**

| Reaction | Combination | Effect |
| --- | --- | --- |
| Toxic Flare | Ember + Venom | Area burst; spreads poison |
| Supercell | Frost + Storm | Freeze and shock nearby enemies |
| Chain Shard | Crystal + Storm | Crystal shards chain between targets |
| Eclipse | Radiance + Void | Cancels both; briefly exposes weak points |
| Rift Fracture | Alien + Crystal | Gravity well; pulls enemies |
| Steam Veil | Frost + Ember | Blind cloud; breaks line of sight |
| Purge | Venom + Radiance | Cleanses poison and damages undead |

**Rules:**

- Physical damage is always viable; no enemy is immune to it.
- Elemental damage is a multiplier and a utility layer, not a gate.
- Resistances are visible in the bestiary and on the enemy health bar.
- Weapon infusions add an element without removing physical scaling.
- The player can swap infusions at a shrine; no consumable tax.
- Elemental VFX are reduced or simplified under reduced-motion and flash-reduction settings.

### 17.5 Accessibility

- Full key and controller remapping.
- UI scaling and text scaling that reflow, not clip.
- Colourblind palettes with shape/pattern backups.
- Reduced screen shake, reduced particles, reduced flashes.
- Optional damage indicators and attack telegraphs.
- Adjustable combat difficulty and assist options.
- Pause and menu accessibility.
- Screen-reader labels for HUD resources and menu items.
- No horizontal overflow at 390×844; all menus scroll.

### 17.6 Acceptance criteria

- Every screen is reachable and exitable with keyboard, gamepad, and touch.
- No text is clipped at 200% text size.
- The HUD shows health, resource, weapon, ability cooldowns, status effects, and boss phase.
- The elemental chart is visible in the codex and the Level Briefing.
- Every status effect has an icon, a timer, and a tooltip.
- A colourblind player can distinguish every zone, element, and rarity without colour alone.

---

## 18. Technical architecture and optimization

### 18.1 Modular architecture

```
ASHEN_VOW/
├── Core/            GameManager, SaveManager, SceneManager, EventBus, SettingsManager
├── Gameplay/        CombatSystem, EnemySystem, BossSystem, TowerDefenseSystem, NPCSystem
├── Progression/     SkillTreeSystem, MasterySystem, PrestigeSystem, LoadoutSystem
├── World/           WorldMap, RegionManager, LevelManager, BiomeManager, WorldEventManager
├── AlienMode/       AlienWorld, AlienEnemySystem, AlienResearch, AlienEquipment
├── Editor/          TerrainEditor, ObjectEditor, BossEditor, NPCEditor, LogicEditor, MapValidator
├── Content/         Assets, Enemies, Bosses, Weapons, Relics, Towers, NPCs
└── UI/              HUD, Inventory, Loadouts, SkillTrees, MapEditor, Menus
```

The existing zero-build ES-module structure stays. New systems are modules, not a second engine.

### 18.2 Performance optimization

- Object pooling for enemies, projectiles, particles, and damage numbers.
- Enemy AI update scheduling (staggered ticks, not every enemy every frame).
- Culling outside camera bounds.
- Sprite atlas batching.
- Asset streaming and lazy-loaded menus.
- Efficient collision checks and spatial partitioning.
- Cached pathfinding.
- Event-driven UI updates.
- Background asset loading.
- Memory cleanup when changing regions.

### 18.3 Map editor performance

- Chunk-based terrain rendering.
- Visible-object culling.
- Virtualized asset browser.
- Asynchronous thumbnail generation.
- Efficient undo/redo history.
- Incremental map saving and autosave.
- Dirty-region updates.
- Object limits with configurable warnings.

### 18.4 Save compatibility

Critical requirement: existing saves must not be corrupted.

- Versioned save files.
- Migration routines.
- Backup saves.
- Transactional save operations.
- Asset reference validation.
- Unlock-state reconciliation.
- Recovery from interrupted saves.
- The boss editor reads the canonical campaign boss completion record, not a duplicate list.

---

## 19. Stress testing and QA

Every major subsystem gets its own test suite.

| System | Required tests |
| --- | --- |
| Campaign | Region transitions and progression |
| Combat | Damage, attack timing, status effects |
| Enemies | AI behavior and large encounters |
| Bosses | Phase transitions and rewards |
| Towers | Targeting, waves, and upgrade branches |
| Loadouts | Equipment compatibility and saving |
| Skill trees | Point spending and reset behavior |
| Prestige | Progression and reward persistence |
| Map editor | Large maps and object limits |
| NPCs | Dialogue and quest state |
| Alien Mode | Biome transitions and research |
| Save system | Migration and recovery |

### 19.1 Performance test scenarios

- Small encounter.
- Medium encounter.
- Large enemy wave.
- Multiple towers firing.
- Boss plus additional enemies.
- Large custom map.
- Multiple animated environmental objects.
- Heavy particle effects.
- Large asset library.
- Repeated region transitions.

Set measurable targets on the actual target hardware, then profile frame time, memory, CPU, GPU, and loading latency.

### 19.2 Automated regression

1. Defeat a boss in the campaign.
2. Return to the main menu.
3. Open the map editor.
4. Verify the boss is unlocked.
5. Place the boss in a custom map.
6. Save the map.
7. Reload the map.
8. Verify the boss configuration persists.
9. Run the boss encounter.
10. Verify the custom encounter does not overwrite campaign boss state.

### 19.3 Browser smoke

- Boot, menus, each zone entry, both endings.
- 390×844 portrait: no horizontal overflow, all menus scroll.
- No console errors.
- `window.__ashen` exposes the state the tests need.

---

## 20. Expansion roadmap

Build in phases rather than introducing everything simultaneously.

| Phase | Goal | Exit criteria |
| --- | --- | --- |
| 1. Existing systems audit | Inspect architecture, document features, audit saves, baseline performance | A written audit and a content registry |
| 2. World expansion | New regions, levels, tower landmarks, environmental mechanics | One new region playable end-to-end |
| 3. Enemy and boss expansion | New roster, elites, phase framework, rematches, journal | Every new boss has phases and a journal entry |
| 4. Loadout 2.0 | Slots, presets, synergies, mastery, comparison | A player can save and reload a build |
| 5. Skill trees 2.0 | New branches, currencies, mastery trials, prestige | Points spend and reset correctly |
| 6. Tower defense | Construction, branches, units, waves, campaigns | One defense mission is fun and save-safe |
| 7. Map editor 2.0 | Terrain scaling, boss unlock, NPCs, logic, validation | A custom boss map survives reload |
| 8. NPC and quest expansion | Dialogue trees, reputation, quests, shops, crafting | One quest chain is completable |
| 9. Alien Mode | Regions, enemies, bosses, equipment, research | Alien Mode is playable from unlock to boss |
| 10. Additional modes | Endless, Boss Rush, Rogue, Castle Siege, Daily, NG+ | Every mode has a save and a leaderboard |
| 11. UI and asset optimization | UI redesign, asset pipeline, animation, accessibility | The UI audit passes |
| 12. Final QA and release | Regression, stress, migration, balance, bugs | Definition of done met |

---

## 21. Additional features and live operations

These systems add replayability without becoming chores.

| Feature | Description |
| --- | --- |
| Living World | Region states change after important events |
| Nemesis System | Certain elite enemies return with different traits |
| Relic Fusion | Combine compatible relics |
| Weapon Evolution | Weapons develop through mastery |
| Boss Memories | Replay boss encounters with altered conditions |
| Hidden Archives | Collect lore and historical records |
| Companion System | Recruit support companions |
| Mount System | Unlock special traversal companions |
| Challenge Modifiers | Customize enemy and world difficulty |
| Dynamic Weather | Rain, storms, ashfall, and fog |
| Secret Rooms | Procedurally selected hidden rooms |
| Tower Defense Heroes | Upgradeable defensive characters |
| Bounty Board | Repeatable NPC contracts |
| Map Templates | Prebuilt layouts for map creators |
| Custom Boss Arena | Build and save dedicated boss arenas |
| Region Mastery | Region-specific completion rewards |
| Achievement Codex | Track hidden and visible achievements |
| Seasonal Events | Halloween, winter, and special events |
| Daily Rotations | Rotating challenges and rewards |
| Bestiary | Detailed enemy and boss records |

### 21.1 Live operations

- **Seasons:** 10–12 weeks, with a free track and a cosmetic-only paid track.
- **Events:** daily, weekly, and seasonal. Seasonal events last 6–8 weeks and return yearly.
- **Cadence:** one major content drop per quarter, one smaller event per month, one community challenge per week.
- **No FOMO:** every gameplay reward returns through the event archive or a later event. No reward is pay-only.
- **Offline respect:** the game is fully playable offline; live events are optional.
- **Server time:** reward claims validate on the server; the platform clock is a display fallback.
- **Anti-cheat:** leaderboards are server-authoritative; suspicious runs are reviewed, not silently deleted.
- **Content archive:** past events, trailers, and lore remain accessible in the Codex.

---

## 22. Final target experience

The final Ashen Vow experience has four interconnected gameplay loops.

1. **Exploration loop:** explore regions → discover secrets → defeat bosses → unlock abilities.
2. **Progression loop:** collect resources → upgrade skills → improve loadouts → master builds.
3. **Defense loop:** collect materials → construct towers → defend locations → unlock upgrades.
4. **Creation loop:** unlock assets → build custom maps → test encounters → share creations.

### 22.1 Implementation priorities

1. Map Editor 2.0, especially campaign boss unlock integration.
2. Loadout 2.0, with presets, equipment combinations, and mastery.
3. Skill Tree 2.0, including grindable skill points and prestige.
4. World expansion, including new regions, towers, and exploration.
5. Enemy and boss expansion, with reusable phase mechanics.
6. Tower defense, with branching upgrades and defensive heroes.
7. Interactive NPCs, quests, crafting, and reputation.
8. Alien Mode, with its own biome, progression, and equipment.
9. Additional game modes, including endless, boss rush, and survival.
10. Optimization and QA, ensuring everything works together.

### 22.2 Design principle

Ashen Vow remains a cohesive Metroidvania first. Tower defense, Alien Mode, progression, and the map editor expand the original identity rather than turning the game into several disconnected systems.

The end result is a game with a large interconnected world, meaningful long-term progression, extensive build customization, repeatable challenges, and a powerful creative mode that lets players create their own Ashen Vow experiences.

---

## 23. Team, production gates, and immediate next steps

### 23.1 Team and resources

| Role | Responsibility | Notes |
| --- | --- | --- |
| Creative director | Vision, pillars, scope | One owner for cut decisions |
| Gameplay engineer | Core simulation, combat, bosses | `src/core.js` stays pure |
| Systems engineer | Save, settings, map, editor | Migrations and tests |
| Content designer | Rooms, zones, enemies, loot | Data tables, not scripts |
| Technical artist | Sprites, animation, VFX, parallax | Budgets and variants |
| Audio designer | Music, SFX, mix | Procedural and recorded layers |
| QA / tools | Node tests, CDP, editor validation | Regression gates |
| Community / live ops | Events, moderation, roadmap | Ethical live service |

A small team can ship the expansion in phases. Contractors cover animation, music, and voice; the core team owns systems and content grammar.

### 23.2 Production gates

| Gate | Requirement | Evidence |
| --- | --- | --- |
| G0 — Audit | Architecture, saves, performance baselines documented | Audit doc, content registry |
| G1 — Vertical slice | One new region + one Spire floor + one boss | Playable build, tests |
| G2 — Systems | Loadouts, skills, editor boss unlock | Save/reload tests |
| G3 — Content | All story regions and bosses | Completion matrix |
| G4 — Presentation | Dialogue, music, sound, parallax, animation | Mix and readability pass |
| G5 — Release | Definition of done, QA matrix, migration | Signed checklist |

### 23.3 First 30 days

1. Run the existing systems audit and freeze the v1.0 scope.
2. Lock the room, zone, boss, and dialogue schemas.
3. Build the content registry and the asset fallback test.
4. Prototype the Wonderland Size Shift in `src/core.js` with Node tests.
5. Greybox one Spire floor and one defense room.
6. Implement the Level Briefing and Controls tab.
7. Add the elemental status framework and the HUD icons.
8. Write the save migration fixture for the expansion.
9. Record the first boss dialogue set and the first layered theme.
10. Playtest the vertical slice with five external players.

### 23.4 Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scope creep | Missed date, burnout | Phase gates, cut list, ship in two drops |
| Save drift | Lost progress | Versioned schema, backup, fixture tests |
| Tower defense dilutes the Metroidvania | Identity loss | Optional defense rooms, never the critical path |
| Editor complexity | Bugs, performance | Validation, budgets, sandbox mode |
| Content cost | Empty regions | Reuse room grammar, one unique mechanic per region |
| Live-service pressure | Crunch, FOMO | Fixed cadence, content archive, no pay-to-win |

---

## 24. The Five Spires and the vertical world

**Goal:** add a vertical mastery layer that reuses the combat verbs and room grammar of the core game. Each Spire is a 5–7 floor climb with one dominant floor mechanic, a Peak Trial at the top, a guardian, a permanent reward, and a Vow Fragment.

### 24.1 The five Spires

The Spires rise from the five v1.0 biomes: **Ashen Hall**, **Mycelial Hollow**, **Tidewrought Cistern**, **Frostglass Cathedral**, and **Cinder Maw**. They are visible from the hub, grow closer as the player clears each biome, and form a vertical map layer above the room map.

| Spire | Biome | Floors | Floor mechanic | Peak Trial | Permanent reward | Guardian |
| --- | --- | --- | --- | --- | --- | --- |
| **Spire of the First Vow** | Ashen Hall | 5 | **Ember Tide:** fire rises from the bottom every 60 seconds; ash wind pushes; burning banners collapse | **The Last Step:** climb a collapsing spiral while the Spire burns | **Cinderstep:** dash leaves a short ember trail that burns enemies | **The Ash Herald** |
| **Spire of the Mycelial Vow** | Mycelial Hollow | 6 | **Spore Tide:** spores rise and burst; trampolines shift; walls bloom and close | **The Brood Ascent:** climb while the brood wakes beneath you | **Mycelial Cling:** cling to walls and climb stamina-limited surfaces | **The Mycelial Matriarch** |
| **Spire of the Tide Vow** | Tidewrought Cistern | 6 | **Rising Water:** water rises on a timer; valves redirect currents; electrified water | **The Flooded Crown:** survive three flood waves while the Spire drains | **Tidewalker:** move and dash freely in water; longer breath | **The Tide Regent** |
| **Spire of the Frost Vow** | Frostglass Cathedral | 5 | **Mirror Cold:** ice mirrors rotate; shatter zones; cold drains stamina | **The Mirror Spiral:** climb a rotating mirror while clones copy your moves | **Glassstep:** dash through mirrors and shatter them | **The Mirror Saint** |
| **Spire of the Cinder Vow** | Cinder Maw | 7 | **Warlord's Decree:** each floor imposes a law announced by a banner (no healing, no ranged, heavy weapons only, kill order) | **The Throne of Ash:** duel the guardian on a collapsing throne | **Last Vow:** once per run, revive at 50% HP; recharges at the start of each run; cannot be stacked or farmed | **The Cinder Muse** |

**Total:** 29 Spire floors, five guardians, five Vow Fragments, and five permanent rewards.

### 24.2 Spire structure and floor grammar

Every Spire follows the same readable grammar:

1. **Entry floor:** teach the floor mechanic in a safe room.
2. **Combat floor:** apply the mechanic under pressure.
3. **Traversal floor:** test movement and timing.
4. **Elite floor:** combine the mechanic with an elite enemy.
5. **Rest floor:** checkpoint, flask refill, NPC, shop.
6. **Peak Trial:** the final exam.
7. **Guardian arena:** the boss.

Checkpoints are at the entry and the rest floor. A death returns to the last checkpoint, not the Spire entrance. A cleared floor unlocks a shortcut from the hub.

### 24.3 Floor mechanics in detail

**Spire of the First Vow — Ember Tide.** Fire rises from the bottom every 60 seconds. The player must climb before the fire plane reaches them. Ash wind pushes horizontally; burning banners collapse and create temporary bridges. Counterplay: read the ember gauge, use the wind to extend jumps, and cut banners early to create safe platforms.

**Spire of the Mycelial Vow — Spore Tide.** Spores rise in waves and burst into damaging clouds. Trampolines shift position every wave. Walls bloom and close, opening new routes. Counterplay: time the trampolines, clear spores with a dash, and use the climbable mycelium before it retracts.

**Spire of the Tide Vow — Rising Water.** Water rises on a timer. Valves redirect currents and open drains. Electrified water is lethal. Counterplay: plan the valve route, use the currents to move faster, and reach the drain before the water covers the floor.

**Spire of the Frost Vow — Mirror Cold.** Ice mirrors rotate and reflect attacks. Shatter zones break under weight. Cold drains stamina. Counterplay: use mirrors to redirect projectiles, dash through shatter zones before they collapse, and warm up at braziers.

**Spire of the Cinder Vow — Warlord's Decree.** Each floor begins with a banner that announces a law: *No healing. No ranged. No dash. Heavy weapons only. Kill order. The floor is lava.* The law is visible before the floor starts, and one re-roll is available per floor at a shrine for a cost. Counterplay: adapt the loadout, use the environment, and save the re-roll for an impossible combination. Failure is a debuff and a score penalty, not instant death.

### 24.4 Peak Trials and permanent rewards

A **Peak Trial** is the Spire's final exam: a 2–4 minute sequence that combines the floor mechanic with the guardian. It has no checkpoints, one flask refill at the start, and a leaderboard for time, no-hit clears, and no-reward runs. After the first clear, the trial is replayable from the Practice Arena.

| Spire | Trial phases | Fail condition | Guardian | Permanent reward | Fragment |
| --- | --- | --- | --- | --- | --- |
| First Vow | Climb, vent gauntlet, rooftop duel | Caught by the fire plane three times | The Ash Herald | Cinderstep | First Vow Fragment |
| Mycelial Vow | Climb, spore waves, brood duel | Caught by three spore bursts | The Mycelial Matriarch | Mycelial Cling | Mycelial Vow Fragment |
| Tide Vow | Valve route, flood wave, drowned duel | Drowns twice or the water covers the arena | The Tide Regent | Tidewalker | Tide Vow Fragment |
| Frost Vow | Mirror climb, clone gauntlet, mirror duel | Shattered three times or falls from the mirror | The Mirror Saint | Glassstep | Frost Vow Fragment |
| Cinder Vow | Decree gauntlet, collapsing throne, final duel | Three decree violations or the throne collapses | The Cinder Muse | Last Vow | Cinder Vow Fragment |

### 24.5 Vow Fragments and the Hush gate

- Each guardian drops one **Vow Fragment** on first clear.
- The gate in **Balai Sumpah** has five sockets. Each socket fills with a fragment and plays a short memory of the Spire's guardian.
- The gate UI shows the fragments, the lore, an **Enter** button, and a warning: there is no return until the secret boss is defeated or the player dies. With fewer than five fragments, the button is disabled and names the missing Spire.
- Fragments are permanent. They survive New Game+, death, and save migration.
- Duplicates convert to Embers or a lore entry, so a second clear is never wasted.

### 24.6 Draft names and alternatives

All Spire and guardian names are drafts. The table below keeps the original draft names as alternatives for the War Update or a future rename.

| Role | Current draft | Alternatives |
| --- | --- | --- |
| First Spire | Spire of the First Vow | Spire of the Ash Oath, The First Tower |
| Mycelial Spire | Spire of the Mycelial Vow | Spire of the Brood, The Blooming Spire |
| Tide Spire | Spire of the Tide Vow | Spire of the Drowned Crown, The Floodgate |
| Frost Spire | Spire of the Frost Vow | Spire of the Mirror, The Glass Spire |
| Cinder Spire | Spire of the Cinder Vow | Spire of the Last Vow, The Throne Spire |
| First Guardian | The Ash Herald | The Bannerless, The Ember Herald |
| Mycelial Guardian | The Mycelial Matriarch | The Brood Mother, The Spore Queen |
| Tide Guardian | The Tide Regent | The Tidewright Ascendant, The Drowned King |
| Frost Guardian | The Mirror Saint | The Glass Saint, The Frozen Choir |
| Cinder Guardian | The Cinder Muse | The Last Vowkeeper, The Ashen Warlord |
| Secret Boss | The Unspoken | The Hush, The Quiet One |

---

## 25. Rooms, The Hush Between, modes, and the Rift Gate

### 25.1 The ~50-room world and new room types

The base world grows to **about 50 rooms** across the hub, five biomes, story routes, and secrets. The five Spires add **25–30 modular floors**, and The Hush Between adds **4 rooms**. Part III then adds **~45 war rooms and 10 arenas**.

| Layer | Rooms | Contents |
| --- | --- | --- |
| Base world | ~50 | Hub, five biomes, story, secrets, shops, rest rooms |
| Spires | 25–30 | Modular floors, Peak Trials, guardian arenas |
| The Hush Between | 4 | Secret level, archive, secret boss |
| War Update (Part III) | ~45 + 10 arenas | Five war zones, arenas, Bazaar |

**Room types:**

| Type | Purpose | Example |
| --- | --- | --- |
| Combat | Standard encounter | Ashen Hall courtyard |
| Traversal | Movement challenge | Mycelial trampoline shaft |
| Puzzle | Ability or logic test | Frostglass mirror hall |
| Rest | Checkpoint, flask, save | Balai Sumpah antechamber |
| Shop / NPC | Spend resources and talk | Warung Abu booth |
| Boss / arena | Climax with phases and dialogue | Spire guardian, The Unspoken |
| Secret | Hidden reward or lore | Breakable wall alcove |
| Event | Daily, weekly, or seasonal | Rift Gate challenge |
| Hub / social | Safe space, portals, NPCs | Balai Sumpah |
| Tower floor | Spire climb | Spire of the First Vow, floor 3 |
| Hush room | Monochrome secret | The Grey Gardens |

**Room grammar:** every room has an entry beat, a combat or traversal beat, a reward or reveal, and an exit. Rooms reuse a small set of templates (entry, combat, traversal, puzzle, rest, boss) so new content does not require bespoke scripting.

**Room data example:**

```json
{
  "id": "spire_first_03_ember_tide",
  "zone": "spire_first_vow",
  "type": "tower_floor",
  "beat": "test",
  "mechanic": "ember_tide",
  "enemies": ["ashbound", "siege_thrall"],
  "secrets": 1,
  "checkpoint": false,
  "next": ["spire_first_04"]
}
```

**Scope rule:** if the 50-room target must include the Spires, ship 30 base rooms plus 20 Spire floors (50 before the Hush), and move the remaining rooms to a later update rather than Part III's war-room budget. The priority order in Section 27.5 decides; the room count is a budget, not a promise.

### 25.2 The Hush Between (secret level)

**Unlock:** collect all five Vow Fragments and interact with the five-socket gate in Balai Sumpah. The gate warns that there is no return until the secret boss is defeated or the player dies.

**The level is black and white.** Colour drains from the world. The HUD, VFX, and damage numbers are monochrome except for the intentional colour-return moments: taking damage, picking up a reward, and the final hit. There is no music, only ambience and the player's footsteps.

**Rooms (4):**

| # | Room | Purpose |
| --- | --- | --- |
| 1 | **The Threshold** | A quiet antechamber. The five fragments speak in the guardians' voices. |
| 2 | **The Grey Gardens** | Monochrome versions of the five biomes. Stealth, light puzzles, and Silent enemies. The First Vow's memory plays here. |
| 3 | **The Quiet Archive** | Lore room. The five fragments speak again. The player chooses one of three responses; each response sets a different seal order for the secret boss's final phase. |
| 4 | **The Unspoken's arena** | A black-and-white arena with no music. The boss fight. |

**Silent enemies:** they do not attack on sight. They follow sound. The player must walk, not dash, and use thrown objects to distract them. Light reveals safe paths; darkness hides secrets.

**The Unspoken:** a three-phase secret boss that speaks in single words, text only. It has no music. Its attacks are silence waves, memory echoes, and a final phase that uses the player's own build against them.

**Reward:** the **Hush Sigil** for the Oath Index, a monochrome outfit, a charm that reveals hidden paths, and a lore entry that changes the epilogue. The Hush Sigil is not a sixth Vow Fragment; the five-fragment gate remains the only key.

**Persistence:** the Hush unlock, the Quiet Archive choice, and the Hush Sigil persist across reload, New Game+, and save migration.

**Acceptance:**

- The gate opens only with five fragments; the button is disabled otherwise and names the missing Spire.
- The level is monochrome except for the intentional colour-return moments; no other colour leaks from UI, VFX, or damage numbers.
- The Unspoken has three phases, text-only dialogue, and no music.
- The Quiet Archive choice sets the final-phase seal order and is recorded in the Oath Index.
- The Hush Sigil and the outfit persist across reload.

### 25.3 More modes

| Mode | Unlock | Rules | Leaderboard | Rewards |
| --- | --- | --- | --- | --- |
| **New Game+** | After clearing the second Spire (or any campaign ending) | Carry weapons, stats, charms, cosmetics; enemies gain +50% HP and damage; remixed Spires; new dialogue | Clear time, no-death | Cosmetics, titles, NG+ dialogue |
| **Boss Rush** | After the second Spire guardian | All bosses in the shipped content in sequence; flask refill between fights; no checkpoints; difficulty select | Time, no-hit, no-flask | Boss themes, titles, cosmetics |
| **Ashen Descent** | After the first Spire | Endless descent through combined rooms; one modifier per floor; bank Embers on death; weekly seed | Depth, weekly, class | Meta-upgrades, cosmetics |
| **Time Trial** | After clearing a zone | Per-room and full-run timers; ghost replay; splits | Per-room, full run | Titles, frames, no power |
| **Hardcore** | From the start, with a warning | One life; no checkpoint; no revive; death deletes the run save | Hardcore clear, class | Exclusive title and cosmetic |
| **Daily Challenge** | After the first Spire guardian | Fixed seed and loadout; one attempt per account per day | Daily | Daily track, cosmetics |
| **Practice Arena** | After the first boss | Replay any defeated boss with full flasks, no rewards | None | Training only |

**Mode rules:**

- Each mode uses a separate run save or slot as appropriate. Hardcore is always isolated; a death in Hardcore never deletes account-wide unlocks.
- No mode grants combat power that the campaign cannot earn. Rewards are cosmetics, titles, and lore.
- Leaderboards are server-authoritative. Suspicious runs are flagged for review, not silently deleted.
- Accessibility options apply in every mode. Practice Arena is the onboarding path for players who want to learn a boss before ranked play.
- Pause, quit, and continue are explicit. A mode that cannot be paused is labelled before entry.
- No entry fee, no pay-to-win, no loot boxes.

**New Game+ exception:** the global +50% enemy scaling does not stack onto Spire guardians. Each guardian instead replaces the raw buff with one extra phase mechanic, as specified in Section 25.3.

### 25.4 The Rift Gate

**Location:** Balai Sumpah. The Rift Gate is a physical arch of black stone and ember light. The Hall of Oaths is the social hub; the Bazaar of Embers (Part III) is its market wing, so the Rift Gate and the Bazaar share one physical space. The gate is the same one used by the War Update countdown in Section 29; that countdown is the **Dormant → Counting → Open → Claimed** subset of this state machine.

**States:**

| State | Visual | Interaction |
| --- | --- | --- |
| Dormant | Dark stone, no glow | Inspect: shows the next event and its unlock condition |
| Counting | Embers pulse in the cracks | Opens the event panel and countdown (days, hours, minutes, seconds) |
| Open | The arch is a ring of fire | Enter the event |
| Claimed | The fire settles to a low glow | Shows the reward and the next reset |
| Closed | Stone is cold | Shows the next event's start time |

**Countdown:**

- Uses server time for state and reward claims, with the platform clock as a display fallback, and shows the announced timezone. Offline players see the last known state.
- Never shows a fake or expired timer.
- When the countdown ends, the gate opens and the event becomes playable.
- The gate is a reusable component; Part III's War Update countdown is a special `RIFT_OPENING` event.

**Event cadence:**

- **Daily:** one run, fixed seed, 10–20 minutes; resets at 00:00 UTC.
- **Weekly:** a faction war, a Boss Rush seed, or an Ashen Descent seed; 30–45 minutes; a weekly track; resets Monday 00:00 UTC.
- **Seasonal event:** 6–8 weeks, running inside the 10–12-week ranked season; **Blood Moon**, **Emberfall**, or **Hush Week**; a story beat, an event shop, cosmetics, and a leaderboard. Seasonal events return yearly.

### 25.5 Blood Moon

- The sky turns red. The Cinder Maw changes: blood tides, blood altars, and a red moon that empowers beasts. This is the full seasonal expression of the Spire's local **Blood Moon** cycle.
- Enemies gain **Blood Frenzy:** faster attacks and a bleed on hit, but a clear visual tell.
- The **Blood Moon Emperor** awakens as the event's secret boss (Part III, Section 35). If Part II ships before Part III, the event uses the **Blood Moon Matriarch** variant; the Emperor replaces it when Part III lands.
- Event currency drops from bosses and daily challenges. The event shop sells cosmetics, a title, a music track, and a photo frame.
- **Anti-FOMO:** every reward returns in the next Blood Moon or through the event archive. No reward is pay-only. A catch-up currency is granted to players who miss a week.

### 25.6 Data and acceptance

- Event progress is saved in the v2 schema with a migration from the current save.
- The Rift Gate state machine is deterministic in Node.
- The gate UI is keyboard, gamepad, and touch accessible.
- The countdown is correct across timezones and reloads.
- No event blocks the campaign or the Hush.

---

## 26. Talking bosses and epic boss music

### 26.1 Dialogue system spec

**Two dialogue channels:**

| Channel | Use | Blocks gameplay? |
| --- | --- | --- |
| **Combat bark** | Mid-fight lines, phase taunts, low-HP warnings | No. Plays over combat; never pauses the simulation |
| **Scene line** | Intro, phase-break, defeat, first encounter | Yes, briefly. Skippable; the simulation freezes until dismissed |

**Triggers:** `intro`, `phase_break`, `low_hp`, `defeat`, `revive`, `summon`, `environment`, `repeat`, `secret`.

**Priority:** 100 intro/defeat, 80 phase break, 60 low HP, 40 combat bark, 20 ambient. A higher priority line interrupts a lower one; a boss attack tell always wins over dialogue audio.

**Rules:**

- One bark line at a time per boss; queue the rest with a 2-second cooldown.
- A line plays once per trigger unless `repeatable: true`.
- Conditions can gate a line by difficulty, faction, phase, player choice, or NG+ state.
- Every line is in a string table with speaker, portrait, duration, trigger, and audio ID.
- No line exceeds 12 words for combat barks; scene lines can run 2–3 sentences.
- The player can skip a scene line with `Space`/`Enter`/`Esc`; combat barks are never skippable because they do not block.
- Subtitles are on by default; the player can change size, background, and speaker colour.
- Localization uses the string table; never concatenate translated fragments.
- Alternate takes for repeat fights are a production target, not a placeholder.

**Data example:**

```json
{
  "id": "ash_herald_intro_01",
  "speaker": "ash_herald",
  "text": "You climb toward a fire that already knows your name.",
  "trigger": "intro",
  "phase": 0,
  "priority": 100,
  "duration": 3.5,
  "once": true,
  "skippable": true,
  "conditions": { "difficulty": "any", "faction": "any" },
  "audio": "vo_ash_herald_intro_01",
  "portrait": "ash_herald",
  "animation": "raise_banner"
}
```

**Acceptance:**

- No dialogue line can soft-lock a fight.
- Every boss has intro, phase-break, low-HP or final-phase, and defeat lines.
- Every line is skippable or non-blocking as appropriate.
- Subtitles match the audio and survive text scaling.
- The dialogue table is the only source of boss lines; no hardcoded strings in the renderer.

### 26.2 Sample lines for every boss

These are first-pass drafts. Combat lines stay under 12 words, and each line reveals character or stakes. The Unspoken speaks in single words and text only.

**v1.0 bosses**

**Sir Mordrake**
- Intro: "You kneel well for a dead man."
- Phase break: "The ash remembers every blade."
- Low HP: "I have died before. It did not take."
- Defeat: "Then the vow is yours. Keep it better than I did."

**Vhael**
- Intro: "The flame does not judge. It only eats."
- Phase break: "Burn with me, or burn first."
- Low HP: "Even embers bite."
- Defeat: "Ashes... to ashes..."

**The Oathbreaker**
- Intro: "You carry my vow. You do not deserve it."
- Phase 1 break: "Kneel."
- Phase 2 break: "The vow breaks here."
- Phase 3: "Then let the world burn with us."
- Low HP: "I am the vow you could not keep."
- Defeat: "Break it... or keep it... choose."

**The Sporebound**
- Intro: "The garden remembers your name."
- Phase break: "Bloom."
- Low HP: "Every root... a grave..."
- Defeat: "The spores... will remember..."

**The Tidewright**
- Intro: "The water was here before your oath."
- Phase break: "Drown."
- Low HP: "The tide... does not kneel..."
- Defeat: "Let it... flow..."

**The Glass Saint**
- Intro: "Look at yourself. Then look away."
- Phase break: "Every mirror is a door."
- Low HP: "Shatter me. See what reflects."
- Defeat: "A thousand... pieces..."

**Root of the First Vow**
- Intro: "You stepped on my roots."
- Phase break: "The garden defends itself."
- Low HP: "Still... growing..."
- Defeat: "Take the flask... grow..."

**The Forgotten Shield**
- Intro: "No one remembers the shield."
- Phase break: "Then remember this."
- Low HP: "I held the line..."
- Defeat: "Hold it... for me..."

**The Drowned Choir**
- Intro: "Sing with us."
- Phase break: "The hymn rises."
- Low HP: "Every voice... a wave..."
- Defeat: "The song... ends..."

**Spire guardians**

**The Ash Herald**
- Intro: "You climb toward a fire that already knows your name."
- Phase break: "The Spire remembers every oath."
- Low HP: "A herald dies standing."
- Defeat: "Rise... the standard..."

**The Mycelial Matriarch**
- Intro: "You walk into my garden uninvited."
- Phase break: "Bloom, my children."
- Low HP: "The brood... is endless..."
- Defeat: "The roots... remember..."

**The Tide Regent**
- Intro: "The crown is drowned. The throne is wet."
- Phase break: "Kneel to the tide."
- Low HP: "The water... rises..."
- Defeat: "The tide... recedes..."

**The Mirror Saint**
- Intro: "You look familiar. You will not survive it."
- Phase break: "Break the mirror. Break yourself."
- Low HP: "Every shard... is me..."
- Defeat: "See... the reflection..."

**The Cinder Muse**
- Intro: "Sing for me, little ember."
- Phase break: "The choir is on fire."
- Low HP: "The song... is almost over..."
- Defeat: "Encore... encore..."

**The Unspoken**
- Intro: *"..."* (the screen holds on a black frame)
- Phase 2: *"You."*
- Phase 3: *"Say it."*
- Defeat: *"..."* (the text fades one letter at a time)

**Part III bosses**

**Banner-Captain Voss**
- Intro: "You carry no banner. That is already a defeat."
- Phase break: "The Legion does not kneel!"
- Low HP: "A captain dies standing."
- Defeat: "Raise... the standard..."

**The Siege Titan**
- Intro: "**IRONHOLD... STANDS.**"
- Phase break: "**WALLS... REBUILD.**"
- Low HP: "**STILL. STANDING. WHY.**"
- Defeat: "**...THE STONE... REMEMBERS...**"

**Arena Champion Corvane**
- Intro: "Crowd, give them a welcome they'll survive."
- Phase break: "Now the real show begins!"
- Low HP: "They're booing. *You* did that."
- Defeat: "Good... match..."

**The Pit Master**
- Intro: "The sand is hungry today."
- Phase break: "Down you go."
- Low HP: "Oh, you're *fun*. I hate that."
- Defeat: "The pit... keeps..."

**Warlord Kaelgrath**
- Intro: "You climbed far to die on my floor."
- Phase break: "Then let the keep fall with us!"
- Low HP: "A warlord does not kneel. A warlord *falls*."
- Defeat: "The war... is yours..."

**Blood Moon Emperor**
- Intro: "The moon remembers every oath you broke."
- Phase break: "Bleed under it."
- Low HP: "The eclipse is almost here."
- Defeat: "At last... the eclipse ends..."

### 26.3 Layered boss music

**Vertical layering:** stems are muted or faded, never restarted. A phase change unmutes the next stem on the next bar. Crossfade is 0.5–1.5 seconds. A phase-break stinger covers the transition.

**Horizontal re-sequencing:** each theme has an intro, loop A, loop B, bridge, and outro. The bridge plays when the boss is staggered or below 25% HP. The outro plays on victory. Loop points are tested for a seamless transition.

**Music theory:** the **Ember Motif** from the announce trailer is the shared 5-note cell. Each boss transforms it:

- First Vow: D minor with open fifths and a hopeful lift in the second phrase.
- Mycelial Vow: E minor, modal, plucked strings and breathy choir.
- Tide Vow: G minor, low strings and water percussion.
- Frost Vow: A minor, glass harmonica and frozen choir.
- Cinder Vow: F minor, brass, war drums, and a rising fourth.
- The Unspoken: no motif, a single piano note and silence.
- Voss: D minor, 110 BPM, war drums and brass.
- Siege Titan: E minor, 90 BPM, anvil and grinding metal.
- Corvane: A minor, 128 BPM, brass stabs and crowd chants.
- Pit Master: C minor, 100 BPM, bone flute, hand drums, beast roars.
- Kaelgrath: F minor, 120 BPM, war choir, horns, taiko.
- Blood Moon Emperor: B minor, 84 BPM, reversed motif and glass harmonica.

**Theme briefs:**

| Boss | Theme | BPM / Key | Core instruments | Phase 1 | Phase 2 | Phase 3 | Victory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| The Ash Herald | "The Last Standard" | 112 / D minor | War drum, low strings, ember crackle | Solo drum and drone | Horns and choir | Full brass; resolves to D major | Horn call |
| The Mycelial Matriarch | "Bloom" | 96 / E minor | Plucked strings, breathy choir, spores | Strings and pulse | Choir and drums | Full ensemble; dissonant bloom | Single harp note |
| The Tide Regent | "Drowned Crown" | 84 / G minor | Low strings, water percussion, horn | Drone and drips | Strings and choir | Full ensemble; tide swell | Receding wave |
| The Mirror Saint | "Every Mirror" | 104 / A minor | Glass harmonica, reversed piano, choir | Glass and piano | Strings and choir | Full ensemble; shattering | Single shard |
| The Cinder Muse | "Encore" | 120 / F minor | Brass, war drums, crowd | Brass stabs | Choir and drums | Full ensemble; fire | Crowd roar |
| The Unspoken | "Silence" | — | One piano note, room tone | Silence | One note | Silence and heartbeat | Silence |
| Banner-Captain Voss | "Iron March" | 110 / D minor | War drums, brass, male choir | Drums and bass | Choir and horns | Full ensemble; horn call | Horn call |
| The Siege Titan | "The Wall Breathes" | 90 / E minor | Anvil, low strings, grinding metal | Anvil and drone | Brass and choir | Full percussion; collapse | Collapsing wall |
| Arena Champion Corvane | "Crowd's Favourite" | 128 / A minor | Crowd chants, strings, brass stabs | Brass stabs | Choir and strings | Full ensemble; crowd chant | Crowd chant |
| The Pit Master | "Below the Sand" | 100 / C minor | Bone flute, hand drums, beast roars | Flute and drums | Strings and roars | Full drums; beast call | Beast call |
| Warlord Kaelgrath | "Warlord's Banner" | 120 / F minor | War choir, horns, taiko | Drums and horns | Choir and strings | Full ensemble; broken chord | Broken chord |
| Blood Moon Emperor | "Crimson Eclipse" | 84 / B minor | Reversed motif, glass harmonica, blood choir | Drone and drum | Choir and strings | Full ensemble; single bell | Single bell |

**Ducking:** music ducks to −26 LUFS under dialogue, then returns over 0.5 seconds. Boss tells and player hit sounds always take priority over music. The ducking is a bus sidechain, not a per-track script.

**Mix targets:**

| Bus | Target | Notes |
| --- | --- | --- |
| Master | −1 dBFS peak | Limiter on the master |
| Music | −18 LUFS integrated | Ducks to −26 under VO |
| SFX | −16 LUFS short-term | Priority to player and boss tells |
| VO | −16 LUFS integrated | Always the loudest sustained element |
| UI | −20 LUFS | Never masks combat |
| Ambience | −24 LUFS | Fades with zone and combat |

### 26.4 Music and dialogue acceptance

- All Part II and Part III bosses have intro, phase-break, low-HP or final-phase, and defeat lines; alternate takes for repeat fights are a P1 target across the set.
- Every line is in a string table, with speaker, portrait, duration, and trigger.
- Every boss theme has at least three phase states — including deliberate silence for The Unspoken — and a victory sting.
- Phase changes are audible without the HUD.
- Music never masks a boss tell or a player hit.
- Subtitles and captions pass on a phone speaker, headphones, and mono.

---

## 27. Sound, visuals, animation, extras, and priority

### 27.1 Combat sound design pass

**Goals:** every attack is readable before it lands, every hit feels physical, and the mix never masks a threat.

**Attack layers:**

| Layer | Purpose | Melee example | Ranged example | Priority |
| --- | --- | --- | --- | --- |
| Wind-up | Tell the player what is coming | Armour creak, inhaled breath | Bow draw, staff charge | Critical |
| Release | Show the swing or shot direction | Cloth and air whoosh | Bowstring, projectile crack | High |
| Impact body | Confirm the hit | Flesh thud, bone crack | Arrow thud, magic burst | Critical |
| Impact surface | Confirm a block or environment hit | Ring, spark, grind | Shield ping, stone chip | High |
| Critical | Reward precision | Sharper crack, brief pitch drop | Headshot crack, shatter | High |
| Kill | Confirm the end | Body fall, ash burst | Body fall, ash burst | Medium |
| Environment | Ground the hit | Wood splinter, stone chip | Debris, ricochet | Medium |

**Weapon categories:** greatswords, dual blades, spears, war hammers, scythes, crossbows, magical staffs, whips, chakrams, alien bio-weapons, and unarmed. Each category has a signature wind-up, impact, and critical sound. A player should identify the weapon category with their eyes closed.

**Enemy tells:** every enemy family has a unique telegraph, attack, ability, and death sound. Boss tells are always audible and have a visual backup. Off-screen threats use a directional cue and a caption.

**Variation:** 3–5 variations per action, randomized without repetition fatigue. Pitch and volume vary within a narrow band.

**Accessibility:** a "visualize sounds" option shows directional icons for off-screen threats; captions describe boss tells.

**Acceptance:** every attack has a readable pre-fire or wind-up and an impact; every boss mechanic has a sound and a visual cue; no clipping; no missing audio; the mix passes on headphones, TV speakers, and mono.

### 27.2 Parallax v2, dynamic lighting, and zone palettes

**Parallax v2 (2D depth layering):** 4–6 depth layers per zone with distinct camera-relative parallax factors, foreground occlusion, depth fog, atmospheric perspective, animated props, weather, and event variants. The farthest layer is a painted skybox; the nearest can be foreground geometry that occludes the player.

**Dynamic lighting:** 2D point, spot, and directional lights; emissive materials; bloom; colour grading; vignette; boss phase lighting; torch flicker; lava glow; moon shafts. Lights are pooled and culled. Normal maps are optional and used only on hero assets.

**Zone palettes:**

| Zone | Palette | Particle | Lighting mood |
| --- | --- | --- | --- |
| Ashen Hall | Ember orange, charcoal, ash grey | Ash | Warm hearth, cold shadows |
| Mycelial Hollow | Violet, spore green, deep purple | Spores | Bioluminescent, humid |
| Tidewrought Cistern | Teal, drowned green, black | Bubbles | Caustics, dim shafts |
| Frostglass Cathedral | Ice blue, white, silver | Snow | Cold moonlight, glass glints |
| Cinder Maw | Red, orange, black | Embers | Lava glow, smoke |
| The Wonderland Beyond | Magenta, mint, gold, cream | Cards, sugar dust | Storybook bright, wrong |
| The Hush Between | Black, white, grey | None | Flat, silent, no colour |
| War zones (Part III) | Mud, iron, sand, blood, gold | Dust, sparks | War-torn, smoky |

**Acceptance:** every zone has a palette, a particle mood, and a lighting pass; the Hush is monochrome except for the intentional colour-return moments; reduced-motion settings simplify parallax and particles.

### 27.3 Character, boss, and UI animation

**Character animation:**

- Idle breathing, run, jump, fall, land, dash, attack anticipation, active, recovery, hit react, death, flask, interact, emote, spawn.
- 8–12 frames per state at the target frame rate; the game uses a fixed simulation step and interpolated rendering.
- Every attack has a clear anticipation and recovery; no attack is instant.
- The player's silhouette reads at 1× and 2× scale.

**Boss animation:**

- Idle, walk, 3–5 attacks, phase transition, stagger, death.
- 10–20 frames per state.
- Phase transitions are readable without the HUD.
- Every attack has a wind-up, an active window, and a recovery.

**UI animation:**

- Screen transition, pulse, bark, health bar, boss bar, damage numbers, status icons.
- 4–8 frames per state.
- UI animation never blocks input.
- Reduced motion replaces slides and pulses with instant cuts.

**Acceptance:** every state is readable at 390×844 and 1920×1080; no animation clips through the floor or the HUD; reduced-motion passes.

### 27.4 Other features

| Feature | Priority | Dependencies | Effort | Scope |
| --- | --- | --- | --- | --- |
| Achievements | P0 basics / P1 full | Save schema, platform API | Medium | 60 total across Parts II–III, at least 30 in Part II; progress, rewards, no power |
| Bestiary | P0 basics / P1 full | Enemy data, codex | Medium | Every enemy and boss in the shipped content; stats, weaknesses, lore |
| Charms | P1 | Inventory, stats | Medium | 3–5 slots, synergies, overcharm risk, no pay-to-win |
| NPCs and friendship | P1 | Dialogue, hub; Bazaar for Part III | High | 5 Spire NPCs in Part II; 9 Bazaar NPCs added with Part III; routines and rewards |
| Photo mode | P2 | Renderer, filters | Medium | Free camera, filters, frames, hide UI, gallery |
| Codex music player | P1 | Music data | Low | Every unlocked track, loop, favourites |
| Accessibility / QoL | P0 | Settings | Medium | Remapping, subtitles, colourblind, shake, motion, text size, assist |
| Live-service ethics | P0 | Store, events | Low | No pay-to-win, no loot boxes, no FOMO-only rewards, clear odds, event returns |

**Achievements:** 60 total across the full game (Parts II–III), with at least 30 in Part II, across story, combat, exploration, collection, mastery, and secret. Achievements never unlock power. Rewards are titles, cosmetics, and music tracks. Platform integration is optional; the in-game list is the source of truth.

**Bestiary:** every enemy and boss in the shipped content, with stats, weaknesses, resistances, lore, and a 3D/2D viewer. Entries unlock by defeating, scanning, or discovering.

**Charms:** 3–5 slots, synergies, overcharm risk (a curse or a stat penalty for overfilling), no pay-to-win. Charms are found in secrets, boss first-kills, and NPC quests.

**NPCs:** one Spire NPC per Spire in Part II (five total); the nine Bazaar NPCs join when Part III ships. Friendship levels unlock dialogue, cosmetics, lore, and daily stock. Friendship never gates power. NPCs have daily routines, faction ties, and comments on the player's progress.

**Photo mode:** free camera, filters, frames, hide UI, gallery, share. It is P2; it ships after the core expansion.

**Codex / Oath Index:** lore, vows, endings, boss dialogue, music player, concept art, credits. The Oath Index records choices from the campaign, the Hush Between, and the Spire trials.

**Accessibility / QoL:** remapping, subtitles, colourblind palettes, screen-shake slider, reduced motion, flash reduction, text size, difficulty and assist options, fast travel, training room, damage logs, boss replay, loadouts, build presets.

**Live-service ethics:** no pay-to-win, no loot boxes, no FOMO-only rewards, clear odds, event returns, offline respect, and a public content roadmap.

### 27.5 Priority order and cut list

| Priority | Scope | Rule |
| --- | --- | --- |
| **P0 — must ship** | Spires 1–2, the Hush gate and threshold, New Game+, Boss Rush, Practice Arena, Rift Gate daily/weekly, dialogue system and lines/themes for the Spires 1–2 guardians, combat sound pass, parallax v2 for the hub and two biomes, animation core, achievements and bestiary basics | No P0 cut. If P0 slips, the release moves. |
| **P1 — should ship** | Spires 3–5, The Hush Between (requires all five Vow Fragments), Ashen Descent, Time Trial, Hardcore, Daily Challenge, Blood Moon, remaining guardian and Unspoken dialogue/themes (all six Part II bosses), charms, NPC friendship, Codex music player, parallax v2 for the remaining three biomes, the Spires, and the Hush | Cut one at a time, never all at once. |
| **P2 — nice to have** | Seasonal events beyond Blood Moon, extra cosmetics, photo mode core and advanced tools, leaderboard seasons, extra NPCs, localization extras | Ship after launch if needed. |

**Cut list, in order:**

1. Photo mode advanced tools.
2. Seasonal events beyond Blood Moon.
3. Extra cosmetics.
4. Leaderboard seasons.
5. Extra NPCs.
6. Localization extras.
7. Time Trial ghost replay.
8. Ashen Descent weekly seeds.
9. Charms beyond the first 12.
10. Achievements beyond 30.

Never cut accessibility, save migration, or the key-conflict audit.

**Phase plan:**

| Phase | Weeks | Scope | Exit criteria |
| --- | --- | --- | --- |
| 1. Foundation | 1–4 | Dialogue system, Rift Gate data, Spire 1 greybox, room schema | Data-driven room and dialogue rows work |
| 2. Vertical slice | 5–8 | Spire 1–2, Hush gate and threshold greybox, New Game+, Boss Rush, Practice Arena | A player can climb, die, retry, and clear |
| 3. Expansion | 9–12 | Spires 3–4, Ashen Descent, Time Trial, Hardcore, Daily Challenge, Rift Gate events | Every mode has a leaderboard and a save |
| 4. Presentation | 13–16 | Spire 5, The Hush Between, Blood Moon, all dialogue and themes, sound pass, parallax v2, animation, achievements, bestiary, charms, photo mode | The game looks and sounds like a sequel |

### 27.6 Acceptance criteria and risks

**Definition of done (P0 + P1 release; P2 may ship post-launch):**

1. Five Spires, each with 5–7 floors, a floor mechanic, a Peak Trial, a guardian, a Vow Fragment, a permanent reward, and a shortcut.
2. The Hush Between unlocks with five fragments, is monochrome except for the intentional colour-return moments, has a three-phase secret boss, and persists across reloads.
3. Seven modes are selectable, save-safe, leaderboard-ready, and do not break the campaign.
4. The Rift Gate shows the correct state, countdown, daily/weekly/seasonal rotation, and Blood Moon event.
5. Every Part II boss has intro, phase-break, low-HP or final-phase, and defeat dialogue; every line is skippable and accessible.
6. Every Part II boss has a layered theme; phase changes are audible; music ducks under dialogue.
7. The combat sound pass covers every attack, enemy tell, and boss mechanic.
8. Parallax v2, dynamic lighting, and zone palettes cover every zone in the P0 + P1 scope, including the Hush.
9. Character, boss, and UI animation pass the readability and reduced-motion tests.
10. Achievements, bestiary, charms, NPCs, and the Codex are real, data-driven, and save-safe; photo mode ships if P2 is included.

**QA matrix:**

| Area | Checks |
| --- | --- |
| Spires | Floor transitions, checkpoints, shortcuts, Peak Trials, fragments, rewards |
| Hush | Gate, monochrome, Silent enemies, archive choice, boss phases, persistence |
| Modes | Unlock, save, leaderboard, pause, death, retry, rewards |
| Rift Gate | States, countdown, timezone, daily/weekly/seasonal, offline |
| Dialogue | Triggers, priorities, skip, subtitles, text scaling, no soft-lock |
| Music | Phase layers, loop points, ducking, victory sting, mute |
| Sound | Every attack, tell, impact, mix on three outputs |
| Visuals | Parallax layers, lighting, palette, reduced motion, Hush exception |
| Animation | Readability, hitboxes, reduced motion, UI input |
| Extras | Achievements, bestiary, charms, NPCs, photo mode, codex |

**Risks:**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Five Spires is too much content | Missed date | Ship 2 Spires in P0, 3 in P1; cut from P2 first |
| Hush is too dark or unreadable | Player frustration | Monochrome contrast tests, colour-return moments, accessibility |
| Dialogue interrupts combat | Unfair deaths | Non-blocking barks, priority rules, attack tells win |
| Music layers desync | Cheap feel | Bar-quantized transitions, seamless loop tests |
| Rift Gate time zones | Wrong events | Server time, display fallback, fixtures |
| Parallax cost | Frame drops | Layer budgets, pooling, reduced-motion fallback |

**First 30 days:**

1. Lock the room, dialogue, and event schemas.
2. Build the Spire 1 greybox and the Hush threshold.
3. Implement the dialogue queue and the bark/scene split.
4. Add the Rift Gate state machine and countdown.
5. Record the Ash Herald intro and phase lines.
6. Build the first phase-layered theme for the Ash Herald.
7. Add the Hush monochrome renderer and the colour-return hooks.
8. Add the seven mode selectors with save slots.
9. Add the achievement and bestiary basics.
10. Run the first Spire playtest with five external players.

---

## Part III — The War Update (2026 Exclusive) (Sections 28–43)

> **Release date:** `[RELEASE DATE — TBD]`. Keep the date flexible until the build, certification, and marketing gates are locked.
>
> **Draft notice:** all NPC names, boss names, faction names, race names, arena names, and extra default keys below are first-pass drafts. Run the key-conflict audit in Section 39 against the live build before shipping.

## 28. Part III overview and guardrails

**The War Update** turns Ashen Vow into a gladiator war campaign: five war zones, a 45-room campaign layer, ten arenas, factions, races, classes, a 44-weapon gladiator arsenal, six exclusive bosses, a living market, cosmetics, stats and builds, and a single Inventory/Controls flow that removes the need to return to the main menu.

It ships as a free content update, not a separate paid expansion. Existing progression, saves, and multiplayer remain intact.

### 28.1 Scope at a glance

| Area | Content |
| --- | --- |
| War zones | 5 (Warcamp Outskirts, Ironhold Siege Walls, Colosseum of Cinders, Bloodsand Pits, Warlord's Keep) |
| Rooms | ~45 war rooms |
| Arenas | 10 |
| Factions | 5 with reputation and perks |
| Races | 6 with passives |
| Classes | 6 (Gladiator, Retiarius, Pyromancer, Nightblade, Warden, Oathbound) |
| Weapons | 44 in 10 categories, with arts, infusions, and tiers |
| Bosses | 6 (Voss, Siege Titan, Corvane, Pit Master, Kaelgrath, Blood Moon Emperor) |
| Bazaar | 9 booths, 9 named NPCs, friendship, daily stock |
| Cosmetics | Outfits, weapon skins, capes, helmets, trails, dressing room |
| Stats | STR, DEX, INT, VIT, END, LCK, FTH |
| UI | One Inventory screen (I), Controls tab, Level Briefing |

### 28.2 Guardrails

1. **Preserve saves.** The v2 save extends the current schema with migration, backup, and a test fixture.
2. **No pay-to-win.** Every War Update item is earnable in-game; cosmetics are the only paid layer.
3. **Existing content stays intact.** The v1.0 campaign, endings, and bosses remain playable.
4. **Data-driven.** Rooms, weapons, factions, races, classes, bosses, and shop items are tables.
5. **Key audit.** Every new default key is checked against the live layout; conflicts swap or cancel.
6. **Accessibility.** Every new screen passes the v1.0 accessibility bar.
7. **No fake content.** If an arena or boss is not playable, it is not in the build.

---

## 29. Sneak-peek trailer: War of Embers

### 29.1 Format

- **Length:** 48 seconds (target 40–50).
- **Master:** 16:9, 1920×1080 or 3840×2160, 24 or 30 fps.
- **Cutdowns:** 30-second 16:9, 15-second 9:16, 15-second 1:1.
- **Capture:** in-engine, clean UI, real gameplay and boss animations. No fake gameplay.
- **Audio:** original 5-note "Ember Motif", war drums, low choir, one villain line.
- **Text:** minimal; six title cards maximum.
- **Accessibility:** burned-in captions for the villain line; a storyboard version for reduced-motion users.

### 29.2 Shot list

| Time | Visual | Audio / text |
| --- | --- | --- |
| 0:00–0:04 | Black. A single ember drifts upward. | Low drum hit. Text: **"THE RIFT REMEMBERS."** |
| 0:04–0:09 | The Rift Gate cracks open in Balai Sumpah; embers pull inward; banners catch fire. | Reverse whoosh, first five notes of the Ember Motif. |
| 0:09–0:14 | Warcamp Outskirts: muddy palisades, siege engines, soldiers forming up. | Drums enter. Text: **"5 WAR ZONES."** |
| 0:14–0:20 | Ironhold Siege Walls: a catapult stone breaks a wall; the Siege Titan's hand pushes through. | Stone impact, low brass. |
| 0:20–0:25 | Colosseum of Cinders: Corvane salutes the crowd; the crowd roars. | Crowd chant, brass stabs. |
| 0:25–0:30 | Bloodsand Pits: the Blood Moon rises; the Pit Master cracks a whip. | Bone flute, hand drums. |
| 0:30–0:35 | Warlord's Keep: Kaelgrath on the throne; the floor collapses. | War choir, taiko. |
| 0:35–0:40 | The Bazaar of Embers: nine booths, nine NPCs, the player trading. | Market ambience, coin clink. |
| 0:40–0:44 | The player equips a gladiator arm; the stat screen spins; the Inventory opens. | UI clicks, stat whoosh. |
| 0:44–0:48 | Title: **ASHEN VOW: WAR OF EMBERS.** Release date. | Full ensemble; final drum hit. |

### 29.3 Main-menu Sneak Peek button

- The main menu adds a **Sneak Peek** button above the footer.
- It opens the trailer in a modal player with **Play**, **Captions**, and **Close**.
- It is visible before the update launches; after launch it becomes **Watch Trailer**.
- It never blocks the main menu; `Esc` closes it.
- The button is keyboard, gamepad, and touch accessible.
- The trailer is also replayable from the Codex.

### 29.4 Rift Gate countdown

- The Rift Gate in Balai Sumpah shows the War Update countdown: days, hours, minutes, seconds.
- The countdown uses the **Dormant → Counting → Open → Claimed** subset of the Rift Gate state machine in Section 25.4.
- The timer uses server time for state and reward claims, with the platform clock as a display fallback, and shows the announced timezone. Offline players see the last known state; it never shows a fake or expired timer.
- When the countdown ends, the gate opens and launches the War Update intro mission. The panel also shows patch notes and the trailer.
- Acceptance: button opens the trailer; countdown ticks; state changes at the target time; no console errors; reduced-motion path works.

---

## 30. War zones, rooms, and arena levels

### 30.1 The five war zones

| Zone | Rooms | Arenas | Theme | Signature mechanics | Boss |
| --- | --- | --- | --- | --- | --- |
| **Warcamp Outskirts** | 8 | 2 | Mud, palisades, siege camp | Burning tents, ballista crossfire, mud slow | Banner-Captain Voss |
| **Ironhold Siege Walls** | 10 | 2 | Fortress walls and collapsing battlements | Breakable walls, ladders, boiling oil, catapult hazards | The Siege Titan |
| **Colosseum of Cinders** | 9 | 2 | Arena sand, crowd, lava grates | Crowd favour, gate traps, hazard waves | Arena Champion Corvane |
| **Bloodsand Pits** | 9 | 2 | Desert pits, beast dens, blood moon | Quicksand, sandstorm, beast packs | The Pit Master |
| **Warlord's Keep** | 9 | 2 | Throne fortress, banners, ash | Decree laws, collapsing floors, elite guards | Warlord Kaelgrath |

### 30.2 Room grammar

Each war zone uses the same grammar:

1. **Entry:** establish the zone's hazard.
2. **Combat:** apply the hazard under pressure.
3. **Traversal:** cross the hazard with a new tool.
4. **Elite:** combine the hazard with an elite.
5. **Rest:** checkpoint, shop, NPC.
6. **Story:** a choice or a reveal.
7. **Boss:** the zone boss.

Rooms are data rows, not scripts. A room has an ID, zone, type, beat, mechanic, enemies, secrets, checkpoint, and next rooms.

### 30.3 The ten arena levels

| # | Arena | Zone | Rule | Reward |
| --- | --- | --- | --- | --- |
| 1 | The Mud Ring | Warcamp Outskirts | Mud slow, no dash | Arena Marks |
| 2 | The Palisade Pit | Warcamp Outskirts | Burning walls close in | Cosmetic |
| 3 | The Wall Run | Ironhold Siege Walls | Vertical climb under fire | Weapon skin |
| 4 | The Oil Gauntlet | Ironhold Siege Walls | Boiling oil waves | Charm |
| 5 | The Crowd's Choice | Colosseum of Cinders | Random hazard each wave | Arena Marks |
| 6 | The Gate Trap | Colosseum of Cinders | Gates open and close | Cosmetic |
| 7 | The Quicksand Court | Bloodsand Pits | Shrinking safe ground | Weapon skin |
| 8 | The Beast Den | Bloodsand Pits | Beast packs, no flask refill | Charm |
| 9 | The Decree Floor | Warlord's Keep | A new law every minute | Arena Marks |
| 10 | The Throne Collapse | Warlord's Keep | The floor falls in stages | Cosmetic |

### 30.4 Map integration

- War zones appear as new region nodes on the map.
- Arenas appear as arena icons; a cleared arena shows a laurel.
- The Bazaar of Embers appears as a wing of Balai Sumpah.
- Fast travel connects cleared war-zone shrines.
- The Rift Gate is the entry point for the War Update campaign.

---

## 31. Factions, reputation, and perks

### 31.1 The five factions

| Faction | Identity | Reputation perk | Quartermaster |
| --- | --- | --- | --- |
| **Ember Legion** | Disciplined war camp | Extra Embers from war rooms | Rook |
| **Ironhold Concord** | Siege engineers and smiths | Cheaper upgrades and repairs | Hild Ironvein |
| **Cinder Court** | Arena champions and performers | Extra Arena Marks; crowd favour | Silas Vane |
| **Bloodsand Clans** | Beast tamers and raiders | Faster travel; beast tracking | The Pit Master's envoy |
| **Oathbound** | The original hero's faction | Extra dialogue; Oath Index lore | Marla Quill |

### 31.2 Reputation tracks

- Each faction has ranks 0–10.
- Reputation is earned through war rooms, arenas, contracts, and story choices.
- Ranks unlock perks, cosmetics, and quartermaster stock.
- Perks are convenience and cosmetics, not raw combat power.
- A player can reach rank 10 with every faction; no faction is mutually exclusive.

### 31.3 Faction quartermaster

The quartermaster sells faction cosmetics, weapon skins, charms, and recipes. Stock rotates daily and expands with rank. No item is pay-only.

### 31.4 UI

- The faction screen shows rank, progress, perks, and the quartermaster.
- Reputation gains appear in the results screen.
- A faction badge appears on the character sheet.
- The codex records faction lore and choices.

---

## 32. Races and passives

### 32.1 The six races

| Race | Passive | Playstyle |
| --- | --- | --- |
| **Human** | Adaptable: +1 loadout preset slot; faster respec | Flexible |
| **Elf** | Keen senses: hidden paths and traps are highlighted | Exploration |
| **Goblin** | Scavenger: extra materials from breakables | Crafting |
| **Orc** | Unyielding: once per room, survive a lethal hit at 1 HP | Frontline |
| **Demon** | Ember blood: burn resistance; Ember damage +5% | Aggressive |
| **Oathborn** | Vowbound: the Oath Index grants a small XP bonus | Story |

### 32.2 Passive rules

- Passives are sidegrades, not raw power. No race is required to clear content.
- Passives are visible in the character sheet and the codex.
- Race change is allowed at the Bazaar for a cosmetic fee; it never resets progress.
- Racial dialogue reacts to the player's race; it never gates the main story.

### 32.3 UI

- Race selection shows the passive, a preview, and a sample line.
- The character sheet shows the active passive.
- The codex records race lore.

---

## 33. Classes and skill identities

### 33.1 The six classes

| Class | Role | Resource | Signature ability | Branches |
| --- | --- | --- | --- | --- |
| **Gladiator** | Balanced melee | Stamina | Shield Bash | Sword, Shield, Crowd |
| **Retiarius** | Control and reach | Net | Net Throw | Net, Trident, Arena |
| **Pyromancer** | Area damage | Ember | Flame Wave | Fire, Ash, Ritual |
| **Nightblade** | Burst and mobility | Shadow | Shadow Step | Dagger, Poison, Night |
| **Warden** | Defense and support | Resolve | Aegis | Guard, Banner, Vow |
| **Oathbound** | Hybrid hero | Oath | Vow Strike | Oath, Relic, Leadership |

### 33.2 Class rules

- Every class can clear the campaign solo.
- No class is required for a boss; every boss has a counter for each class.
- Respec is free at any shrine; builds are not locked.
- Class abilities are data-driven and share the same cooldown/priority system.
- The original five v1.0 characters remain playable; the six classes are additional archetypes for the War Update.

### 33.3 Example branch: Gladiator

```
Gladiator
├── Sword
│   ├── Heavy Slash
│   ├── Riposte
│   ├── Executioner
│   └── Ultimate: Colossus Cut
├── Shield
│   ├── Shield Bash
│   ├── Bulwark
│   ├── Reflect
│   └── Ultimate: Unbreakable
└── Crowd
    ├── Showman
    ├── Crowd Favour
    ├── Last Stand
    └── Ultimate: Champion's Roar
```

---

## 34. Weapons: 44 gladiator arms, arts, infusions, tiers

### 34.1 Design rules

- Every weapon has a clear job, a distinct silhouette, a distinct sound, and a distinct hit pattern.
- Time-to-kill targets are fixed in data tables, so balance is a spreadsheet change.
- Every weapon ships with a skin-ready model and a mastery track.
- No weapon is pay-only.

### 34.2 The 44 weapons

| Category | Weapons |
| --- | --- |
| **Greatswords** (5) | Iron Greatsword, Arena Cleaver, Oathbreaker Blade, Cinder Edge, Colossus Fang |
| **Dual blades** (5) | Twin Gladii, Sand Fangs, Nightglass Pair, Ember Kiss, Rift Claws |
| **Spears** (5) | Legion Spear, Retiarius Trident, Wall Pike, Bloodsand Harpoon, Star Lance |
| **War hammers** (4) | Siege Maul, Anvil Fist, Throne Breaker, Titan's Knuckle |
| **Scythes** (4) | Ash Reaper, Crowd's Harvest, Moon Scythe, Void Reaper |
| **Crossbows** (4) | Legion Crossbow, Arena Repeater, Sand Bolt, Rift Piercer |
| **Magical staffs** (5) | Ember Staff, Cinder Scepter, Oath Rod, Frostglass Wand, Star Staff |
| **Whips** (4) | Beast Lash, Pit Chain, Bloodsand Whip, Cinder Cord |
| **Chakrams** (4) | Arena Ring, Sand Disc, Ember Chakram, Rift Wheel |
| **Alien bio-weapons** (4) | Xeno Blade, Bio-Cannon, Plasma Staff, Parasite Lance |

### 34.3 Weapon arts and infusions

- **Weapon arts** are equipable special attacks with cooldowns and resource costs.
- **Infusions** add an element (Ember, Frost, Storm, Venom, Crystal, Void, Radiance, Alien) without removing physical scaling.
- Infusions are swapped at a shrine; no consumable tax.
- Each weapon has one art slot and one infusion slot.
- Arts and infusions are visible in the loadout comparison.

### 34.4 Upgrade tiers

| Tier | Upgrade | Materials |
| --- | --- | --- |
| Common | +0 to +3 | Embers, basic ore |
| Rare | +4 to +6 | Rare ore, monster parts |
| Epic | +7 to +9 | Boss materials, faction tokens |
| Legendary | +10 | Unique boss core |
| Mythic | +11 to +12 | Seasonal materials, challenge tokens |

Upgrades add sidegrade options, not raw power creep. A +12 weapon is not required to clear the campaign.

---

## 35. Exclusive bosses and boss themes

### 35.1 The six War Update bosses

| Boss | Zone | Phases | Signature mechanics | Reward | Theme |
| --- | --- | --- | --- | --- | --- |
| **Banner-Captain Voss** | Warcamp Outskirts | 2 | Banner buffs, shield wall, call reinforcements | Voss's Banner cape, Ember Legion rep | "Iron March" — war drums, brass, male choir |
| **The Siege Titan** | Ironhold Siege Walls | 3 | Rebuilds armour from walls, catapult arms, wall collapse | Titan Core charm, upgrade materials | "The Wall Breathes" — anvil percussion, low strings, grinding metal |
| **Arena Champion Corvane** | Colosseum of Cinders | 2 | Net and trident, crowd favour, trap gates | Corvane's Trident skin, Arena Marks | "Crowd's Favourite" — crowd chants, strings, brass stabs |
| **The Pit Master** | Bloodsand Pits | 3 | Beast adds, quicksand, sandstorm | Beastmaster's Lash, Bloodsand rep | "Below the Sand" — bone flute, hand drums, beast roars |
| **Warlord Kaelgrath** | Warlord's Keep | 3 | Weapon swaps, banner phases, collapsing floor | Kaelgrath's Edge, Warlord armour set | "Warlord's Banner" — horns, taiko, choir |
| **Blood Moon Emperor** | Blood Moon Apse | 3 | Mirror clones, blood tide, eclipse phases | Blood Moon Scythe, Mythic trail | "Crimson Eclipse" — reversed motif, glass harmonica, blood choir |

### 35.2 Dialogue samples

The full lines are in Section 26.2. Each boss has intro, phase-break, low-HP, and defeat lines, plus alternate takes for repeat fights.

### 35.3 Boss rules

- Every boss has a readable phase transition and a unique arena mechanic.
- Every boss has a counter for each class and each weapon category.
- No boss requires a specific race, faction, or paid item.
- Every boss is replayable in the Practice Arena and Boss Rush.
- Every boss drops a first-clear reward and a repeatable currency reward.
- Boss rematches use alternate dialogue takes and optional modifiers.

### 35.4 Boss themes

The full theme briefs are in Section 26.3. The War Update adds six themes on the same layered stem system, with phase changes on the next bar and a victory sting.

---

## 36. The Bazaar of Embers

The Bazaar of Embers is a market wing of Balai Sumpah with nine booths and nine named, talking NPCs.

### 36.1 The nine booths

| Booth | NPC | Sells | Friendship reward |
| --- | --- | --- | --- |
| **Potions** | **Marla Quill** | Flasks, antidotes, buffs | Extra flask charge, potion recipe |
| **Inventory upgrades** | **Old Brack** | Bag slots, stash tabs, loadout slots | Extra preset slot |
| **Blacksmith** | **Hild Ironvein** | Weapon upgrades, repairs, infusions | Unique weapon skin |
| **Skins** | **Seraphine** | Outfits, weapon skins, capes | Dressing-room backdrop |
| **Stat trainer** | **Master Doran** | Respec, stat presets, training | Free respec token |
| **Relics and charms** | **Veil** | Relics, charms, relic fusion | Unique charm |
| **Faction quartermaster** | **Rook** | Faction cosmetics, recipes | Faction banner |
| **Arena bookie** | **Silas Vane** | Arena bets, challenge contracts | Arena title |
| **Mapmaker and bard** | **Linnet** | Map reveals, songs, lore | Music track, map pin |

### 36.2 Friendship levels

- Each NPC has friendship levels 0–5.
- Friendship is earned by buying, talking, and completing their quest.
- Rewards are cosmetics, lore, recipes, and convenience; never raw combat power.
- Friendship dialogue reacts to the player's race, class, faction, and story choices.
- NPCs have daily routines and comment on the player's progress.

### 36.3 Daily stock rotation

- Each booth has a daily stock of 3–6 items.
- Stock rotates at 00:00 UTC; the timer is visible in the booth.
- A "Wishlist" marker notifies the player when an item returns.
- No premium currency can force a reroll.
- Every item returns within a fixed window; no item is a one-time FOMO offer.

### 36.4 Currencies

| Currency | Earned from | Used for |
| --- | --- | --- |
| **Embers** | Matches, missions, challenges, selling materials | Basic gear, upgrades, potions, cosmetics |
| **Arena Marks** | Arena queues, weekly ladder, Silas's contracts | Arena cosmetics, weapon skins, charms |
| **Prime Shards** | Campaign secrets and boss first-kills | Campaign-exclusive cosmetics and lore |

No War Update item requires real money.

### 36.5 Shop layout

- **Featured:** one rotating item per booth.
- **Booth grid:** nine booths, each with a portrait, name, and stock count.
- **Detail pane:** stats, comparison, owned state, friendship discount.
- **Confirm step:** no accidental purchases; a refund window for duplicate cosmetics.
- **Accessibility:** full keyboard/gamepad navigation, text scaling, screen-reader labels.

---

## 37. Skins, cosmetics, and the dressing room

| Category | Examples | Earned from | Rule |
| --- | --- | --- | --- |
| Character outfits | Warcamp leathers, Ironhold plate, Colosseum silks, Blood Moon regalia | Zone clears, faction rep, Bazaar, achievements | No stats; hitbox unchanged |
| Weapon skins | Ember-etched Gladius, Frostbite Trident, Blood Moon Scythe | Boss first-kills, mastery, arena | No stat changes |
| Capes | Voss's Banner, Oathbound cloak, Sandstorm mantle | Boss rewards, faction rank | No stat changes |
| Helmets | Gladiator helm, Seer hood, Titan crown | Achievements, secrets | No stat changes |
| Trails | Ember trail, spore trail, card trail | Mastery, events | Cosmetic only |
| Dressing room | Backdrops, poses, frames, lighting | Friendship, photo mode | Cosmetic only |

### 37.1 The dressing room

- Preview the full character with the current loadout.
- Mix and match outfits, capes, helmets, weapon skins, and trails.
- Save up to 10 cosmetic presets.
- Photo mode hooks: pose, frame, lighting, background.
- All cosmetics are earnable; the paid layer is optional and cosmetic-only.

---

## 38. Stats, builds, respec, and presets

### 38.1 The seven stats

| Stat | Effect | Soft cap |
| --- | --- | --- |
| **STR** | Melee damage, carry weight | 40 |
| **DEX** | Attack speed, critical chance, evasion | 40 |
| **INT** | Ability damage, resource pool | 40 |
| **VIT** | Max HP, poison resistance | 40 |
| **END** | Stamina, block, dash charges | 40 |
| **LCK** | Drop rate, critical multiplier, rare finds | 30 |
| **FTH** | Oath abilities, healing, Radiance | 40 |

### 38.2 Soft caps and respec

- Points spent past a soft cap give half value.
- Respec is free at any shrine; the player can rebuild at any time.
- Respec never resets level, story, or unlocks.
- A respec token from Master Doran allows a full reset anywhere.

### 38.3 Build presets

- Save up to 10 builds.
- Each preset stores stats, gear, skills, charms, and infusion.
- Presets can be renamed, duplicated, compared, and shared locally.
- A preset warns about incompatible gear or unmet requirements.
- Ranked modes normalize stats to a fixed budget; presets are cosmetic there.

### 38.4 Skill trees

Each class has three branches with 6–8 nodes and an ultimate. Cross-class nodes are available through the Relic Mastery and Oathbound trees. Respec is free; experimentation is encouraged.

---

## 39. Inventory, Controls, and Level Briefing

### 39.1 One Inventory screen

Press `I` to open a single Inventory screen with tabs:

| Tab | Contents |
| --- | --- |
| **Weapons** | Equipped weapon, comparison, infusions, arts |
| **Armor** | Armor, helmet, cape, stats |
| **Relics** | Relics, charms, sets, fusion |
| **Consumables** | Flasks, potions, materials |
| **Controls** | Keybinds, gamepad, conflicts, reset |

The player never needs the main menu to change gear or check a key.

### 39.2 Level Briefing

Clicking a level on the level-select screen opens a **Level Briefing** panel with:

- Objectives.
- Recommended level and loadout.
- Rewards and secrets count.
- Boss and enemy types.
- A **Controls** tab with the same rebinding UI as the Inventory.
- **Deploy** and **Cancel** buttons.

The Level Briefing is the only place a level starts; there is no separate lobby for campaign rooms.

### 39.3 Default keys — audited against the v0.1.0 build

The draft keys were checked against `src/settings.js` (`ACTIONS` and `GAMEPAD_MAP`). Several clashed, so the shipping defaults below preserve the current layout and make only one intentional change.

**Audit findings:**

| Draft key | Current owner in the build | Verdict |
| --- | --- | --- |
| `I` for Inventory | Ability, second slot | Clash → move Ability's second slot to `V` |
| `K` for Dash | Shuriken, first slot | Clash → keep Dash on `Shift` / `L` |
| `E` for Interact | Flask, first slot | Clash → keep Interact on `F` / `Enter` |
| `Q` for Flask | Swap weapon, first slot | Clash → keep Flask on `E` / `H` |
| `Tab` for Swap weapon | Map, second slot | Clash → keep Swap on `Q` / `C` |
| `T` for Emote | Free | Safe → add |
| `M` for Map | Map | No change |
| Gamepad: Interact on North | Ability | Clash → keep Interact on D-pad Down |
| Gamepad: Inventory on Select | Map | Clash → Inventory takes Select; Map moves to R3 |
| Gamepad: Swap on RB | Shuriken | Clash → keep Shuriken on RB; Swap stays D-pad Up |
| Gamepad: Emote on D-pad Down | Interact | Clash → Emote moves to L3 |

The draft also omitted the existing **Shuriken / consume** action (`K` / `X`, RB). It stays.

**Shipping defaults:**

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | `A` / `D` or `←` / `→` | Left stick / D-pad left-right |
| Jump | `Space` / `W` | South (A / Cross) |
| Attack | `J` / `Z` | West (X / Square) |
| Shuriken | `K` / `X` | RB / R1 |
| Ability | `U` / `V` | North (Y / Triangle) |
| Dash | `Shift` / `L` | East (B / Circle) |
| Flask | `E` / `H` | LB / L1 |
| Swap weapon | `Q` / `C` | D-pad Up |
| Interact | `F` / `Enter` | D-pad Down |
| Inventory | `I` | Select / Back |
| Map | `M` / `Tab` | R3 / Right stick click |
| Pause | `Esc` / `P` | Start / Menu |
| Emote | `T` | L3 / Left stick click |

**Audit result (v0.1.0 defaults):** zero duplicate keys; the only existing keyboard change is Ability's second slot (`I` → `V`); `I` and `T` are new.

**Rules:**

- Only one existing keyboard binding changes: Ability's second slot moves from `I` to `V` to free `I` for Inventory. On gamepad, Select/Back moves from Map to Inventory, and Map moves to R3.
- Every new key is rebindable; the audit runs at startup for imported settings and logs a warning in development.
- If a conflict is found, the dialog offers **Swap**, **Cancel**, and **Reset this action**. No silent overwrite.
- The Level Briefing and the Inventory share the same Controls tab, so the audit is visible from both.
- Tests assert that no two actions share a key in the default layout and that every action owns at least one key.

---

## 40. UX, onboarding, and accessibility

### 40.1 New navigation

- Main menu: Continue, New Campaign, Game Modes, Loadout Manager, Skill Trees, World Map, Map Editor, Journal, Achievements, Settings.
- In-game: Inventory (`I`), Map (`M`), Pause (`Esc`), Level Briefing (from level select).
- No feature requires returning to the main menu.

### 40.2 First-time flow

1. Boot → title → Continue or New Campaign.
2. New Campaign → prologue → first room → first boss.
3. First death → retry at checkpoint → tip card.
4. First shop → buy a flask → tutorial.
5. First level select → Level Briefing → Controls tab.
6. First boss defeat → reward → codex unlock.
7. First War Update entry → Rift Gate → faction choice.

### 40.3 Accessibility

- Full key and controller remapping.
- UI scaling, text scaling, colourblind palettes.
- Reduced screen shake, particles, and flashes.
- Optional damage indicators and attack telegraphs.
- Adjustable combat difficulty and assist options.
- Pause and menu accessibility.
- Screen-reader labels for HUD and menus.
- No horizontal overflow at 390×844; all menus scroll.

### 40.4 Performance and comfort

- 60 FPS target on integrated graphics.
- No GC spikes during boss fights.
- Loading screens never show fake progress.
- Motion-sensitive players can disable parallax, shake, and flashes independently.
- The game respects `prefers-reduced-motion`.

---

## 41. Technical integration, data model, and save migration

### 41.1 Data tables

| Table | Contents |
| --- | --- |
| `ROOMS` | Room IDs, zones, types, beats, mechanics, enemies, exits |
| `ZONES` | Palette, particle, music, map colour |
| `BOSS_INFO` | Phases, stats, rewards, dialogue, theme |
| `ENEMY_INFO` | Stats, resistances, tells, drops |
| `WEAPONS` | Category, stats, art, infusion, tier |
| `FACTIONS` | Ranks, perks, stock |
| `RACES` | Passives, dialogue tags |
| `CLASSES` | Branches, abilities, resource |
| `SHOP_ITEMS` | Price, stock, friendship, rotation |
| `DIALOGUE` | Speaker, text, trigger, priority, audio |
| `EVENTS` | State, schedule, rewards, conditions |

All tables are exported and Node-testable. Adding content never requires touching the renderer.

### 41.2 Save schema v2

- Extends the current `ashen-vow-progress-v1` schema.
- Adds war-zone progress, faction rep, arena clears, Bazaar friendship, loadout presets, stat allocations, and event state.
- Migration from v1: fill defaults, keep every existing unlock, mark the current run safe, never delete weapons or campaign clears.
- Backup before migration; restore on failure.
- Add a migration fixture for an 8-room/old-save profile and a 14-room profile.

### 41.3 Testing

- Node tests: stat math, soft caps, class trees, weapon art costs, infusion tradeoffs, faction perks, reputation ranks, Bazaar stock, save migration.
- CDP tests: Inventory, Controls, Level Briefing, Bazaar, arena, boss, Rift Gate, trailer modal.
- Regression: boss unlock → editor → custom map → reload → campaign state intact.

---

## 42. Live-service rollout and content cadence

### 42.1 Rollout

| Stage | Content | Gate |
| --- | --- | --- |
| T−4 weeks | Trailer, Sneak Peek button, countdown, patch notes | Marketing and build gates |
| T−0 | War Update launch: zones 1–3, 6 arenas, factions, classes, weapons | Certification, save migration |
| T+2 weeks | Zones 4–5, remaining arenas, Blood Moon Emperor | Live monitoring |
| T+4 weeks | Balance pass, Bazaar stock expansion, first seasonal event | Community feedback |
| T+8 weeks | Arena season, ranked ladder, season 2 cosmetics | Season gate |

### 42.2 Events

- **Daily:** rotating challenge, 10–20 minutes.
- **Weekly:** faction war, arena ladder reset, Bazaar rotation.
- **Seasonal:** 6–8 weeks, story beat, event shop, cosmetics, leaderboard.
- **Blood Moon:** the signature seasonal event, with the Blood Moon Emperor.

### 42.3 Cadence rules

- No crunch-driven updates. If a date slips, the date moves, not the quality.
- Every event returns; no one-time FOMO.
- Every reward is earnable; no pay-only gameplay.
- Every update ships with a migration test and a rollback plan.
- The public roadmap is updated monthly.

---

## 43. Acceptance criteria, QA, risks, and next steps

### 43.1 Definition of done

1. Five war zones and ~45 rooms are playable from the Rift Gate to the final boss.
2. Ten arenas are selectable, save-safe, and leaderboard-ready.
3. Five factions, six races, and six classes are playable and respec-safe.
4. 44 weapons are earnable, upgradeable, and distinct.
5. Six bosses have phases, dialogue, themes, and rematches.
6. The Bazaar has nine booths, nine NPCs, friendship, and daily stock.
7. Skins, capes, helmets, trails, and the dressing room work and persist.
8. The seven stats, soft caps, respec, and presets work and persist.
9. The Inventory (`I`), Controls tab, and Level Briefing work with keyboard, gamepad, and touch.
10. The trailer, Sneak Peek button, and Rift Gate countdown work.
11. Saves migrate from v1 without loss; a backup restores.
12. `npm test` is green; CDP smoke covers the new flows; no console errors.

### 43.2 QA matrix

| Area | Checks |
| --- | --- |
| War zones | Entry, exits, checkpoints, hazards, boss |
| Arenas | Rules, waves, rewards, leaderboard, retry |
| Factions | Rep gains, ranks, perks, quartermaster |
| Races | Passives, dialogue, race change |
| Classes | Abilities, branches, respec, balance |
| Weapons | Stats, arts, infusions, tiers, skins |
| Bosses | All phases, dialogue skip, death/retry, reward grant, secret unlock |
| Bazaar | All 9 booths, friendship levels, daily rotation, discounts, no negative currency |
| Inventory/Controls | Rebind both slots, conflict swap/cancel, reset, persist, gamepad |
| Level Briefing | Opens from level select, shows objectives/rewards, starts correctly |
| Stats | Point spend, soft cap, respec, preset import/export, invalid preset rejection |
| Saves | Fresh, migrated, corrupt, backup restore, reload persistence |
| Accessibility | Focus order, subtitles, colourblind, UI scale, reduced motion |
| Performance | 45 rooms, boss arenas, Bazaar crowd, trailer modal, 60 FPS target |

### 43.3 Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scope creep | Missed date, burnout | Phase gates, cut list, ship zones in two drops |
| Key clashes | Broken controls | Startup audit, swap/cancel, tests, visible warnings |
| Power creep | Trivialised combat | Sidegrade budgets, soft caps, ranked normalisation |
| NPC content cost | Bazaar feels empty | Nine deep NPCs, daily stock, friendship, reuse dialogue grammar |
| Save migration | Lost progress | Versioned schema, backup, fixture tests |
| Live-service pressure | Crunch, FOMO | Fixed cadence, content archive, no pay-to-win |

### 43.4 First 30 days

1. Lock the War Update data tables and the v2 save schema.
2. Greybox Warcamp Outskirts and the first arena.
3. Implement the Inventory/Controls screen and the Level Briefing.
4. Add factions, races, and classes to the character sheet.
5. Implement the first 10 weapons and the infusion system.
6. Build the Bazaar shell with three NPCs.
7. Record Voss and the Siege Titan dialogue.
8. Build the first two War Update themes.
9. Add the trailer modal and the Rift Gate countdown.
10. Run the key-conflict audit and the first migration test.

---

# Appendices

## Appendix A — Element chart

| Element | Icon | Status | Duration | Reaction | Countered by |
| --- | --- | --- | --- | --- | --- |
| Ember | Flame | Burn (stacking) | 4 s | Toxic Flare (Venom), Steam Veil (Frost) | Tide, Frost |
| Frost | Snowflake | Chill → Freeze | 3 s / 1.5 s | Supercell (Storm), Steam Veil (Ember) | Ember, Storm |
| Storm | Bolt | Shock (chain) | 2 s | Supercell (Frost), Chain Shard (Crystal) | Crystal, Earth |
| Venom | Droplet | Poison (stacking) | 6 s | Toxic Flare (Ember), Purge (Radiance) | Clockwork, Radiance |
| Crystal | Prism | Shatter (armor break) | 5 s | Chain Shard (Storm), Rift Fracture (Alien) | Storm, Ember |
| Void | Spiral | Corrode (barrier break) | 4 s | Eclipse (Radiance) | Radiance, Crystal |
| Radiance | Sun | Blind (accuracy down) | 3 s | Eclipse (Void), Purge (Venom) | Void, Shadow |
| Alien | Rift | Warp (teleport) | 2 s | Rift Fracture (Crystal) | Radiance, Crystal |

**Resistance levels:** Weak (1.5×), Neutral (1.0×), Resistant (0.5×), Immune (0×, only for elemental damage; physical always works).

**UI rules:**

- The element icon appears next to the damage number.
- The status icon shows stacks and a timer ring.
- The bestiary shows the resistance profile.
- The Level Briefing shows the zone's dominant element.
- Colourblind mode adds a shape to every element icon.

---

## Appendix B — UI audit checklist

| # | Screen | Issue | Fix | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | Main menu | Mixed languages | One string table, language switch | Every label switches language |
| 2 | Main menu | Sneak Peek not present | Add Sneak Peek button + modal | Button opens trailer, `Esc` closes |
| 3 | Level Select | No briefing | Level Briefing panel | Clicking a level opens briefing |
| 4 | Level Select | Locked rooms only show Sneak Peek | Show lock reason and required ability | Player knows what unlocks the room |
| 5 | Level Briefing | No controls | Controls tab | Rebinding works from the briefing |
| 6 | Codex | No search | Search + filters + detail pane | Find any entry in under 5 seconds |
| 7 | Codex | Tabs are text-only | Icons + counts | Every tab has an icon and a count |
| 8 | Map | Mouse-first pins | Keyboard/gamepad focus + list view | Every pin is reachable without a mouse |
| 9 | Map | Small legend | Larger legend + zone filter | Legend readable at 200% text |
| 10 | HUD | Bars lack numbers | Current/max numbers | Health and resource readable at a glance |
| 11 | HUD | No status icons | Status icons with timers | Every status has an icon and a tooltip |
| 12 | HUD | Boss bar lacks phases | Phase pips + name | Player sees the current phase |
| 13 | Settings | Key conflicts unclear | Conflict dialog with swap/cancel | No silent overwrite |
| 14 | Settings | No per-device reset | Reset keyboard/gamepad separately | Reset works without touching the other |
| 15 | Pause | Inconsistent return paths | Shared result panel | Retry, Level Select, Main Menu |
| 16 | Death | No tip | Contextual tip card | Tip matches the cause of death |
| 17 | Victory | No reward summary | Reward list + continue | Every reward is shown |
| 18 | Character select | Stats separated from preview | Stats beside preview | No scrolling to compare |
| 19 | Shop | No comparison | Stat deltas + owned state | Player sees the upgrade before buying |
| 20 | Mobile | Horizontal overflow | Scrollable panels, 44px targets | No overflow at 390×844 |

---

## Appendix C — The Wonderland Beyond room list

| # | Room | Type | Mechanic | Enemies | Secret | Reward |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | The Rabbit Hole | Entry / fall | Shrinking rings, long fall | Card Soldier, Teacup Mimic | Hidden teacup | Sugar dust trail |
| 2 | The Tea Garden | Combat / puzzle | Tea geysers, rearranging table | Teacup Mimic, Flamingo Knight | Golden teaspoon | Tea-time charm |
| 3 | The Card Bridge | Traversal | Card shuffle, suit order | Card Soldier, Cheshire Stalker | Hidden card | Card cape |
| 4 | The Clockwood | Puzzle / stealth | Clock Stop, frozen platforms | Cheshire Stalker, Clockwork Hare | Clock key | Clockwork trail |
| 5 | The Queen's Court | Mini-boss / choice | Croquet, courtroom questions | Queen's Guard, Flamingo Knight | Secret verdict | Wonderland outfit |
| 6 | The Heart Throne | Boss arena | Checkerboard flip, card storm, heart execution | The Crimson Queen | — | Heart Key, Cheshire Grin, music track |

**Unlock chain:** final boss → Break the Vow ending → Frostglass mirror → Rabbit Hole → Heart Key → Mirror Palace.

**Room count:** 6 rooms, 1 boss, 4 enemies, 3 secrets, 1 post-game world. This is the smallest complete post-game region and the template for the other secret worlds.

---

## Appendix D — Priority order (whole expansion)

| Priority | Scope | Rule |
| --- | --- | --- |
| **P0 — must ship** | v1.0 Milestones C–F; Spires 1–2; Hush gate + threshold; New Game+; Boss Rush; Practice Arena; Rift Gate daily/weekly; Part II dialogue and themes for the first two guardians; combat sound pass; parallax v2 for the hub and two biomes; animation core; achievements/bestiary basics; UI audit fixes 1–12; elemental framework + HUD icons | No P0 cut. If P0 slips, the release moves. |
| **P1 — should ship** | Spires 3–5; The Hush Between; Ashen Descent; Time Trial; Hardcore; Daily Challenge; Blood Moon; all Part II dialogue/themes; charms; NPC friendship; Codex music player; parallax v2 for the remaining biomes, Spires, and Hush; UI audit fixes 13–20; Wonderland region; War Update zones 1–3 | Cut one at a time, never all at once. |
| **P2 — nice to have** | Seasonal events beyond Blood Moon; photo mode advanced tools; extra cosmetics; leaderboard seasons; extra NPCs; localization extras; Clockwork Carnival; Mirror Palace; Sunken Dream; War Update zones 4–5 | Ship after launch if needed. |

**Cut order:** photo mode tools → extra seasonal events → extra cosmetics → leaderboard seasons → extra NPCs → localization extras → secret worlds → War Update zones 4–5 → Time Trial ghost replay → Ashen Descent weekly seeds → charms beyond 12 → achievements beyond 30.

**Never cut:** accessibility, save migration, key-conflict audit, the Hush unlock, the Wonderland unlock chain.

---

## Appendix E — QA matrix (whole expansion)

| System | Node tests | CDP tests | Manual checks |
| --- | --- | --- | --- |
| Rooms | Room data, exits, gates | Entry/exit, checkpoint, secret | No soft-lock |
| Spires | Floor mechanics, fragments | Climb, die, retry, clear | Peak Trial readable |
| Hush | Gate, monochrome, choice | Unlock, boss, persistence | No colour leaks |
| Modes | Save slots, unlock rules | Select, pause, retry, reward | Leaderboard sane |
| Rift Gate | State machine, countdown | Open, claim, reset | Timezone correct |
| Dialogue | Triggers, priorities, queue | Skip, subtitle, no soft-lock | Audio matches text |
| Music | Track data, loop points | Phase change, ducking, mute | No desync |
| Sound | Cue table | Every attack, tell, impact | Mix on 3 outputs |
| Visuals | Palette data | Parallax, lighting, reduced motion | Hush exception |
| Animation | State table | Readability, hitboxes | No clipping |
| Loadouts | Slots, synergy, mastery | Save, reload, compare | No invalid build |
| Skills | Point spend, respec | Tree UI, reset | No negative points |
| Prestige | Rank math, preservation | Rank up, reload | No lost unlocks |
| Editor | Map validation, boss unlock | Place, save, reload, run | Campaign intact |
| NPCs | Dialogue, quest state | Talk, shop, friendship | No dead-end quest |
| Alien Mode | Biome, research | Enter, upgrade, boss | Save-safe |
| War Update | Factions, races, classes, weapons | All new screens | No key clash |
| Bazaar | Stock, friendship, currency | Buy, sell, rotate | No negative currency |
| Saves | Migration, backup, corruption | Fresh, migrated, restore | No data loss |

---

## Appendix F — Name alternatives and glossary

### F.1 Draft name alternatives

| Role | Current draft | Alternatives |
| --- | --- | --- |
| Secret level | The Hush Between | The Quiet, The Grey, Between the Vows |
| Secret boss | The Unspoken | The Hush, The Quiet One, The Last Silence |
| Hub | Balai Sumpah | Hall of Oaths, The Vow Hall |
| Rift Gate | Gerbang Retak | The Rift Gate, The Broken Gate |
| Wonderland | The Wonderland Beyond | The Looking-Glass, The Heart Court, Candyglass |
| Wonderland boss | The Crimson Queen | The Heart Queen, The Red Sovereign |
| War hub | The Bazaar of Embers | The Ember Market, The War Bazaar |
| Stat trainer | Master Doran | Master Vorn, Trainer Doran |
| Mapmaker/bard | Linnet | Lark, Wren, Linnet the Cartographer |

### F.2 Glossary

| Term | Meaning |
| --- | --- |
| **Vow Fragment** | A permanent key dropped by a Spire guardian; five open the Hush |
| **Peak Trial** | A Spire's final exam; no checkpoints, one flask refill |
| **Hush Sigil** | The Hush's reward for the Oath Index; not a sixth fragment |
| **Ashen Descent** | Endless descending roguelike mode |
| **Rift Gate** | The event portal in Balai Sumpah |
| **Blood Moon** | The signature seasonal event |
| **Ember Motif** | The shared five-note musical cell |
| **War Update** | Part III's gladiator war expansion |
| **Bazaar of Embers** | The nine-booth market wing |
| **Oath Index** | The persistent record of choices, lore, and promises |

---

> **End of master plan.** This document is a living plan. Revisit it at the end of every phase and adjust it using playtest data, not assumptions.

