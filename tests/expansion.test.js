import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPANSION_VERSION,
  EXPANSION_ROOM_START,
  LEVELS_PER_CHAPTER,
  TOTAL_LEVELS,
  DIFFICULTIES,
  CHALLENGE_MODIFIERS,
  BIOME_LIST,
  CHAPTERS,
  ENEMY_BEHAVIORS,
  EXPANSION_ENEMY_TYPES,
  EXPANSION_ENEMY_VARIANTS,
  MINI_BOSSES,
  CHAPTER_BOSSES,
  EXPANSION_BOSS_INFO,
  EXPANSION_LEVELS,
  expansionLevelByIndex,
  expansionLevelsForChapter,
  HAVEN_UPGRADES,
  HAVEN_NPCS,
  SETTLEMENTS,
  ALL_NPCS,
  QUESTS,
  EVENT_THEMES,
  EVENT_BY_ID,
  COSMETIC_SKINS,
  REPEATABLE_MODES,
  NG_PLUS_TIERS,
  ENDGAME_TRIALS,
  COLLECTIBLE_CATEGORIES,
  COLLECTIBLE_BY_ID,
  defaultExpansionProgress,
  sanitizeExpansionProgress,
  expansionLevelUnlocked,
  expansionChapterProgress,
  expansionCompletion,
  expansionCollectibleCounts,
  expansionModifierTotals,
  applyQuestProgress,
  applyEventProgress,
  eventMissionProgress,
  eventMissionReady,
  eventPoints,
  eventTierUnlocked,
  havenBonus,
  isEventActive,
  activeEventIds,
  expansionSaveSummary,
} from '../src/expansion.js';
import { ROOMS, ALL_ROOMS, ENEMY_INFO, ALL_ENEMY_INFO, BOSS_INFO, ALL_BOSS_INFO, CODEX } from '../src/core.js';

const NOV = new Date('2026-11-12T12:00:00');
const JUN = new Date('2026-06-15T12:00:00');

test('expansion data reaches the v0.3.0 content targets', () => {
  assert.equal(EXPANSION_VERSION, '0.3.0');
  assert.equal(EXPANSION_ROOM_START, 14);
  assert.equal(LEVELS_PER_CHAPTER, 10);
  assert.equal(TOTAL_LEVELS, 100);

  assert.equal(CHAPTERS.length, 10);
  assert.equal(BIOME_LIST.length, 10);
  assert.equal(DIFFICULTIES.length, 5);
  assert.equal(CHALLENGE_MODIFIERS.length, 6);
  assert.equal(NG_PLUS_TIERS.length, 5);
  assert.equal(ENDGAME_TRIALS.length, 4);
  assert.equal(REPEATABLE_MODES.length, 8);

  assert.equal(EXPANSION_LEVELS.length, 100);
  assert.equal(EXPANSION_ENEMY_TYPES.length, 100);
  assert.ok(EXPANSION_ENEMY_VARIANTS.length >= 200);
  assert.equal(MINI_BOSSES.length, 20);
  assert.equal(CHAPTER_BOSSES.length, 10);
  assert.equal(Object.keys(EXPANSION_BOSS_INFO).length, 30);

  assert.equal(HAVEN_NPCS.length, 10);
  assert.ok(ALL_NPCS.length >= 50);
  assert.equal(SETTLEMENTS.length, 8);
  assert.equal(HAVEN_UPGRADES.length, 8);
  assert.equal(QUESTS.length, 12);

  assert.ok(EVENT_THEMES.length >= 5);
  assert.ok(COSMETIC_SKINS.length >= 20);
  assert.ok(COSMETIC_SKINS.filter((skin) => skin.eventId).length >= 20);
  assert.equal(COLLECTIBLE_CATEGORIES.length, 12);
  assert.equal(Object.keys(COLLECTIBLE_BY_ID).length, 120);

  for (const type of EXPANSION_ENEMY_TYPES) {
    assert.ok(ENEMY_BEHAVIORS[type.behavior], `${type.id} uses a known behavior`);
    assert.ok(type.hp > 0 && type.reward > 0, `${type.id} needs combat stats`);
  }
  for (const skin of COSMETIC_SKINS) {
    assert.ok(skin.name && skin.subtitle && skin.outfit && skin.skin && skin.aura, `${skin.id} needs visuals`);
    assert.equal(skin.combatBonus, undefined, 'cosmetics must never grant combat bonuses');
  }
});

