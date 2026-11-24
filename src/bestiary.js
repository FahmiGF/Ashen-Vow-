// Illustrated Index (bestiary) — pure data layer.
//
// The old codex only knew the seven legacy enemies and six legacy bosses. The
// game now ships hundreds of each across a dozen arcs, so the Index reads the
// same source tables the simulation uses and groups them by arc. Nothing here
// touches the DOM; portraits are painted separately by `src/portraits.js`.

import { ENEMY_INFO, BOSS_INFO } from './core.js';
import { EXPANSION_ENEMY_INFO, EXPANSION_BOSS_INFO } from './expansion.js';
import { ATLAS_ENEMY_INFO, ATLAS_BOSS_INFO } from './atlas.js';
import { COURT_ENEMY_INFO, COURT_BOSS_INFO } from './court.js';
import { PACK_BOSS_INFO } from './bosspack.js';
import { FAIRY_ENEMY_INFO, FAIRY_BOSS_INFO } from './fairy.js';
import { FALLEN_ENEMY_INFO, FALLEN_BOSS_INFO } from './fallen.js';
import { CRUSADE_ENEMY_INFO, CRUSADE_BOSS_INFO } from './crusade.js';
import { ASTRAL_ENEMY_INFO, ASTRAL_BOSS_INFO } from './astral.js';
import { ECLIPSE_ENEMY_INFO, ECLIPSE_BOSS_INFO, GODFALL_BOSS_INFO } from './eclipse.js';
import { CISTERN_ENEMY_INFO, CISTERN_BOSS_INFO } from './cistern.js';
import { LANTERN_ENEMY_INFO, LANTERN_BOSS_INFO } from './lanternwake.js';

/** Arc groups in campaign order. `accent` tints the portrait backdrop. */
export const BESTIARY_SOURCES = [
  { id: 'ashen', label: 'Sumpah Abu', accent: '#d98b58', enemies: ENEMY_INFO, bosses: BOSS_INFO },
  { id: 'echoes', label: 'Gema Terlupakan', accent: '#c9a25c', enemies: EXPANSION_ENEMY_INFO, bosses: EXPANSION_BOSS_INFO },
  { id: 'atlas', label: 'Sundered Atlas', accent: '#8f9fe8', enemies: ATLAS_ENEMY_INFO, bosses: ATLAS_BOSS_INFO },
  { id: 'court', label: 'Hollow Court', accent: '#7fa8d8', enemies: COURT_ENEMY_INFO, bosses: COURT_BOSS_INFO },
  { id: 'pack', label: 'Panggung Abadi', accent: '#e07a5f', enemies: {}, bosses: PACK_BOSS_INFO },
  { id: 'fairy', label: 'Taman Peri', accent: '#9ad27a', enemies: FAIRY_ENEMY_INFO, bosses: FAIRY_BOSS_INFO },
  { id: 'fallen', label: 'The Fallen Ones', accent: '#f1d58a', enemies: FALLEN_ENEMY_INFO, bosses: FALLEN_BOSS_INFO },
  { id: 'crusade', label: 'Radiant Crusade', accent: '#ffcf6e', enemies: CRUSADE_ENEMY_INFO, bosses: CRUSADE_BOSS_INFO },
  { id: 'astral', label: 'Astral Dominion', accent: '#b08cff', enemies: ASTRAL_ENEMY_INFO, bosses: ASTRAL_BOSS_INFO },
  { id: 'eclipse', label: 'Eclipse', accent: '#c4addd', enemies: ECLIPSE_ENEMY_INFO, bosses: { ...ECLIPSE_BOSS_INFO, ...GODFALL_BOSS_INFO } },
  { id: 'cistern', label: 'Tidewrought Cistern', accent: '#5fb8c9', enemies: CISTERN_ENEMY_INFO, bosses: CISTERN_BOSS_INFO },
  { id: 'lanternwake', label: 'The Lanternwake', accent: '#ffb85c', enemies: LANTERN_ENEMY_INFO, bosses: LANTERN_BOSS_INFO },
];

