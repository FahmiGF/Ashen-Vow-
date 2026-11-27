# PRD — Phase 2: *The Unfinished Roads*

> Roadmap phase **2** of Master Plan 3.0 (`MASTERPLAN.md` §4).
> Owner: Sealius · Written 27 November 2026 against the live tree at **v0.41.0**.
> First release: **v0.42.0 — Update XXXII: Infinite Frontiers playable**.
> Second release: **v0.43.0 — Update XXXIII: Overdrive playable**.

---

## 1. Problem

Two finished content designs are locked behind a data table:

| Mode | Data that exists today | What the player can do with it |
|---|---|---|
| Infinite Frontiers Lv 101–200 | `src/frontier.js`: 10 chapters, 100 level specs, 15 elite mobs with ranks E1–E7, 15 classes, weapon categories, mounts, companions | Nothing. No room exists in `ALL_ROOMS`; the only playable Frontier content is the 3D vertical slice. |
| Overdrive Lv 201–300 | `src/overdrive.js`: 10 chapters, 100 level specs, 8 spell schools, 8 legendaries, 6 special level types, 6 roaming bosses, 12 mode specs | Nothing. `OVERDRIVE_LEVEL_SPECS` has no rooms. |

Meanwhile the campaign ends at room 673. A player who fells Orsella has nowhere the oath imagery points to next, and the game advertises levels it cannot serve. That is the largest honesty gap left in the tree.

**Goal:** turn both ladders into real, playable, save-backed chapters, in roadmap order, without renumbering a single existing room.

**Non-goals for this phase:** bespoke boss machines (Phase 3), mounts/companions in 2D (Phase 5, 3D), localization (Phase 7), cloud saves (Phase 7).

---

## 2. Who this is for

- **The campaign finisher.** Has cleared The Oathbreaker and at least one arc. Wants a longer ladder with the same sword, flask and shop rules.
- **The completionist.** Wants 100 numbered levels with visible progress, per-chapter bosses and a hard final gate.
- **The balance-minded player.** Wants the difficulty curve to keep climbing *without* the room contract breaking (20 bodies, 4 archetypes, 1 elite) and without stat walls that require farming.

---

## 3. Release 1 — v0.42.0 Infinite Frontiers playable

### 3.1 Scope

1. **100 new rooms, ids 674–773**, appended to `ALL_ROOMS` (674 → 774 rooms). Chapter 11 owns 674–683, chapter 12 owns 684–693, … chapter 20 owns 764–773.
2. **10 bosses**, one per chapter, at each chapter's tenth level (683, 693, 703, …, 773). Three to five phases, full `intro` / `phaseN` / `defeat` dialogue, a phase threshold table that descends, one signature attack family per boss, and boss music.
3. **40 new normal enemy bodies** (four per chapter on the four required archetypes: chaser, ranged, lunge, slam) and **15 elite bodies** taken from the existing `ELITE_MOBS` table, with E1–E7 rank multipliers applied.
4. **Room contract:** every non-boss room spawns exactly **20 bodies — 19 normal + 1 guaranteed elite** across four archetypes. Boss rooms spawn only the boss.
5. **Progression:** `progress.frontiers` inside the existing `ashen-vow-progress-v1` payload. Levels unlock strictly in order; the sanitizer repairs skipped clears, clamps counters and never lets a forged late clear survive.
6. **Level-select hub:** a chapter rail (10 chapters) above a ten-card level grid, with lock/clear badges, level numbers, boss markers and a live progress read-out. Locked behind the base campaign (The Oathbreaker).
7. **Honest reports:** level time saved to `progress.stageTimes` under `frontiers:<index>`, chapter clear toasts, and the final boss (`Aethron, the Origin Beyond`) ends on `reward: 'victory'`.

### 3.2 Requirements and acceptance

| # | Requirement | Acceptance |
|---|---|---|
| R1 | Rooms exist and are contiguous | `FRONTIER_ROOMS.length === 100`; `room.id === 674 + i`; `ALL_ROOMS.length === 774`; room 673 unchanged |
| R2 | Every standard room is a real fight | `game.loadRoom(id)` yields 20 enemies, exactly one `elite`, 4 distinct `ai` archetypes, all standing above the floor |
| R3 | Boss rooms are boss-only | no enemies array, `game.boss.kind` matches the chapter boss, `gate` opens on `boss` or is `null` for the finale |
| R4 | Bosses are authored, not reskinned data dumps | 3–5 descending thresholds, `intro` + one `phaseN` per extra phase + `defeat`, distinct name/title/colour/music/pattern |
| R5 | Elites ride the engine's elite path | spawned with `elite: true` and `eliteRank` (E1–E7); bounty pays the 2.2× elite multiplier |
| R6 | Sequential unlock | level 0 open, level *n* locked until *n−1* cleared; skipping is refused with a toast |
| R7 | Save survives reload and tampering | `sanitizeFrontierProgress` fills defaults, repairs out-of-order clears, clamps runs/times, keeps unknown fields out |
| R8 | No existing save field moves | campaign `cleared`/`unlocked`, arc ledgers, `ALL_ROOMS` indices 0–673 and every other mode key untouched |
| R9 | One door | entry lives in Level Select under the Lanternwake block, not a new top-level menu row |
| R10 | Verification | `npm test` green, `npm run smoke:frontiers` green in real Chrome, 390×844 with no horizontal overflow |

