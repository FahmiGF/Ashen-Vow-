# Phase 4 PRD — Through the Rift (v0.44.0+)

> Status: **v0.44.0 SHIPPED** (Arc IV — The Rift) · **v0.45.0 SHIPPED** (The Unwritten Expanse + Oath Sigils) · **v0.46.0 NEXT** (Arc V — The Ashfall Accord)

## 1. Shipped in v0.44.0 (Update XXXIV)

### Arc IV: The Rift (`src/rift.js`, rooms `874–900`)
- **Scope**: 27 playable rooms (`RIFT_ROOM_START = 874`), organized into 5 regions × 5 stages plus 2 secret vaults (`899` *Fractured Reliquary* and `900` *Unseamed Vault*).
- **Regions**:
  1. `rift_mouth` (*Rift Mouth* — `874–878`, Boss: **Herald of the Maw**)
  2. `inverted_bastion` (*Inverted Bastion* — `879–883`, Boss: **Inverted Castellan**)
  3. `glass_sea` (*Sea of Glass Knives* — `884–888`, Boss: **Shattered Glass Seraph**)
  4. `hollow_orchard` (*Hollow Orchard of Echoes* — `889–893`, Boss: **Orchard Echo Matriarch**)
  5. `the_seam` (*The Seam* — `894–898`, Mid-boss: **Arbiter of the Seam** at `897`, Final Boss: **The Devilish Scum** at `898`, 3 phases, `reward: 'victory'`)
- **Roster**: 8 `rift_*` enemy archetypes (`rift_shardling`, `rift_watcher`, `rift_skitter`, `rift_anchor_brute`, `rift_glass_weaver`, `rift_echo_hound`, `rift_veil`, `rift_seam_warden`) and 6 multi-phase bosses with full dialogue scripts (`ALL_ROOMS = 901`, `ALL_BOSS_INFO = 142`, `ALL_ENEMY_INFO = 375`).
- **Hub & Unlock**: `CRUSADE_RIFT` unlocked (`locked: false`), accessible from Title (`#btn-rift-menu`), Crusade menu, and Story Map (`STORY_ARCS` `rift` promoted to `kind: 'main'`).

### Unique Gameplay Innovations
1. **Dual-Reality Fracture & Phase-Shift (`[F]` / `#rift-badge`)**:
   - Every Rift room contains overlapping Phase `A` (`reality: 'a'`) and Phase `B` (`reality: 'b'`) platforms alongside solid anchor floors.
   - Realities auto-alternate every `8.0s` (with a `1.5s` visual screen-edge telegraph), OR immediately when the player triggers **Phase-Shift (`KeyF`)** (`2.2s` cooldown, `0.24s` brief i-frames, 185 px Rift Shockwave that damages nearby foes and shatters `veil` shields).
   - Inactive reality platforms render as translucent dashed wireframes so traversal routes (including Phase-B bridges to secret rooms `899–900`) remain readable at all times.
2. **Campaign-Wide Oath Resonance / Style Meter (`D → C → B → A → S → ASHEN`)**:
   - Active across all 2D `AshenGame` campaign & arc runs (`this.resonance` `0–100`, `this.resonanceRank`).
   - Built by consecutive hits, heavy finishers, boss hits, perfect dodges, and Phase-Shifts; decays slowly after `4.5s` idle and drops on taking damage.
   - Grants live combat scaling (**+0% to +30% damage**, **+0% to +12% movement speed**) and shatters enemy `veil` shields automatically at Rank `A+` (`resonance >= 55`).

## 2. Next Planned Milestones (PRD Status)

| Milestone | Target | Status | Scope & Exit Criteria |
| --- | --- | --- | --- |
| **v0.44.0 · Arc IV — The Rift** | Phase 4.1 | **SHIPPED** | 27 rooms (`874–900`), 6 bosses ending on The Devilish Scum, Dual-Reality Fracture `[F]`, Oath Resonance meter, Story Map & Credits wired, Chrome smoke + Node tests green. |
| **v0.45.0 · The Unwritten Expanse** | Phase 4.2 | **SHIPPED** | 30 expedition rooms (`901–930`) across 3 chapters, 6 `unwritten_*` enemies, 4 bosses ending on **The Blank Author**, 4 Resonance-linked **Oath Sigils**, and **Ink Severance `[G]`**. |
| **v0.46.0 · Arc V — The Ashfall Accord** | Phase 4.3 | **NEXT / PLANNED** | Resolve the reserved `Arc V` slot in `MASTERPLAN` & Story Map with faction diplomacy/betrayal encounters and dual-stance weapon switching. |
| **v0.47.0 · Masterplan P2–P3 Perf & Audio** | Phase 5 | **PLANNED** | Further startup bundle splitting (`≤900 KB` cold JS target), 30-minute memory soak verification, and 4-player co-op bandwidth profiling. |