test('every chapter follows the 7 + special + elite + boss structure', () => {
  for (const chapter of CHAPTERS) {
    const levels = expansionLevelsForChapter(chapter.index);
    assert.equal(levels.length, 10, `chapter ${chapter.index + 1} needs ten levels`);
    const kinds = levels.reduce((counts, level) => {
      counts[level.kind] = (counts[level.kind] || 0) + 1;
      return counts;
    }, {});
    assert.deepEqual(kinds, { standard: 7, special: 1, elite: 1, boss: 1 });

    const miniBosses = levels.filter((level) => level.kind === 'special' || level.kind === 'elite');
    assert.ok(miniBosses.every((level) => EXPANSION_BOSS_INFO[level.boss]?.mini === true));
    const boss = levels.find((level) => level.kind === 'boss');
    assert.ok(EXPANSION_BOSS_INFO[boss.boss]?.major === true);
  }
});

test('expansion rooms connect from the legacy campaign and end with a boss victory', () => {
  assert.equal(ROOMS.length, 14, 'legacy campaign must stay untouched');
  assert.equal(ALL_ROOMS.length, 14 + TOTAL_LEVELS);
  assert.equal(CODEX.enemies.length, 7);
  assert.equal(CODEX.bosses.length, 6);
  assert.equal(Object.keys(ENEMY_INFO).length, 7);
  assert.equal(Object.keys(BOSS_INFO).length, 6);
  assert.equal(Object.keys(ALL_ENEMY_INFO).length, 7 + 100);
  assert.equal(Object.keys(ALL_BOSS_INFO).length, 6 + 30);

  EXPANSION_LEVELS.forEach((level, i) => {
    assert.equal(level.globalIndex, EXPANSION_ROOM_START + i);
    assert.equal(level.localIndex, i);
    assert.equal(ALL_ROOMS[level.globalIndex], level);
    assert.equal(level.chapterIndex, Math.floor(i / LEVELS_PER_CHAPTER));
    if (i < TOTAL_LEVELS - 1) {
      assert.equal(level.gate?.next, level.globalIndex + 1, `level ${i} must lead to ${i + 1}`);
    } else {
      assert.equal(level.gate, null, 'the final room ends on the campaign boss');
    }
  });
  assert.equal(EXPANSION_LEVELS[99].boss, CHAPTER_BOSSES[9].kind);
  assert.equal(EXPANSION_BOSS_INFO[EXPANSION_LEVELS[99].boss].reward, 'victory');
});

test('level unlocks respect chapter gates and cleared predecessors', () => {
  const expansion = defaultExpansionProgress();
  assert.equal(expansionLevelUnlocked(expansion, 0), true);
  assert.equal(expansionLevelUnlocked(expansion, 1), false);
  assert.equal(expansionLevelUnlocked(expansion, 10), false);
  assert.equal(expansionLevelUnlocked(expansion, -1), false);
  assert.equal(expansionLevelUnlocked(expansion, 100), false);
  assert.equal(expansionLevelUnlocked(null, 0), false);

  expansion.cleared[0] = true;
  assert.equal(expansionLevelUnlocked(expansion, 1), true);
  assert.equal(expansionLevelUnlocked(expansion, 2), false);

  expansion.unlockedChapter = 1;
  assert.equal(expansionLevelUnlocked(expansion, 10), true);
  assert.equal(expansionLevelUnlocked(expansion, 11), false);

  expansion.cleared[10] = true;
  assert.equal(expansionLevelUnlocked(expansion, 11), true);
  assert.deepEqual(expansionChapterProgress(expansion, 0), { cleared: 1, total: 10, pct: 10 });
  assert.deepEqual(expansionCompletion(expansion), { cleared: 2, total: 100, pct: 2 });
});