export const BESTIARY_SOURCE_BY_ID = Object.fromEntries(BESTIARY_SOURCES.map((s) => [s.id, s]));

const DEFAULT_GLYPH = { enemies: '◈', bosses: '♜' };

function firstLine(info) {
  const intro = info?.dialogue?.intro;
  if (!Array.isArray(intro) || !intro.length) return '';
  const line = intro[0];
  return typeof line === 'string' ? line : String(line?.text || '');
}

function enemyEntry(kind, info, source) {
  return {
    id: kind,
    category: 'enemies',
    source: source.id,
    sourceLabel: source.label,
    accent: info.color || source.accent,
    name: String(info.name || kind),
    title: String(info.title || ''),
    glyph: info.glyph || DEFAULT_GLYPH.enemies,
    danger: String(info.danger || (info.elite ? 'ELITE' : 'SEDANG')),
    desc: String(info.desc || ''),
    where: String(info.where || source.label),
    elite: !!info.elite,
    stats: [
      ['HP', Math.round(Number(info.hp) || 0)],
      ['DAMAGE', Math.round(Number(info.dmg) || 0)],
      ['ABU', Math.round(Number(info.reward) || 0)],
    ],
  };
}

function bossEntry(kind, info, source) {
  const phases = Math.max(1, Number(info.maxPhases) || 2);
  const quote = firstLine(info);
  return {
    id: kind,
    category: 'bosses',
    source: source.id,
    sourceLabel: source.label,
    accent: info.color || source.accent,
    name: String(info.name || kind),
    title: String(info.title || ''),
    glyph: info.glyph || DEFAULT_GLYPH.bosses,
    danger: `${phases} FASE`,
    desc: String(info.desc || quote || ''),
    quote,
    where: String(info.where || source.label),
    mini: !!info.mini,
    phases,
    stats: [
      ['HP', Math.round(Number(info.maxHp) || 0)],
      ['FASE', phases],
      ['ABU', Math.round(Number(info.ashReward ?? info.reward) || 0)],
    ],
  };
}

let cache = null;

/** Every enemy and boss the game can spawn, once each, grouped by arc. */
export function bestiaryIndex() {
  if (cache) return cache;
  const seen = { enemies: new Set(), bosses: new Set() };
  const enemies = [];
  const bosses = [];
  for (const source of BESTIARY_SOURCES) {
    for (const [kind, info] of Object.entries(source.enemies || {})) {
      if (!info || seen.enemies.has(kind)) continue;
      seen.enemies.add(kind);
      enemies.push(enemyEntry(kind, info, source));
    }
    for (const [kind, info] of Object.entries(source.bosses || {})) {
      if (!info || seen.bosses.has(kind)) continue;
      seen.bosses.add(kind);
      bosses.push(bossEntry(kind, info, source));
    }
  }
  cache = { enemies, bosses };
  return cache;
}

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

/**
 * Filter the index. `source` is an arc id or 'all'; `query` matches name,
 * title, place and arc label case- and accent-insensitively.
 */
export function bestiaryEntries(category, { source = 'all', query = '' } = {}) {
  const list = bestiaryIndex()[category] || [];
  const q = normalize(query).trim();
  return list.filter((entry) => {
    if (source !== 'all' && entry.source !== source) return false;
    if (!q) return true;
    return normalize(`${entry.name} ${entry.title} ${entry.where} ${entry.sourceLabel}`).includes(q);
  });
}

/** Arc ids that have at least one entry in the category, with counts. */
export function bestiarySources(category) {
  const list = bestiaryIndex()[category] || [];
  const counts = new Map();
  for (const entry of list) counts.set(entry.source, (counts.get(entry.source) || 0) + 1);
  return BESTIARY_SOURCES.filter((s) => counts.has(s.id)).map((s) => ({ id: s.id, label: s.label, accent: s.accent, count: counts.get(s.id) }));
}

export function bestiaryEntry(category, id) {
  return (bestiaryIndex()[category] || []).find((entry) => entry.id === id) || null;
}