### 3.3 Difficulty model (per level index *i*, 0–99)

| Knob | Formula | Level 101 | Level 200 |
|---|---|---|---|
| Normal HP | `hpScale = 1 + i * 0.012` | ×1.00 | ×2.19 |
| Normal damage | `dmgScale = 1 + i * 0.006` | ×1.00 | ×1.59 |
| Normal speed | `speedScale = 1 + floor(i / 25) * 0.06` | ×1.00 | ×1.18 |
| Elite HP | authored `ELITE_MOBS.hp` × chapter rank, no extra level scale | 650 (E3) | 2400 (E7) |
| Boss HP | chapter table 1,400 → 4,200, then the shared difficulty multipliers | 1,400 | 4,200 |
| Ash stipend on entry | `120 + i * 4` | 120 | 516 |
| Player damage on entry | run-scoped `1 + i * 0.018` | ×1.00 | ×2.78 |
| Player vitality on entry | run-scoped HP `1 + i * 0.01`, `floor(i / 25)` extra flasks | ×1.00, +0 | ×1.99, +3 |

Player growth deliberately outruns body HP growth (×2.78 damage vs ×2.19 HP), because the ladder has no character levels and every entry resets the run. The multiplier is applied inside `startFrontierLevel` and never touches the saved character or the global difficulty.

The tables are authored, not simulated: the threat number is a guide, and the smoke test checks the *contract* (counts, phases, gates), not a damage-per-second claim.

### 3.4 UX

```
MENU → INFINITE FRONTIERS → tab KAMPANYE 101–200
 └─ summary: 12 / 100 LEVEL · 1/10 BOS · 12%
 └─ chapter rail: BAB 11 … BAB 20   (each chip shows n/10)
 └─ chapter head: name · mechanic · boss · phases
 └─ 10 cards: LV 101 … LV 110 (boss card marked BOSS · 3 FASE)
```

- A chapter chip shows `CLEAR` when its boss is down, and the number of cleared levels otherwise.
- Cards show the level number, the authored name, `N MUSUH · ELITE E4`, and either `MAINKAN` or `TERKUNCI`.
- The HUD keeps a small `LV 147 · SELATAN BATAS ASTRAL` badge while a Frontier run is live.
- Clear cards report time, level number and ash earned.

### 3.5 Files

| File | Change |
|---|---|
| `src/frontiers.js` | **new** — rooms, enemy tables, boss table, progression, validator |
| `src/core.js` | append `FRONTIER_ROOMS`, merge enemy/boss tables |
| `src/zones.js` | `frontier` zone (palette, particle, map colour, tracks) |
| `src/music.js` | `frontier` + `frontierBoss` tracks, boss-track mapping |
| `src/main.js` | progress default/sanitize, hub builder, run flow, event routing, retry, hooks |
| `index.html`, `styles-frontiers.css` | hub copy, run badge, chapter rail and card styles |
| `tests/frontiers.test.js` | model + live-core coverage |
| `tests/*.test.js` | room-count assertions 674 → 774 |
| `tools/frontiers-smoke.mjs` | browser flow |
| `README.md`, `CLAUDE.md`, `MASTERPLAN.md`, `src/updates.js`, `package.json` | release truth |

### 3.6 Risks

| Risk | Mitigation |
|---|---|
| 100 rooms bloat boot time | rooms are generated from 100 existing specs at module load, no per-room art; measure boot after the change |
| A stat wall at chapter 16 | level scaling is linear and capped; elite ranks arrive gradually; ash stipend climbs |
| Level-select DOM explosion | only ten cards render at a time (chapter rail), never 100 |
| Bosses feel same-y | each chapter gets its own pattern family, phase count, summon body and music; Phase 3 replaces the shared machine |

---

## 4. Release 2 — v0.43.0 Overdrive playable (shipped)

Scope delivered in `v0.43.0`: `OVERDRIVE_ROOMS` at ids **774–873** (100 rooms in `ALL_ROOMS = 874`), all 10 chapter bosses ending on `the_first_god` (`ALL_BOSS_INFO = 136`), 50 Overdrive enemy bodies (`ALL_ENEMY_INFO = 367`), active elemental spell slot (`Q`, 8 schools / 32 spells, mana regen + burst), 8 Legendary Weapons rewarded on chapter clears, and the 6 special level types mapped onto stages under `progress.overdrive`.

---

## 5. Definition of done for v0.42.0

1. `npm test` green with the new suite and the updated room totals.
2. `npm run smoke:frontiers` green: locked hub, unlock chain, live 20-body room, elite present, boss phase transition, victory, reload persistence, 390×844 clean, zero console errors.
3. `package.json`, `GAME_VERSION`, the Update Log, `CLAUDE.md` §0 and `MASTERPLAN.md` agree on v0.42.0 and 774 rooms.
4. Honest limits recorded: shared boss machine (Phase 3), no new level art (palettes and particles only), mounts/companions stay 3D-only.