test('expansion boss and room lookups resolve generated content', () => {
  assert.equal(expansionLevelByIndex(14).name, EXPANSION_LEVELS[0].name);
  assert.equal(expansionLevelByIndex(113), EXPANSION_LEVELS[99]);
  assert.equal(expansionLevelByIndex(13), null);
  assert.equal(expansionLevelByIndex(114), null);
  assert.equal(expansionLevelsForChapter(9).length, 10);

  const patterns = new Set(['slam', 'volley', 'ring', 'charge', 'summon', 'rain']);
  for (const boss of [...MINI_BOSSES, ...CHAPTER_BOSSES]) {
    assert.ok(patterns.has(boss.pattern), `${boss.id} uses a supported pattern`);
    assert.equal(EXPANSION_BOSS_INFO[boss.kind].name, boss.name);
    assert.ok(boss.dialogue.intro.length > 0, `${boss.id} needs intro dialogue`);
    assert.ok(boss.dialogue.defeat.length > 0, `${boss.id} needs defeat dialogue`);
  }
});

test('sanitizeExpansionProgress migrates sparse saves and keeps earned rewards', () => {
  const raw = {
    unlockedChapter: 99,
    echoes: -20,
    difficulty: 'unknown',
    modifiers: ['blind', 'bogus', 'blind'],
    ngPlus: 99,
    cleared: { 0: true, 5: true, 104: true },
    cosmetics: ['skin_forgotten', 'skin_bogus', 'skin_forgotten'],
    selectedSkin: 'skin_bogus',
    collectibles: ['relics_1', 'bogus', 'relics_1'],
    settlements: { thornveil: { tier: 9, upgrades: { forge: 9, bogus: 4 }, visited: true } },
    quests: { q_first_vow: { status: 'done', progress: 3 }, q_forge: { status: 'weird', progress: -5 } },
    events: {
      ashen_festival: {
        points: 120,
        missionsClaimed: ['fest_clear', 'fest_clear'],
        tiersClaimed: [20, 20],
        shopPurchased: ['ashen_festival_skin_1'],
        spent: 60,
        __mission_fest_clear: 5,
      },
    },
    stash: { tonic: 3, whetstone: 1.8, bomb: -2, bogus: 9 },
    modes: { boss_rush: { completions: 2, best: 4 } },
    flags: { campaignComplete: true, customFlag: true },
    stats: { deaths: 7 },
    customNotes: 'keep me',
  };

  const expansion = sanitizeExpansionProgress(raw);
  assert.equal(expansion.version, 1);
  assert.equal(expansion.unlockedChapter, 9);
  assert.equal(expansion.echoes, 0);
  assert.equal(expansion.difficulty, 'normal');
  assert.deepEqual(expansion.modifiers, ['blind']);
  assert.equal(expansion.ngPlus, NG_PLUS_TIERS.length - 1);
  assert.equal(expansion.cleared.length, 100);
  assert.equal(expansion.cleared[0], true);
  assert.equal(expansion.cleared[5], true);
  assert.equal(expansion.cleared[99], false);
  assert.deepEqual(expansion.cosmetics, ['skin_forgotten']);
  assert.equal(expansion.selectedSkin, null);
  assert.deepEqual(expansion.collectibles, ['relics_1']);
  assert.equal(expansion.settlements.thornveil.tier, 3);
  assert.equal(expansion.settlements.thornveil.upgrades.forge, 3);
  assert.equal(expansion.settlements.thornveil.upgrades.bogus, undefined);
  assert.equal(expansion.quests.q_first_vow.status, 'done');
  assert.equal(expansion.quests.q_forge.status, 'locked');
  assert.deepEqual(expansion.events.ashen_festival.missionsClaimed, ['fest_clear']);
  assert.deepEqual(expansion.events.ashen_festival.tiersClaimed, [20]);
  assert.equal(expansion.events.ashen_festival.spent, 60);
  assert.equal(expansion.events.ashen_festival.__mission_fest_clear, 5);
  assert.deepEqual(expansion.stash, { tonic: 3, whetstone: 1 });
  assert.equal(expansion.modes.boss_rush.completions, 2);
  assert.equal(expansion.modes.boss_rush.best, 4);
  assert.equal(expansion.flags.campaignComplete, true);
  assert.equal(expansion.flags.customFlag, true);
  assert.equal(expansion.stats.deaths, 7);
  assert.equal(expansion.stats.levels, 0);
  assert.equal(expansion.customNotes, 'keep me');
  assert.deepEqual(sanitizeExpansionProgress(null), defaultExpansionProgress());
});

test('quest progress activates objectives and freezes finished quests', () => {
  const expansion = defaultExpansionProgress();
  assert.equal(expansion.quests.q_first_vow.status, 'locked');

  assert.deepEqual(applyQuestProgress(expansion, 'level'), []);
  assert.equal(expansion.quests.q_first_vow.status, 'active');
  assert.equal(expansion.quests.q_first_vow.progress, 1);

  applyQuestProgress(expansion, 'level');
  const ready = applyQuestProgress(expansion, 'level');
  assert.deepEqual(ready, ['q_first_vow']);
  assert.equal(expansion.quests.q_first_vow.status, 'ready');
  assert.equal(expansion.quests.q_first_vow.progress, 3);

  expansion.quests.q_first_vow.status = 'done';
  applyQuestProgress(expansion, 'level');
  assert.equal(expansion.quests.q_first_vow.progress, 3, 'finished quests stop counting');

  applyQuestProgress(expansion, 'upgrade', { upgrade: 'forge', tier: 1 });
  assert.equal(expansion.quests.q_forge.status, 'active');
  assert.equal(expansion.quests.q_forge.progress, 1);
  const forgeReady = applyQuestProgress(expansion, 'upgrade', { upgrade: 'forge', tier: 2 });
  assert.deepEqual(forgeReady, ['q_forge']);
  assert.equal(expansion.quests.q_forge.status, 'ready');

  applyQuestProgress(expansion, 'collectible', { category: 'pelts' });
  assert.equal(expansion.quests.q_weave.progress, 1);
  applyQuestProgress(expansion, 'collectible', { category: 'tablets' });
  assert.equal(expansion.quests.q_weave.progress, 1, 'categories must match');

  applyQuestProgress(expansion, 'boss', { chapter: 1 });
  assert.equal(expansion.quests.q_bog.status, 'ready');
  applyQuestProgress(expansion, 'chapter', { chapter: 1 });
  assert.equal(expansion.quests.q_gate.status, 'ready');
});

test('event progress only counts during active months and rewards survive expiry', () => {
  const expansion = defaultExpansionProgress();
  const festival = EVENT_BY_ID.ashen_festival;
  assert.equal(isEventActive(festival, NOV), true);
  assert.equal(isEventActive(EVENT_BY_ID.bell_moon, NOV), false);
  assert.deepEqual(activeEventIds(NOV), ['ashen_festival']);

  for (let i = 0; i < 5; i += 1) applyEventProgress(expansion, 'level', {}, NOV);
  assert.equal(eventMissionProgress(expansion.events.ashen_festival, festival.missions[0]), 5);
  assert.equal(eventMissionReady(expansion.events.ashen_festival, festival.missions[0]), true);
  assert.equal(expansion.events.bell_moon.__mission_bell_clear, undefined, 'inactive events stay frozen');
  assert.equal(expansion.events.ashen_festival.__mission_fest_clear, 5);

  applyEventProgress(expansion, 'level', {}, JUN);
  assert.equal(expansion.events.ashen_festival.__mission_fest_clear, 5, 'festival is inactive in June');
  assert.equal(expansion.events.storm_night.__mission_storm_clear, 1, 'storm night is active in June');

  const state = expansion.events.ashen_festival;
  state.missionsClaimed.push('fest_clear');
  state.tiersClaimed.push(20);
  state.shopPurchased.push('ashen_festival_skin_1');
  state.spent = 60;
  expansion.cosmetics.push('skin_festival_pyre');

  const reloaded = sanitizeExpansionProgress(JSON.parse(JSON.stringify(expansion)));
  const persisted = reloaded.events.ashen_festival;
  assert.deepEqual(persisted.missionsClaimed, ['fest_clear']);
  assert.deepEqual(persisted.tiersClaimed, [20]);
  assert.deepEqual(persisted.shopPurchased, ['ashen_festival_skin_1']);
  assert.equal(persisted.spent, 60);
  assert.ok(reloaded.cosmetics.includes('skin_festival_pyre'));
  assert.equal(eventPoints(persisted, festival), 20, 'claimed points remain after the event ends');
  assert.equal(eventTierUnlocked(persisted, festival, festival.rewardTrack[0]), true);
  assert.equal(eventTierUnlocked(persisted, festival, festival.rewardTrack[1]), false);
});

test('haven upgrades stack permanent bonuses and never exceed max tier', () => {
  const expansion = defaultExpansionProgress();
  assert.deepEqual(havenBonus(expansion), {
    damage: 0, maxHp: 0, flasks: 0, gain: 0, heal: 0, echo: 0, travel: 0, ng: 0,
  });

  expansion.settlements.thornveil.upgrades.forge = 2;
  expansion.settlements.thornveil.upgrades.infirmary = 1;
  expansion.settlements.thornveil.upgrades.shrine = 3;
  expansion.settlements.thornveil.upgrades.hall = 1;
  const bonus = havenBonus(expansion);
  assert.equal(bonus.damage, 0.16);
  assert.equal(bonus.maxHp, 15);
  assert.equal(bonus.flasks, 3);
  assert.equal(bonus.echo, 0.1);

  const sanitized = sanitizeExpansionProgress({
    settlements: { thornveil: { upgrades: { forge: 99, shrine: -4 } } },
  });
  assert.equal(sanitized.settlements.thornveil.upgrades.forge, 3);
  assert.equal(sanitized.settlements.thornveil.upgrades.shrine, 0);
});

test('modifier totals multiply danger while collectibles track categories', () => {
  assert.deepEqual(expansionModifierTotals([]), {
    hp: 1, dmg: 1, incoming: 1, flasks: 0, extraEnemies: 0, ash: 1, echo: 1, noSigils: false, fog: false,
  });
  const totals = expansionModifierTotals(['iron_skin', 'glass_blade', 'blind']);
  assert.equal(totals.hp, 0.75);
  assert.equal(totals.dmg, 1.35);
  assert.equal(totals.incoming, 1.35);
  assert.equal(totals.fog, true);
  assert.equal(expansionModifierTotals(['nope']).hp, 1);

  const expansion = defaultExpansionProgress();
  expansion.collectibles = ['relics_1', 'relics_2', 'songs_1'];
  const counts = expansionCollectibleCounts(expansion);
  assert.equal(counts.relics, 2);
  assert.equal(counts.songs, 1);
  assert.equal(counts.masks, 0);

  const summary = expansionSaveSummary(expansion);
  assert.equal(summary.levels, 0);
  assert.equal(summary.collectibles, 3);
  assert.equal(summary.chapter, 1);
  assert.equal(summary.ngPlus, 0);
});
