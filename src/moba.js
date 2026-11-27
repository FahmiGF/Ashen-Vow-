// Ashen Vow — Riftwar: a deterministic top-down 5v5 MOBA layer.
// Pure data + simulation. The browser shell owns input, DOM and rendering.
import { CHARACTERS } from './core.js';
import { FRONTIER_CLASSES } from './frontier.js';

export const MOBA_VERSION = '1.0.0';
export const MOBA_NAME = 'Ashen Vow — Riftwar';
export const MOBA_TEAM_SIZE = 5;
export const MOBA_MATCH_LIMIT = 900;
export const MOBA_EPIC_TIME = 90;
export const MOBA_LANES = ['top', 'mid', 'bot', 'jungle', 'roam'];

export const MOBA_ROLES = {
  tank: { name: 'Tank', color: '#4a90e2', range: 82, hp: 1.22, attack: 0.86, speed: 0.92, armor: 0.24 },
  fighter: { name: 'Fighter', color: '#e9a23b', range: 88, hp: 1.08, attack: 1.04, speed: 1.02, armor: 0.14 },
  assassin: { name: 'Assassin', color: '#b56cff', range: 78, hp: 0.82, attack: 1.22, speed: 1.22, armor: 0.06 },
  marksman: { name: 'Marksman', color: '#70d66b', range: 240, hp: 0.8, attack: 1.12, speed: 1.02, armor: 0.06 },
  mage: { name: 'Mage', color: '#58c7e8', range: 205, hp: 0.78, attack: 1.28, speed: 1.0, armor: 0.04 },
  support: { name: 'Support', color: '#f1c7a4', range: 180, hp: 0.92, attack: 0.86, speed: 1.04, armor: 0.12 },
};

const CORE_ROLE = {
  Knight: 'tank',
  'Elf Archer': 'marksman',
  Assassin: 'assassin',
  Brawler: 'fighter',
  Mage: 'mage',
  Gladiator: 'fighter',
  Netfighter: 'support',
  Stormcaller: 'mage',
  Sentinel: 'tank',
  Warden: 'tank',
  Ashwright: 'fighter',
  Hearthkeeper: 'support',
  Glassblade: 'assassin',
};

const FRONTIER_ROLE = {
  warden: 'tank',
  arcanist: 'mage',
  shadowblade: 'assassin',
  ranger: 'marksman',
  templar: 'support',
  reaver: 'fighter',
  beastcaller: 'fighter',
  spellbreaker: 'fighter',
  gunsmith: 'marksman',
  bloodweaver: 'mage',
  chronomancer: 'mage',
  stormcaller: 'assassin',
  plague_doctor: 'support',
  soul_knight: 'tank',
  riftwalker: 'assassin',
};

const ROLE_KIT = {
  tank: [
    { name: 'Shield Bash', desc: 'Menerjang ke depan, meremukkan musuh pertama dan memperlambatnya.', kind: 'dash' },
    { name: 'Ground Slam', desc: 'Gelombang kejut di sekitar tubuh.', kind: 'burst' },
    { name: 'Iron Wall', desc: 'Memulihkan HP dan memasang perisai sementara.', kind: 'guard' },
    { name: 'Unbreakable Vow', desc: 'Badai benturan yang melindungi seluruh sekutu di dekatnya.', kind: 'ultimate' },
  ],
  fighter: [
    { name: 'Cleaving Strike', desc: 'Tebasan lebar yang menghantam semua musuh di depan.', kind: 'dash' },
    { name: 'Whirlwind', desc: 'Berputar dan memotong semua musuh di sekitar.', kind: 'burst' },
    { name: 'Bloodthirst', desc: 'Menyerap darah dari luka terdekat untuk memulihkan diri.', kind: 'guard' },
    { name: 'Executioner', desc: 'Hantaman pamungkas yang menghancurkan barisan musuh.', kind: 'ultimate' },
  ],
  assassin: [
    { name: 'Shadow Step', desc: 'Melompat menembus musuh dan menebas jalur lintasan.', kind: 'dash' },
    { name: 'Fan of Knives', desc: 'Ledakan bilah di sekitar target.', kind: 'burst' },
    { name: 'Veilstep', desc: 'Menghilang sejenak dan memulihkan sebagian HP.', kind: 'guard' },
    { name: 'Death Mark', desc: 'Tanda kematian yang meledak setelah satu detik.', kind: 'ultimate' },
  ],
  marksman: [
    { name: 'Piercing Shot', desc: 'Anak panah panjang yang menembus semua musuh.', kind: 'bolt' },
    { name: 'Volley', desc: 'Hujan proyektil di area target.', kind: 'burst' },
    { name: 'Evade', desc: 'Berguling dan memulihkan fokus.', kind: 'guard' },
    { name: 'Snipe', desc: 'Tembakan penentu dari jarak sangat jauh.', kind: 'ultimate' },
  ],
  mage: [
    { name: 'Arcane Bolt', desc: 'Proyektil sihir yang meledak saat menghantam.', kind: 'bolt' },
    { name: 'Elemental Burst', desc: 'Ledakan elemen di area target.', kind: 'burst' },
    { name: 'Mana Ward', desc: 'Perisai mana yang menyerap damage.', kind: 'guard' },
    { name: 'Meteor Fall', desc: 'Meteor besar menghantam area luas dan memperlambat.', kind: 'ultimate' },
  ],
  support: [
    { name: 'Binding Light', desc: 'Berkas cahaya yang mengikat dan memperlambat target.', kind: 'bolt' },
    { name: 'Aura Pulse', desc: 'Denyut penyembuh yang melukai musuh di sekitar.', kind: 'burst' },
    { name: 'Mend', desc: 'Memulihkan HP diri dan sekutu terdekat.', kind: 'guard' },
    { name: 'Sanctuary', desc: 'Kubah suci yang menyembuhkan sekutu dan menghukum musuh.', kind: 'ultimate' },
  ],
};

function makeAbilities(source, role) {
  const kit = ROLE_KIT[role] || ROLE_KIT.fighter;
  const original = source.abilities
    ? source.abilities.map((ability) => ({ name: ability.name, desc: ability.desc, type: ability.type }))
    : source.ability
      ? [{ name: source.ability.name, desc: source.ability.desc }]
      : [];
  return kit.map((entry, index) => {
    const base = original[index] || original[0] || null;
    const ultimate = index === 3;
    return {
      slot: ['Q', 'W', 'E', 'R'][index],
      name: base?.name || entry.name,
      desc: base?.desc || entry.desc,
      kind: entry.kind,
      cooldown: [4.5, 8, 12, ultimate ? 32 : 18][index],
      mana: [20, 30, 40, 95][index],
      passive: base?.type === 'passive',
    };
  });
}

function heroFromCore(character) {
  const role = CORE_ROLE[character.className] || 'fighter';
  const stats = MOBA_ROLES[role];
  return {
    id: `core_${character.id}`,
    source: 'core',
    sourceId: character.id,
    name: character.name,
    className: character.className,
    title: character.title,
    glyph: character.glyph || '⚔',
    color: stats.color,
    role,
    hp: Math.round((500 + character.maxHp * 2.35) * stats.hp),
    attack: Math.round((34 + character.damage * 30) * stats.attack),
    speed: Math.round(148 * character.speed * stats.speed),
    range: stats.range,
    armor: stats.armor,
    crit: role === 'assassin' ? 0.22 : role === 'marksman' ? 0.16 : 0.08,
    abilities: makeAbilities(character, role),
    lore: character.desc,
  };
}

function heroFromFrontier(cls) {
  const role = FRONTIER_ROLE[cls.id] || 'fighter';
  const stats = MOBA_ROLES[role];
  return {
    id: `frontier_${cls.id}`,
    source: 'frontier',
    sourceId: cls.id,
    name: cls.name,
    className: cls.name,
    title: cls.title,
    glyph: cls.icon || '✦',
    color: cls.color || stats.color,
    role,
    hp: Math.round((480 + cls.baseStats.hp * 2.35) * stats.hp),
    attack: Math.round((34 + cls.baseStats.attack * 28) * stats.attack),
    speed: Math.round(148 * cls.baseStats.speed * stats.speed),
    range: stats.range,
    armor: Math.max(stats.armor, cls.baseStats.armor || 0),
    crit: cls.baseStats.crit || 0.08,
    abilities: makeAbilities(cls, role),
    lore: cls.combatIdentity,
  };
}

// Every playable class from both rosters is selectable in Riftwar.
export const MOBA_HEROES = [
  ...Object.values(CHARACTERS).map(heroFromCore),
  ...FRONTIER_CLASSES.map(heroFromFrontier),
];
export const MOBA_HERO_BY_ID = Object.fromEntries(MOBA_HEROES.map((hero) => [hero.id, hero]));
export const MOBA_HERO_COUNT = MOBA_HEROES.length;

export const MOBA_DIFFICULTIES = [
  { id: 'squire', name: 'Squire', desc: 'AI lebih lambat, respawn lebih cepat.', ai: 0.78, gold: 1.15 },
  { id: 'knight', name: 'Knight', desc: 'Pertempuran seimbang.', ai: 1, gold: 1 },
  { id: 'veteran', name: 'Veteran', desc: 'AI lebih agresif dan memakai jurus.', ai: 1.2, gold: 0.9 },
  { id: 'worldbreaker', name: 'Worldbreaker', desc: 'AI kejam, tower lebih tebal.', ai: 1.45, gold: 0.8 },
];

export const MOBA_MINION_TYPES = [
  { id: 'footman', name: 'Ashen Footman', short: 'F', hp: 145, damage: 14, speed: 74, range: 40, attackCd: 1.15, gold: 22, xp: 22, radius: 8, color: '#b9b0a1' },
  { id: 'archer', name: 'Ash Archer', short: 'A', hp: 105, damage: 18, speed: 70, range: 165, attackCd: 1.45, gold: 26, xp: 26, radius: 7, color: '#8fc7b9' },
  { id: 'siege', name: 'Rift Siege Wagon', short: 'S', hp: 330, damage: 30, speed: 52, range: 195, attackCd: 1.9, gold: 48, xp: 42, radius: 13, color: '#d8a45e' },
  { id: 'brute', name: 'Vow Brute', short: 'B', hp: 260, damage: 24, speed: 62, range: 50, attackCd: 1.5, gold: 38, xp: 34, radius: 11, color: '#c77958' },
  { id: 'healer', name: 'Ashen Acolyte', short: 'H', hp: 125, damage: 10, speed: 68, range: 150, attackCd: 1.4, gold: 30, xp: 30, radius: 8, color: '#e4d28c', heal: 12 },
  { id: 'super', name: 'Oathsworn Colossus', short: 'C', hp: 780, damage: 55, speed: 48, range: 70, attackCd: 1.7, gold: 90, xp: 80, radius: 18, color: '#ffb15c' },
];
export const MOBA_MINION_BY_ID = Object.fromEntries(MOBA_MINION_TYPES.map((type) => [type.id, type]));

export const MOBA_JUNGLE_MOBS = [
  { id: 'ash_wolf', name: 'Ash Wolf', hp: 480, damage: 28, speed: 82, range: 48, gold: 55, buff: 'Bite', lore: 'Serigala yang memakan abu leluhurnya untuk tetap hidup.' },
  { id: 'cinder_boar', name: 'Cinder Boar', hp: 620, damage: 34, speed: 64, range: 52, gold: 62, buff: 'Charge', lore: 'Babir hutan yang punggungnya masih menyala setelah kebakaran pertama.' },
  { id: 'mire_toad', name: 'Mire Toad', hp: 540, damage: 25, speed: 58, range: 60, gold: 58, buff: 'Toxin', lore: 'Katak rawa yang bernapas racun dan bersuara seperti lonceng tenggelam.' },
  { id: 'hollow_stag', name: 'Hollow Stag', hp: 510, damage: 30, speed: 94, range: 54, gold: 56, buff: 'Swift', lore: 'Rusa tanpa bayangan; ia berlari menuju tempat yang belum pernah ada.' },
  { id: 'stone_husk', name: 'Stone Husk', hp: 900, damage: 38, speed: 48, range: 56, gold: 78, buff: 'Bulwark', lore: 'Sisa penjaga tambang yang lupa cara berhenti berjaga.' },
  { id: 'grave_moth', name: 'Grave Moth', hp: 430, damage: 32, speed: 88, range: 90, gold: 52, buff: 'Dust', lore: 'Sayapnya menyimpan debu dari setiap nama yang tidak sempat diucapkan.' },
  { id: 'coral_hunter', name: 'Coral Hunter', hp: 560, damage: 36, speed: 76, range: 62, gold: 60, buff: 'Bleed', lore: 'Pemburu yang tumbuh dari karang dan menunggu di antara pasang.' },
  { id: 'thunder_hare', name: 'Thunder Hare', hp: 390, damage: 22, speed: 115, range: 48, gold: 50, buff: 'Haste', lore: 'Kelinci yang larinya meninggalkan guntur kecil di tanah.' },
  { id: 'glass_crab', name: 'Glass Crab', hp: 700, damage: 40, speed: 42, range: 54, gold: 72, buff: 'Reflect', lore: 'Cangkangnya memantulkan luka kembali kepada penyerang.' },
  { id: 'dune_lurker', name: 'Dune Lurker', hp: 650, damage: 42, speed: 68, range: 66, gold: 68, buff: 'Ambush', lore: 'Ia tidak bersembunyi di pasir; pasir yang bersembunyi di dalamnya.' },
  { id: 'root_warden', name: 'Root Warden', hp: 860, damage: 34, speed: 50, range: 72, gold: 76, buff: 'Regrowth', lore: 'Akar tua yang masih menagih upah dari peziarah pertama.' },
  { id: 'void_serpent', name: 'Void Serpent', hp: 740, damage: 46, speed: 72, range: 80, gold: 82, buff: 'Rift', lore: 'Ular yang meluncur di antara dua tempat pada waktu yang sama.' },
];
export const MOBA_JUNGLE_BY_ID = Object.fromEntries(MOBA_JUNGLE_MOBS.map((mob) => [mob.id, mob]));

export const MOBA_EPIC_BOSSES = [
  { id: 'rift_serpent', name: 'The Rift Serpent', title: 'Penjaga Celah', hp: 5200, damage: 105, speed: 54, range: 110, gold: 650, buff: 'Luka Celah', lore: 'Ular raksasa yang menelan jalan antara dua dunia. Membunuhnya memberi seluruh tim luka yang menembus armor.' },
  { id: 'ashen_colossus', name: 'The Ashen Colossus', title: 'Raja Pertama Abu', hp: 6800, damage: 125, speed: 42, range: 130, gold: 720, buff: 'Mahkota Abu', lore: 'Raja pertama yang memilih dibakar daripada menyerah. Tubuhnya masih menutup gerbang bawah.' },
  { id: 'ember_hydra', name: 'The Ember Hydra', title: 'Tiga Nafas Bara', hp: 6100, damage: 115, speed: 48, range: 120, gold: 690, buff: 'Nafas Bara', lore: 'Setiap kepala bernyanyi dengan nada berbeda; hanya satu yang benar-benar ingin kau bunuh.' },
  { id: 'sunken_oracle', name: 'The Sunken Oracle', title: 'Mata Palung', hp: 5600, damage: 110, speed: 44, range: 145, gold: 670, buff: 'Bisikan Palung', lore: 'Oracle yang melihat masa depan dan memilih tenggelam agar tidak perlu menyebutkannya.' },
  { id: 'crown_devourer', name: 'The Crown Devourer', title: 'Pemakan Tahta', hp: 7200, damage: 135, speed: 46, range: 125, gold: 750, buff: 'Tahta Retak', lore: 'Makhluk yang memakan mahkota dan menyimpan semua raja di dalam perutnya.' },
  { id: 'last_anchor', name: 'The Last Anchor', title: 'Jangkar Terakhir', hp: 6600, damage: 120, speed: 40, range: 135, gold: 710, buff: 'Jangkar', lore: 'Jangkar yang menahan dunia agar tidak hanyut. Ia tidak menyerang karena marah, tetapi karena harus tetap di tempatnya.' },
];
export const MOBA_EPIC_BY_ID = Object.fromEntries(MOBA_EPIC_BOSSES.map((boss) => [boss.id, boss]));

const MAP_BLUEPRINTS = [
  {
    id: 'ashen_rift',
    name: 'Ashen Rift',
    subtitle: 'Celah Tiga Jalur',
    lore: 'Jalur perdagangan tua yang terbelah saat Sumpah Pertama patah. Tiga jalur menuju jantung abu, dan sesuatu bernyanyi di bawah jembatan tengah.',
    w: 2400,
    h: 1400,
    sky: '#120d0b',
    ground: '#211711',
    lane: '#80664a',
    river: '#173e46',
    blue: '#4cc9f0',
    red: '#ef476f',
    base: { blue: { x: 230, y: 700 }, red: { x: 2170, y: 700 } },
    lanes: {
      top: [[230, 700], [430, 230], [1970, 230], [2170, 700]],
      mid: [[230, 700], [1200, 700], [2170, 700]],
      bot: [[230, 700], [430, 1170], [1970, 1170], [2170, 700]],
    },
    camps: [
      { x: 790, y: 460, type: 'ash_wolf' }, { x: 1610, y: 460, type: 'cinder_boar' },
      { x: 760, y: 930, type: 'grave_moth' }, { x: 1640, y: 930, type: 'stone_husk' },
      { x: 1060, y: 420, type: 'hollow_stag' }, { x: 1340, y: 980, type: 'void_serpent' },
    ],
    epics: [{ x: 1080, y: 360, boss: 'rift_serpent' }, { x: 1320, y: 1040, boss: 'ashen_colossus' }],
  },
  {
    id: 'ember_vale',
    name: 'Ember Vale',
    subtitle: 'Lembah Bara',
    lore: 'Lembah tempat tungku pertama menyala. Jalur atas melewati akar bara, jalur bawah menyusuri sungai abu yang tidak pernah dingin.',
    w: 2300,
    h: 1300,
    sky: '#170b09',
    ground: '#2a1710',
    lane: '#9b6538',
    river: '#4b1e1c',
    blue: '#f4a261',
    red: '#9b5de5',
    base: { blue: { x: 210, y: 650 }, red: { x: 2090, y: 650 } },
    lanes: {
      top: [[210, 650], [520, 220], [1780, 220], [2090, 650]],
      mid: [[210, 650], [1150, 650], [2090, 650]],
      bot: [[210, 650], [640, 1080], [1660, 1080], [2090, 650]],
    },
    camps: [
      { x: 690, y: 400, type: 'stone_husk' }, { x: 1510, y: 400, type: 'thunder_hare' },
      { x: 820, y: 990, type: 'cinder_boar' }, { x: 1460, y: 960, type: 'mire_toad' },
      { x: 1050, y: 320, type: 'glass_crab' }, { x: 1260, y: 1010, type: 'root_warden' },
    ],
    epics: [{ x: 1080, y: 340, boss: 'ember_hydra' }, { x: 1210, y: 1030, boss: 'crown_devourer' }],
  },
  {
    id: 'sunken_crown',
    name: 'Sunken Crown',
    subtitle: 'Mahkota Tenggelam',
    lore: 'Kota mahkota yang tenggelam ketika raja terakhir menolak melepaskan tahtanya. Airnya memantulkan jalur yang belum pernah dilalui.',
    w: 2500,
    h: 1500,
    sky: '#07151a',
    ground: '#0f2528',
    lane: '#537b72',
    river: '#154a55',
    blue: '#80ed99',
    red: '#ffd166',
    base: { blue: { x: 240, y: 750 }, red: { x: 2260, y: 750 } },
    lanes: {
      top: [[240, 750], [470, 250], [2030, 250], [2260, 750]],
      mid: [[240, 750], [1250, 750], [2260, 750]],
      bot: [[240, 750], [470, 1250], [2030, 1250], [2260, 750]],
    },
    camps: [
      { x: 820, y: 500, type: 'coral_hunter' }, { x: 1680, y: 500, type: 'dune_lurker' },
      { x: 800, y: 1010, type: 'grave_moth' }, { x: 1690, y: 1010, type: 'void_serpent' },
      { x: 1110, y: 430, type: 'mire_toad' }, { x: 1390, y: 1070, type: 'glass_crab' },
    ],
    epics: [{ x: 1100, y: 380, boss: 'sunken_oracle' }, { x: 1400, y: 1120, boss: 'last_anchor' }],
  },
];

function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return total;
}

export function pointOnPath(points, t) {
  if (!Array.isArray(points) || points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0][0], y: points[0][1] };
  const total = polylineLength(points);
  let wanted = Math.max(0, Math.min(1, Number(t) || 0)) * total;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const segment = Math.hypot(bx - ax, by - ay);
    if (wanted <= segment || i === points.length - 1) {
      const ratio = segment ? Math.min(1, wanted / segment) : 0;
      return { x: ax + (bx - ax) * ratio, y: ay + (by - ay) * ratio };
    }
    wanted -= segment;
  }
  return { x: points[points.length - 1][0], y: points[points.length - 1][1] };
}

function buildMap(blueprint) {
  const towers = [];
  const fractions = { blue: [0.12, 0.27, 0.41], red: [0.88, 0.73, 0.59] };
  for (const lane of ['top', 'mid', 'bot']) {
    for (const team of ['blue', 'red']) {
      fractions[team].forEach((fraction, tier) => {
        const point = pointOnPath(blueprint.lanes[lane], fraction);
        towers.push({
          id: `${team}_${lane}_${tier}`,
          team,
          lane,
          tier,
          x: point.x,
          y: point.y,
          hp: 2300 + tier * 650,
          maxHp: 2300 + tier * 650,
          damage: 48 + tier * 16,
          range: 225,
          radius: 23,
          attackCd: 1.05,
          gold: 140 + tier * 45,
        });
      });
    }
  }
  // Two core guards per team, placed beside the nexus rather than on a lane.
  const base = blueprint.base;
  for (const team of ['blue', 'red']) {
    const sign = team === 'blue' ? 1 : -1;
    for (let guard = 0; guard < 2; guard += 1) {
      towers.push({
        id: `${team}_guard_${guard}`,
        team,
        lane: 'base',
        tier: 'guard',
        x: base[team].x + sign * 76,
        y: base[team].y + (guard === 0 ? 82 : -82),
        hp: 2800,
        maxHp: 2800,
        damage: 62,
        range: 240,
        radius: 20,
        attackCd: 0.95,
        gold: 170,
      });
    }
  }
  return {
    ...blueprint,
    towers: towers.map((tower, index) => ({ ...tower, id: `${tower.id}_${index}` })),
    core: {
      blue: { id: 'blue_core', team: 'blue', x: blueprint.base.blue.x, y: blueprint.base.blue.y, hp: 12000, maxHp: 12000, damage: 95, range: 320, radius: 46 },
      red: { id: 'red_core', team: 'red', x: blueprint.base.red.x, y: blueprint.base.red.y, hp: 12000, maxHp: 12000, damage: 95, range: 320, radius: 46 },
    },
  };
}

export const MOBA_MAPS = MAP_BLUEPRINTS.map(buildMap);
export const MOBA_MAP_BY_ID = Object.fromEntries(MOBA_MAPS.map((map) => [map.id, map]));

function hashSeed(text) {
  let hash = 2166136261;
  const input = String(text ?? '');
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry(seed) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
const enemyTeam = (team) => (team === 'blue' ? 'red' : 'blue');

export function mobaHeroesForRole(role) {
  return MOBA_HEROES.filter((hero) => hero.role === role);
}

function pickHero(role, used, rng) {
  const pool = MOBA_HEROES.filter((hero) => hero.role === role && !used.has(hero.id));
  if (pool.length) return pool[Math.floor(rng() * pool.length) % pool.length];
  const fallback = MOBA_HEROES.filter((hero) => !used.has(hero.id));
  return fallback[Math.floor(rng() * fallback.length) % fallback.length] || MOBA_HEROES[0];
}

function spawnHero(match, heroDef, team, lane, index) {
  const base = match.map.base[team];
  const angle = (Math.PI * 2 * index) / MOBA_TEAM_SIZE + (team === 'red' ? Math.PI : 0);
  const hero = {
    id: team === 'blue' && index === 0 ? 'player' : `${team}_${index}`,
    kind: 'hero',
    team,
    heroId: heroDef.id,
    name: heroDef.name,
    className: heroDef.className,
    glyph: heroDef.glyph,
    color: heroDef.color,
    role: heroDef.role,
    lane,
    x: base.x + Math.cos(angle) * 66,
    y: base.y + Math.sin(angle) * 66,
    hp: heroDef.hp,
    maxHp: heroDef.hp,
    mana: 100,
    maxMana: 100,
    attack: heroDef.attack,
    speed: heroDef.speed,
    range: heroDef.range,
    armor: heroDef.armor,
    crit: heroDef.crit,
    radius: heroDef.role === 'tank' ? 17 : 14,
    level: 1,
    xp: 0,
    gold: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    cooldowns: [0, 0, 0, 0],
    abilities: heroDef.abilities.map((ability) => ({ ...ability })),
    attackTimer: 0,
    dead: false,
    respawnTimer: 0,
    shield: 0,
    slowTimer: 0,
    stunTimer: 0,
    recallTimer: 0,
    moveTarget: null,
    pathIndex: 0,
    path: lanePath(match.map, lane, team),
    lastAttacker: null,
    isPlayer: team === 'blue' && index === 0,
    lore: heroDef.lore,
  };
  return hero;
}

function lanePath(map, lane, team) {
  if (lane === 'jungle' || lane === 'roam') return null;
  const points = map.lanes[lane].map(([x, y]) => ({ x, y }));
  return team === 'red' ? points.slice().reverse() : points;
}

export function createMobaMatch(options = {}) {
  const map = MOBA_MAP_BY_ID[options.mapId] || MOBA_MAPS[0];
  const selected = MOBA_HERO_BY_ID[options.heroId] || MOBA_HEROES[0];
  const difficulty = MOBA_DIFFICULTIES.find((entry) => entry.id === options.difficulty) || MOBA_DIFFICULTIES[1];
  const seed = Number(options.seed) || hashSeed(`${map.id}|${selected.id}|${options.lane || 'mid'}`);
  const rng = mulberry(seed);
  const used = new Set([selected.id]);
  const lanes = MOBA_LANES.filter((lane) => lane !== (options.lane || 'mid'));
  const match = {
    version: MOBA_VERSION,
    mapId: map.id,
    map,
    heroId: selected.id,
    difficulty: difficulty.id,
    difficultyData: difficulty,
    seed,
    time: 0,
    phase: 'playing',
    winner: null,
    wave: 0,
    waveTimer: 7,
    epicTimer: MOBA_EPIC_TIME,
    playerId: 'player',
    heroes: [],
    minions: [],
    towers: [],
    camps: [],
    epics: [],
    projectiles: [],
    effects: [],
    texts: [],
    teams: {
      blue: { kills: 0, gold: 0, epicBuff: 0, name: 'Penjaga Sumpah' },
      red: { kills: 0, gold: 0, epicBuff: 0, name: 'Pasukan Rift' },
    },
    stats: { towerKills: 0, minionKills: 0, epicKills: 0 },
    rng,
  };
  match.heroes = [spawnHero(match, selected, 'blue', options.lane || 'mid', 0)];
  const blueRoles = ['tank', 'fighter', 'mage', 'marksman', 'support'];
  for (let i = 0; i < MOBA_TEAM_SIZE - 1; i += 1) {
    const role = blueRoles.find((candidate) => !match.heroes.some((hero) => hero.role === candidate)) || blueRoles[i % blueRoles.length];
    const heroDef = pickHero(role, used, rng);
    used.add(heroDef.id);
    match.heroes.push(spawnHero(match, heroDef, 'blue', lanes[i] || 'roam', i + 1));
  }
  const redRoles = ['tank', 'assassin', 'mage', 'marksman', 'support'];
  for (let i = 0; i < MOBA_TEAM_SIZE; i += 1) {
    const role = redRoles[i];
    const heroDef = pickHero(role, used, rng);
    used.add(heroDef.id);
    match.heroes.push(spawnHero(match, heroDef, 'red', MOBA_LANES[i], i));
  }
  match.towers = map.towers
    .map((tower) => ({ ...tower, kind: 'tower', dead: false, attackTimer: 0, lastAttacker: null, maxHp: tower.hp }))
    .concat([
      { ...map.core.blue, kind: 'core', dead: false, attackTimer: 0, maxHp: map.core.blue.hp },
      { ...map.core.red, kind: 'core', dead: false, attackTimer: 0, maxHp: map.core.red.hp },
    ]);
  match.camps = map.camps.map((camp, index) => {
    const type = MOBA_JUNGLE_BY_ID[camp.type] || MOBA_JUNGLE_MOBS[0];
    return {
      id: `camp_${index}`, kind: 'camp', campIndex: index, x: camp.x, y: camp.y, type: camp.type,
      name: type.name, hp: type.hp, maxHp: type.hp, damage: type.damage, speed: type.speed,
      range: type.range, radius: 18, gold: type.gold, buff: type.buff, team: 'neutral',
      dead: false, respawnTimer: 0, attackTimer: 0, color: '#78c26b', aggro: false,
    };
  });
  match.player = match.heroes[0];
  match.playerLane = options.lane || 'mid';
  match.teamBlue = match.heroes.filter((hero) => hero.team === 'blue');
  match.teamRed = match.heroes.filter((hero) => hero.team === 'red');
  // Prevent the opening minute from being a formality: first wave arrives early.
  match.waveTimer = 5;
  return match;
}

function activeHeroes(match, team) {
  return match.heroes.filter((hero) => hero.team === team && !hero.dead);
}

function allFighters(match, team) {
  return [
    ...match.heroes.filter((hero) => hero.team === team && !hero.dead),
    ...match.minions.filter((minion) => minion.team === team && !minion.dead),
    ...match.towers.filter((tower) => tower.team === team && !tower.dead && tower.kind === 'tower'),
  ];
}

function allTargetsFor(match, source) {
  const foes = source.team === 'neutral' ? ['blue', 'red'] : [enemyTeam(source.team)];
  return [
    ...match.heroes.filter((hero) => foes.includes(hero.team) && !hero.dead),
    ...match.minions.filter((minion) => foes.includes(minion.team) && !minion.dead),
    ...match.towers.filter((tower) => foes.includes(tower.team) && !tower.dead),
    ...(source.kind === 'hero' ? match.camps.filter((camp) => !camp.dead) : []),
    ...(source.kind === 'hero' ? match.epics.filter((epic) => !epic.dead) : []),
  ];
}

function nearestTarget(match, source, range) {
  let best = null;
  let bestDistance = range;
  for (const target of allTargetsFor(match, source)) {
    const dist = distance(source, target) - (target.radius || 0);
    if (dist < bestDistance) {
      bestDistance = dist;
      best = target;
    }
  }
  return best;
}

function nearestMinionTarget(match, minion, range) {
  const enemies = enemyTeam(minion.team);
  const x = minion.x || 0;
  const y = minion.y || 0;
  let best = null;
  let bestDistance = range;
  // Keep minions ahead of heroes on ties. An axis alone can rule out
  // a target without allocating a candidate list or measuring its diagonal.
  for (const units of [match.minions, match.heroes]) {
    for (const unit of units) {
      if (unit.team !== enemies || unit.dead) continue;
      const radius = unit.radius || 0;
      const dx = x - (unit.x || 0);
      if (Math.abs(dx) - radius >= bestDistance) continue;
      const dy = y - (unit.y || 0);
      if (Math.abs(dy) - radius >= bestDistance) continue;
      const dist = Math.hypot(dx, dy) - radius;
      if (dist < bestDistance) { best = unit; bestDistance = dist; }
    }
  }
  if (best) return best;
  // A lane must be opened before minions may touch the nexus. Towers are
  // intentionally stickier than the path endpoint, otherwise a fast wave can
  // ghost through an inner tower and end the match in half a minute.
  let laneBlocked = false;
  let closestTower = null;
  let towerDistance = 320;
  for (const tower of match.towers) {
    if (tower.kind !== 'tower' || tower.team !== enemies || tower.lane !== minion.lane || tower.dead) continue;
    laneBlocked = true;
    const dist = distance(minion, tower) - (tower.radius || 0);
    if (dist < towerDistance) { closestTower = tower; towerDistance = dist; }
  }
  if (laneBlocked) return closestTower;
  const core = match.towers.find((tower) => tower.kind === 'core' && tower.team === enemies && !tower.dead);
  return core && distance(minion, core) < range + core.radius ? core : null;
}

function towerTarget(match, tower) {
  let best = null;
  let bestDistance = tower.range;
  const enemies = [
    ...match.minions.filter((minion) => minion.team !== tower.team && !minion.dead),
    ...match.heroes.filter((hero) => hero.team !== tower.team && !hero.dead),
  ];
  for (const target of enemies) {
    const dist = distance(tower, target) - (target.radius || 0);
    if (dist < bestDistance) {
      best = target;
      bestDistance = dist;
    }
  }
  return best;
}

function addText(match, x, y, text, color = '#ffe6b0', life = 1.2) {
  match.texts.push({ x, y, text, color, life, maxLife: life });
  if (match.texts.length > 40) match.texts.shift();
}

function addEffect(match, effect) {
  match.effects.push({ life: 0.5, maxLife: 0.5, ...effect });
  if (match.effects.length > 50) match.effects.shift();
}

function shieldDamage(target, amount) {
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    return amount - absorbed;
  }
  return amount;
}

function awardGold(match, team, amount) {
  if (!match.teams[team]) return;
  match.teams[team].gold += amount;
}

function hurt(match, source, target, amount, options = {}) {
  if (!target || target.dead || target.hp <= 0) return false;
  if (target.team === source.team && target !== source) return false;
  if (target.invulnerable > 0) return false;
  const raw = Math.max(1, Number(amount) || 1);
  const armor = options.trueDamage ? 0 : Math.max(0, Math.min(0.7, target.armor || 0));
  const reduced = shieldDamage(target, raw * (1 - armor));
  target.hp -= reduced;
  target.lastAttacker = source;
  addText(match, target.x, target.y - (target.radius || 10), `-${Math.round(reduced)}`, options.color || '#ffce7a', 0.8);
  if (options.slow) target.slowTimer = Math.max(target.slowTimer || 0, options.slow);
  if (options.stun) target.stunTimer = Math.max(target.stunTimer || 0, options.stun);
  if (target.kind === 'camp' || target.kind === 'epic') target.aggro = true;
  if (target.hp > 0) return true;
  target.hp = 0;
  target.dead = true;
  if (target.kind === 'hero') {
    target.respawnTimer = 7 + target.level * 0.65;
    target.deaths += 1;
    target.moveTarget = null;
    target.recallTimer = 0;
    if (source.kind === 'hero') {
      source.kills += 1;
      source.gold += 240;
      source.xp += 120;
      awardGold(match, source.team, 240);
      target.assists = 0;
    }
    if (match.teams[source.team]) match.teams[source.team].kills += 1;
    addText(match, target.x, target.y - 25, 'GUGUR', '#ff8c9d', 1.8);
    addEffect(match, { type: 'burst', x: target.x, y: target.y, radius: 52, color: '#ff6b81' });
  } else if (target.kind === 'tower') {
    target.dead = true;
    match.stats.towerKills += 1;
    const gold = (target.gold || 140) * (target.team === 'red' ? 1 : 0.9);
    awardGold(match, source.team, gold);
    if (source.kind === 'hero') source.gold += Math.round(gold * 0.6);
    addText(match, target.x, target.y - 30, 'MENARA JATUH', source.team === 'blue' ? '#7df9ff' : '#ff9aa9', 2);
    addEffect(match, { type: 'burst', x: target.x, y: target.y, radius: 58, color: '#ffb15c' });
  } else if (target.kind === 'camp') {
    target.dead = true;
    target.respawnTimer = 58;
    awardGold(match, source.team, target.gold || 50);
    if (source.kind === 'hero') {
      source.gold += Math.round((target.gold || 50) * 0.5);
      source.xp += 45;
    }
    addText(match, target.x, target.y - 22, `+${target.gold || 50}`, '#ffd166', 1);
  } else if (target.kind === 'epic') {
    target.dead = true;
    match.stats.epicKills += 1;
    match.teams[source.team].epicBuff = 150;
    awardGold(match, source.team, target.gold || 650);
    if (source.kind === 'hero') source.gold += Math.round((target.gold || 650) * 0.4);
    addText(match, target.x, target.y - 36, target.buff || 'BERKAH BOS', '#ffd166', 2.2);
    addEffect(match, { type: 'burst', x: target.x, y: target.y, radius: 90, color: '#ffd166' });
  } else if (target.kind === 'minion') {
    target.dead = true;
    match.stats.minionKills += 1;
    awardGold(match, source.team, target.gold || 20);
    if (source.kind === 'hero') {
      source.gold += Math.round((target.gold || 20) * 0.3);
      gainXp(match, source, target.xp || 20);
    }
  } else if (target.kind === 'core') {
    endMobaMatch(match, source.team);
  }
  return true;
}

function gainXp(match, hero, amount) {
  hero.xp += amount;
  const next = 120 + hero.level * 70;
  if (hero.xp >= next && hero.level < 18) {
    hero.xp -= next;
    hero.level += 1;
    hero.maxHp = Math.round(hero.maxHp * 1.06);
    hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(hero.maxHp * 0.08));
    hero.attack = Math.round(hero.attack * 1.045);
    addText(match, hero.x, hero.y - 30, `LEVEL ${hero.level}`, '#ffe8a3', 1.3);
  }
}

function attack(match, source, target) {
  if (!target || target.dead || source.attackTimer > 0 || source.stunTimer > 0) return false;
  const dist = distance(source, target);
  if (dist > source.range + (target.radius || 0)) return false;
  const crit = (source.kind === 'hero' ? match.rng() : Math.random()) < (source.crit || 0);
  const damage = Math.round((source.attack || 20) * (crit ? 1.8 : 1) * (1 + (match.teams[source.team]?.epicBuff > 0 ? 0.08 : 0)));
  source.attackTimer = source.attackCd || (source.kind === 'hero' ? 0.85 : 1.2);
  if (source.range > 100 || source.kind === 'tower' || source.kind === 'core') {
    match.projectiles.push({
      x: source.x, y: source.y, target, speed: source.kind === 'tower' ? 440 : 520,
      damage, team: source.team, color: source.kind === 'hero' ? source.color : source.team === 'blue' ? '#73e0ff' : '#ff7d9b',
      radius: source.kind === 'tower' ? 6 : 4, source, life: 1.5,
    });
  } else {
    hurt(match, source, target, damage);
    addEffect(match, { type: 'slash', x: target.x, y: target.y, radius: 18, color: source.color || '#ffd6a0', angle: Math.atan2(target.y - source.y, target.x - source.x) });
  }
  return true;
}

function castMobaAbility(match, hero, slot, aim = {}) {
  if (!hero || hero.dead || hero.stunTimer > 0) return { ok: false, reason: 'dead' };
  const ability = hero.abilities[slot];
  if (!ability) return { ok: false, reason: 'slot' };
  if (hero.cooldowns[slot] > 0) return { ok: false, reason: 'cooldown' };
  if (hero.mana < ability.mana) return { ok: false, reason: 'mana' };
  hero.mana -= ability.mana;
  hero.cooldowns[slot] = ability.cooldown;
  const target = nearestTarget(match, hero, ability.kind === 'ultimate' ? 360 : 430);
  const aimX = Number(aim.x);
  const aimY = Number(aim.y);
  const hasAim = Number.isFinite(aimX) && Number.isFinite(aimY);
  const centerX = hasAim ? aimX : target?.x ?? hero.x;
  const centerY = hasAim ? aimY : target?.y ?? hero.y;

  if (ability.kind === 'dash') {
    const angle = Math.atan2(centerY - hero.y, centerX - hero.x);
    hero.x = clamp(hero.x + Math.cos(angle) * 190, 24, match.map.w - 24);
    hero.y = clamp(hero.y + Math.sin(angle) * 190, 24, match.map.h - 24);
    addEffect(match, { type: 'line', x: hero.x, y: hero.y, radius: 34, color: hero.color, angle });
    for (const foe of allTargetsFor(match, hero)) {
      if (distance(hero, foe) < 86) hurt(match, hero, foe, hero.attack * 1.5, { slow: 1.2 });
    }
  } else if (ability.kind === 'bolt') {
    const foe = target || null;
    if (foe) {
      match.projectiles.push({
        x: hero.x, y: hero.y, target: foe, speed: 700, damage: hero.attack * 2.1,
        team: hero.team, color: hero.color, radius: 7, source: hero, ability: true, life: 1.8,
      });
    } else {
      const angle = Math.atan2(centerY - hero.y, centerX - hero.x);
      match.projectiles.push({
        x: hero.x, y: hero.y, vx: Math.cos(angle) * 620, vy: Math.sin(angle) * 620,
        speed: 620, damage: hero.attack * 1.8, team: hero.team, color: hero.color,
        radius: 7, source: hero, ability: true, life: 0.9,
      });
    }
  } else if (ability.kind === 'burst') {
    addEffect(match, { type: 'burst', x: centerX, y: centerY, radius: 100, color: hero.color, life: 0.7 });
    for (const foe of allTargetsFor(match, hero)) {
      if (distance({ x: centerX, y: centerY }, foe) < 125) hurt(match, hero, foe, hero.attack * 1.8, { slow: 1.5 });
    }
  } else if (ability.kind === 'guard') {
    hero.hp = Math.min(hero.maxHp, hero.hp + hero.maxHp * 0.22);
    hero.shield = Math.max(hero.shield, hero.maxHp * 0.3);
    hero.slowTimer = 0;
    addEffect(match, { type: 'ring', x: hero.x, y: hero.y, radius: 54, color: '#9df3d1', life: 0.9 });
    for (const ally of match.heroes.filter((entry) => entry.team === hero.team && entry !== hero && !entry.dead)) {
      if (distance(hero, ally) < 240) {
        ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.1);
        ally.shield = Math.max(ally.shield, ally.maxHp * 0.12);
      }
    }
    addText(match, hero.x, hero.y - 30, 'PERISAI', '#9df3d1', 1);
  } else if (ability.kind === 'ultimate') {
    addEffect(match, { type: 'burst', x: centerX, y: centerY, radius: 180, color: hero.color, life: 1.1 });
    for (const foe of allTargetsFor(match, hero)) {
      if (distance({ x: centerX, y: centerY }, foe) < 210) {
        hurt(match, hero, foe, hero.attack * 3.2, { stun: 1.1, slow: 2.5, trueDamage: false });
      }
    }
    addText(match, hero.x, hero.y - 35, ability.name.toUpperCase(), '#ffe8a3', 1.5);
  }
  addEffect(match, { type: 'ring', x: hero.x, y: hero.y, radius: 28, color: hero.color, life: 0.4 });
  return { ok: true, ability: ability.name };
}

function respawnHero(match, hero) {
  const base = match.map.base[hero.team];
  hero.dead = false;
  hero.hp = hero.maxHp;
  hero.mana = hero.maxMana;
  hero.x = base.x + (match.rng() - 0.5) * 100;
  hero.y = base.y + (match.rng() - 0.5) * 100;
  hero.shield = 0;
  hero.slowTimer = 0;
  hero.stunTimer = 0;
  hero.cooldowns = [0, 0, 0, 0];
  hero.pathIndex = 0;
  hero.moveTarget = null;
}

function pathStep(hero, dt) {
  if (!hero.path || hero.path.length === 0) return false;
  const target = hero.path[Math.min(hero.path.length - 1, hero.pathIndex || 0)];
  if (!target) return false;
  if (distance(hero, target) < 26) {
    hero.pathIndex = Math.min(hero.path.length - 1, (hero.pathIndex || 0) + 1);
  }
  const goal = hero.path[Math.min(hero.path.length - 1, hero.pathIndex || 0)];
  const angle = Math.atan2(goal.y - hero.y, goal.x - hero.x);
  const speed = hero.speed * (hero.slowTimer > 0 ? 0.58 : 1);
  hero.x += Math.cos(angle) * speed * dt;
  hero.y += Math.sin(angle) * speed * dt;
  return true;
}

function moveToward(hero, target, dt, stopAt = 0) {
  if (!target) return;
  const dist = distance(hero, target);
  if (dist <= stopAt) return;
  const speed = hero.speed * (hero.slowTimer > 0 ? 0.58 : 1);
  const angle = Math.atan2(target.y - hero.y, target.x - hero.x);
  hero.x = clamp(hero.x + Math.cos(angle) * speed * dt, 18, 99999);
  hero.y = clamp(hero.y + Math.sin(angle) * speed * dt, 18, 99999);
}

function updateHero(match, hero, dt, input = null) {
  hero.attackTimer = Math.max(0, hero.attackTimer - dt);
  hero.cooldowns = hero.cooldowns.map((value) => Math.max(0, value - dt));
  hero.slowTimer = Math.max(0, hero.slowTimer - dt);
  hero.stunTimer = Math.max(0, hero.stunTimer - dt);
  hero.shield = Math.max(0, hero.shield - dt * 12);
  if (hero.dead) {
    hero.respawnTimer -= dt;
    if (hero.respawnTimer <= 0) respawnHero(match, hero);
    return;
  }
  if (hero.stunTimer > 0) return;
  hero.mana = Math.min(hero.maxMana, hero.mana + dt * 7);
  if (hero.x < 15 || hero.x > match.map.w - 15) hero.x = clamp(hero.x, 15, match.map.w - 15);
  if (hero.y < 15 || hero.y > match.map.h - 15) hero.y = clamp(hero.y, 15, match.map.h - 15);

  if (hero.isPlayer && input) {
    if (input.recall) {
      // Recall is a real channel: it is interrupted by damage and only works away from combat.
      hero.recallTimer = hero.recallTimer > 0 ? hero.recallTimer : 4;
      hero.moveTarget = null;
    }
    if (hero.recallTimer > 0) {
      hero.recallTimer -= dt;
      if (hero.recallTimer <= 0) {
        respawnHero(match, hero);
        addText(match, hero.x, hero.y - 35, 'RECALL', '#7df9ff', 1.5);
      }
    } else {
      const dx = Number(input.moveX) || 0;
      const dy = Number(input.moveY) || 0;
      if (dx !== 0 || dy !== 0) {
        hero.moveTarget = null;
        const len = Math.hypot(dx, dy) || 1;
        hero.x += (dx / len) * hero.speed * dt;
        hero.y += (dy / len) * hero.speed * dt;
      } else if (input.moveTarget) {
        hero.moveTarget = input.moveTarget;
      }
      if (hero.moveTarget) {
        moveToward(hero, hero.moveTarget, dt, 8);
        if (distance(hero, hero.moveTarget) < 10) hero.moveTarget = null;
      }
      if (input.castSlot >= 0) {
        castMobaAbility(match, hero, input.castSlot, { x: input.aimX, y: input.aimY });
      }
    }
  } else if (hero.hp < hero.maxHp * 0.24) {
    const base = match.map.base[hero.team];
    moveToward(hero, base, dt, 70);
    if (hero.cooldowns[2] <= 0) castMobaAbility(match, hero, 2);
    return;
  } else if (hero.lane === 'roam') {
    const weakest = match.heroes
      .filter((ally) => ally.team === hero.team && ally !== hero && !ally.dead)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (weakest && distance(hero, weakest) > 220) moveToward(hero, weakest, dt, 160);
  } else if (hero.lane === 'jungle') {
    const camp = match.camps.filter((entry) => !entry.dead && distance(hero, entry) < 620)[0];
    if (camp) {
      if (distance(hero, camp) > hero.range + 20) moveToward(hero, camp, dt, hero.range);
    } else {
      pathStep(hero, dt);
    }
  } else if (hero.path) {
    pathStep(hero, dt);
  }

  const target = nearestTarget(match, hero, hero.range + 24);
  if (target) attack(match, hero, target);
  // AI uses its kit, but not every frame. The player casts explicitly.
  if (!hero.isPlayer && target && hero.cooldowns[1] <= 0 && distance(hero, target) < 330 && match.rng() < dt * 0.55) {
    castMobaAbility(match, hero, hero.role === 'support' ? 2 : 1);
  }
  if (!hero.isPlayer && target && hero.cooldowns[3] <= 0 && distance(hero, target) < 190 && match.rng() < dt * 0.22) {
    castMobaAbility(match, hero, 3);
  }
}

function updateMinion(match, minion, dt) {
  minion.attackTimer = Math.max(0, minion.attackTimer - dt);
  if (minion.dead) return;
  if (minion.stunTimer > 0) {
    minion.stunTimer -= dt;
    return;
  }
  const target = nearestMinionTarget(match, minion, 320);
  if (target && distance(minion, target) <= minion.range + (target.radius || 0)) {
    attack(match, minion, target);
  } else if (target) {
    moveToward(minion, target, dt, minion.range);
  } else if (minion.path) {
    const targetPoint = minion.path[Math.min(minion.path.length - 1, minion.pathIndex || 0)];
    if (distance(minion, targetPoint) < 20) {
      minion.pathIndex = Math.min(minion.path.length - 1, (minion.pathIndex || 0) + 1);
    }
    const goal = minion.path[Math.min(minion.path.length - 1, minion.pathIndex || 0)];
    moveToward(minion, goal, dt, 0);
  }
  if (minion.heal) {
    const ally = match.minions.find((other) => other.team === minion.team && other !== minion && !other.dead && other.hp < other.maxHp * 0.6);
    if (ally) ally.hp = Math.min(ally.maxHp, ally.hp + minion.heal * dt);
  }
}

function updateTower(match, tower, dt) {
  tower.attackTimer = Math.max(0, tower.attackTimer - dt);
  if (tower.dead) return;
  const target = towerTarget(match, tower);
  if (target) attack(match, tower, target);
}

function updateNeutral(match, unit, dt) {
  unit.attackTimer = Math.max(0, unit.attackTimer - dt);
  if (unit.dead) {
    unit.respawnTimer -= dt;
    if (unit.respawnTimer <= 0) {
      unit.dead = false;
      unit.hp = unit.maxHp;
      unit.aggro = false;
    }
    return;
  }
  const near = allFighters(match, 'blue').concat(allFighters(match, 'red'))
    .filter((fighter) => distance(unit, fighter) < (unit.aggro ? 280 : 105));
  if (near.length) unit.aggro = true;
  if (!unit.aggro) return;
  const target = near.sort((a, b) => distance(unit, a) - distance(unit, b))[0];
  if (!target) return;
  if (distance(unit, target) > unit.range) moveToward(unit, target, dt, unit.range);
  else attack(match, unit, target);
}

function updateProjectiles(match, dt) {
  for (const projectile of match.projectiles) {
    projectile.life -= dt;
    if (projectile.life <= 0) {
      projectile.done = true;
      continue;
    }
    if (projectile.target) {
      if (projectile.target.dead) {
        projectile.done = true;
        continue;
      }
      const angle = Math.atan2(projectile.target.y - projectile.y, projectile.target.x - projectile.x);
      projectile.x += Math.cos(angle) * projectile.speed * dt;
      projectile.y += Math.sin(angle) * projectile.speed * dt;
      if (distance(projectile, projectile.target) < (projectile.target.radius || 12) + 8) {
        hurt(match, projectile.source, projectile.target, projectile.damage, { color: projectile.color });
        addEffect(match, { type: 'burst', x: projectile.x, y: projectile.y, radius: projectile.ability ? 22 : 10, color: projectile.color, life: 0.25 });
        projectile.done = true;
      }
    } else {
      projectile.x += (projectile.vx || 0) * dt;
      projectile.y += (projectile.vy || 0) * dt;
      const hit = allTargetsFor(match, projectile.source)
        .find((target) => distance(projectile, target) < (target.radius || 10) + 7);
      if (hit) {
        hurt(match, projectile.source, hit, projectile.damage, { color: projectile.color });
        projectile.done = true;
      }
      if (projectile.x < 0 || projectile.y < 0 || projectile.x > match.map.w || projectile.y > match.map.h) projectile.done = true;
    }
  }
  match.projectiles = match.projectiles.filter((projectile) => !projectile.done);
}

function spawnWave(match) {
  match.wave += 1;
  for (const team of ['blue', 'red']) {
    for (const lane of ['top', 'mid', 'bot']) {
      const path = lanePath(match.map, lane, team);
      const base = match.map.base[team];
      const roster = match.wave % 4 === 0
        ? ['footman', 'footman', 'archer', 'brute', 'siege', 'healer']
        : ['footman', 'footman', 'footman', 'archer', 'archer', 'siege'];
      roster.forEach((typeId, index) => {
        const type = MOBA_MINION_BY_ID[typeId];
        const start = path?.[0] || base;
        match.minions.push({
          id: `m${match.wave}_${team}_${lane}_${index}`,
          kind: 'minion', type: typeId, name: type.name, short: type.short, team, lane,
          x: (path ? start.x : base.x) + (match.rng() - 0.5) * 46,
          y: (path ? start.y : base.y) + (match.rng() - 0.5) * 46,
          hp: type.hp, maxHp: type.hp, damage: type.damage, attack: type.damage, speed: type.speed,
          range: type.range, attackCd: type.attackCd, attackTimer: 0, radius: type.radius,
          gold: type.gold, xp: type.xp, color: type.color, heal: type.heal || 0,
          path, pathIndex: 1, dead: false, stunTimer: 0,
        });
      });
    }
  }
  if (match.minions.length > 180) match.minions = match.minions.slice(-180);
  addText(match, match.map.w / 2, 40, `GELOMBANG ${match.wave}`, '#ffe8a3', 1.8);
}

function spawnEpics(match) {
  match.epicTimer = MOBA_MATCH_LIMIT;
  for (const pit of match.map.epics) {
    const definition = MOBA_EPIC_BY_ID[pit.boss];
    if (!definition) continue;
    const exists = match.epics.some((epic) => epic.definitionId === definition.id && !epic.dead);
    if (exists) continue;
    match.epics.push({
      id: `epic_${definition.id}`, definitionId: definition.id, kind: 'epic', team: 'neutral',
      name: definition.name, title: definition.title, x: pit.x, y: pit.y,
      hp: definition.hp, maxHp: definition.hp, damage: definition.damage, attack: definition.damage,
      speed: definition.speed, range: definition.range, radius: 34, attackCd: 1.7, attackTimer: 0,
      gold: definition.gold, buff: definition.buff, color: '#ffd166', dead: false, aggro: false,
      respawnTimer: 0, lore: definition.lore,
    });
    addText(match, pit.x, pit.y - 55, definition.name.toUpperCase(), '#ffd166', 2.5);
  }
  addEffect(match, { type: 'ring', x: match.map.w / 2, y: match.map.h / 2, radius: 220, color: '#ffd166', life: 2.2 });
}

export function mobaCast(match, slot, aim = {}) {
  if (!match || match.phase !== 'playing') return { ok: false, reason: 'ended' };
  return castMobaAbility(match, match.player, slot, aim);
}

export function mobaSetOrder(match, x, y) {
  if (!match?.player || match.player.dead) return false;
  match.player.moveTarget = {
    x: clamp(Number(x) || 0, 20, match.map.w - 20),
    y: clamp(Number(y) || 0, 20, match.map.h - 20),
  };
  match.player.recallTimer = 0;
  return true;
}

export function updateMobaMatch(match, dt, input = {}) {
  if (!match || match.phase !== 'playing') return match;
  const step = Math.min(0.05, Math.max(0, Number(dt) || 0));
  if (step <= 0) return match;
  match.time += step;
  match.epicTimer -= step;
  if (match.epicTimer <= 0) spawnEpics(match);
  match.waveTimer -= step;
  if (match.waveTimer <= 0) {
    spawnWave(match);
    match.waveTimer = 26;
  }
  for (const hero of match.heroes) updateHero(match, hero, step, hero.isPlayer ? input : null);
  for (const tower of match.towers) updateTower(match, tower, step);
  for (const minion of match.minions) updateMinion(match, minion, step);
  for (const camp of match.camps) updateNeutral(match, camp, step);
  for (const epic of match.epics) updateNeutral(match, epic, step);
  updateProjectiles(match, step);
  match.effects.forEach((effect) => { effect.life -= step; });
  match.effects = match.effects.filter((effect) => effect.life > 0);
  match.texts.forEach((text) => { text.life -= step; text.y -= step * 18; });
  match.texts = match.texts.filter((text) => text.life > 0);
  match.minions = match.minions.filter((minion) => !minion.dead || match.time < 1);
  match.teams.blue.epicBuff = Math.max(0, match.teams.blue.epicBuff - step);
  match.teams.red.epicBuff = Math.max(0, match.teams.red.epicBuff - step);
  if (match.time >= MOBA_MATCH_LIMIT) {
    const blueCore = match.towers.find((tower) => tower.kind === 'core' && tower.team === 'blue');
    const redCore = match.towers.find((tower) => tower.kind === 'core' && tower.team === 'red');
    const winner = (redCore?.hp || 0) < (blueCore?.hp || 0) ? 'blue' : 'red';
    endMobaMatch(match, winner);
  }
  return match;
}

export function endMobaMatch(match, winner) {
  if (!match || match.phase === 'ended') return match;
  match.phase = 'ended';
  match.winner = winner;
  match.endedAt = match.time;
  match.teams[winner].victory = true;
  return match;
}

export function mobaSnapshot(match) {
  if (!match) return null;
  const player = match.player;
  return {
    mapId: match.mapId,
    heroId: match.heroId,
    time: Math.round(match.time * 10) / 10,
    phase: match.phase,
    winner: match.winner,
    wave: match.wave,
    player: player ? {
      heroId: player.heroId, name: player.name, role: player.role,
      hp: Math.round(player.hp), maxHp: player.maxHp, mana: Math.round(player.mana),
      x: Math.round(player.x), y: Math.round(player.y),
      level: player.level, gold: player.gold, kills: player.kills, deaths: player.deaths,
      assists: player.assists, lane: player.lane, dead: player.dead,
    } : null,
    teams: {
      blue: { kills: match.teams.blue.kills, gold: match.teams.blue.gold },
      red: { kills: match.teams.red.kills, gold: match.teams.red.gold },
    },
    counts: {
      blue: activeHeroes(match, 'blue').length,
      red: activeHeroes(match, 'red').length,
      minions: match.minions.filter((minion) => !minion.dead).length,
      towers: match.towers.filter((tower) => tower.kind === 'tower' && !tower.dead).length,
      camps: match.camps.filter((camp) => !camp.dead).length,
      epics: match.epics.filter((epic) => !epic.dead).length,
    },
    cores: {
      blue: match.towers.find((tower) => tower.kind === 'core' && tower.team === 'blue')?.hp || 0,
      red: match.towers.find((tower) => tower.kind === 'core' && tower.team === 'red')?.hp || 0,
    },
  };
}

export function mobaHeroStats(match) {
  return (match?.heroes || []).map((hero) => ({
    id: hero.id, team: hero.team, heroId: hero.heroId, name: hero.name,
    role: hero.role, lane: hero.lane, hp: Math.round(hero.hp), maxHp: hero.maxHp,
    level: hero.level, kills: hero.kills, deaths: hero.deaths, assists: hero.assists,
    gold: hero.gold, dead: hero.dead, respawnTimer: Math.max(0, hero.respawnTimer || 0),
  }));
}

export function mobaCamera(match, width = 960, height = 540) {
  const focus = match?.player && !match.player.dead ? match.player : match?.player || { x: 0, y: 0 };
  const zoom = Math.max(0.58, Math.min(0.86, Math.max(width / 1380, height / 800)));
  const viewW = width / zoom;
  const viewH = height / zoom;
  const x = clamp((focus.x || 0) - viewW / 2, 0, Math.max(0, (match?.map?.w || viewW) - viewW));
  const y = clamp((focus.y || 0) - viewH / 2, 0, Math.max(0, (match?.map?.h || viewH) - viewH));
  return { x, y, zoom, viewW, viewH };
}

export function mobaScreenToWorld(match, screenX, screenY, width = 960, height = 540) {
  const camera = mobaCamera(match, width, height);
  return { x: camera.x + screenX / camera.zoom, y: camera.y + screenY / camera.zoom };
}

function drawBar(ctx, x, y, w, h, value, max, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, value / Math.max(1, max))) * w, h);
}

export function renderMoba(ctx, match, options = {}) {
  if (!ctx || !match) return;
  const width = options.width || ctx.canvas?.width || 960;
  const height = options.height || ctx.canvas?.height || 540;
  const camera = mobaCamera(match, width, height);
  const now = options.time || 0;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
  const map = match.map;
  ctx.fillStyle = map.ground;
  ctx.fillRect(0, 0, map.w, map.h);
  // Terrain texture: deliberate low-frequency bands, not per-frame particles.
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = map.sky;
  ctx.lineWidth = 1;
  for (let x = 0; x < map.w; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, map.h); ctx.stroke();
  }
  for (let y = 0; y < map.h; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(map.w, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Jungle bodies and the river crossing the middle.
  ctx.fillStyle = 'rgba(35, 74, 55, 0.45)';
  ctx.beginPath();
  ctx.ellipse(map.w / 2, map.h / 2, 330, 290, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = map.river;
  ctx.lineWidth = 52;
  ctx.globalAlpha = 0.42;
  ctx.beginPath();
  ctx.moveTo(map.w * 0.22, 0);
  ctx.bezierCurveTo(map.w * 0.36, map.h * 0.35, map.w * 0.64, map.h * 0.65, map.w * 0.78, map.h);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Lanes.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const lane of ['top', 'mid', 'bot']) {
    const points = map.lanes[lane];
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 54;
    ctx.beginPath();
    points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.strokeStyle = map.lane;
    ctx.globalAlpha = 0.54;
    ctx.lineWidth = 40;
    ctx.beginPath();
    points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.setLineDash([12, 22]);
    ctx.strokeStyle = 'rgba(255, 230, 180, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([x, y], index) => (index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Bases.
  for (const team of ['blue', 'red']) {
    const base = map.base[team];
    ctx.fillStyle = team === 'blue' ? 'rgba(76, 201, 240, 0.14)' : 'rgba(239, 71, 111, 0.14)';
    ctx.beginPath(); ctx.arc(base.x, base.y, 150, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = team === 'blue' ? 'rgba(76, 201, 240, 0.5)' : 'rgba(239, 71, 111, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(base.x, base.y, 112, 0, Math.PI * 2); ctx.stroke();
  }
  // Camps.
  for (const camp of match.camps) {
    if (camp.dead) continue;
    ctx.fillStyle = camp.aggro ? 'rgba(255, 120, 90, 0.28)' : 'rgba(120, 194, 107, 0.18)';
    ctx.beginPath(); ctx.arc(camp.x, camp.y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#78c26b';
    ctx.beginPath(); ctx.arc(camp.x, camp.y, 10, 0, Math.PI * 2); ctx.fill();
    drawBar(ctx, camp.x - 24, camp.y - 24, 48, 4, camp.hp, camp.maxHp, '#78c26b');
  }
  // Tower bases, then units.
  for (const tower of match.towers) {
    if (tower.dead) continue;
    const color = tower.team === 'blue' ? map.blue : map.red;
    if (tower.kind === 'core') {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.arc(tower.x, tower.y, 90, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#17100e';
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
        const px = tower.x + Math.cos(angle) * 46;
        const py = tower.y + Math.sin(angle) * 46;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('✦', tower.x, tower.y);
      drawBar(ctx, tower.x - 55, tower.y - 64, 110, 6, tower.hp, tower.maxHp, color);
      ctx.font = '10px serif'; ctx.fillStyle = '#f4e6ce';
      ctx.fillText('NEXUS', tower.x, tower.y - 72);
      continue;
    }
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(8, 8, 8, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tower.x, tower.y - 27);
    ctx.lineTo(tower.x + 19, tower.y + 18);
    ctx.lineTo(tower.x - 19, tower.y + 18);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(tower.x - 3, tower.y - 7, 6, 20);
    drawBar(ctx, tower.x - 27, tower.y - 38, 54, 4, tower.hp, tower.maxHp, color);
  }
  // Epics.
  for (const epic of match.epics) {
    if (epic.dead) continue;
    ctx.fillStyle = 'rgba(255, 209, 102, 0.16)';
    ctx.beginPath(); ctx.arc(epic.x, epic.y, 58, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(epic.x, epic.y, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('☠', epic.x, epic.y);
    drawBar(ctx, epic.x - 48, epic.y - 50, 96, 6, epic.hp, epic.maxHp, '#ffd166');
    ctx.font = '10px serif'; ctx.fillStyle = '#ffe8a3';
    ctx.fillText(epic.name, epic.x, epic.y - 59);
  }
  // Minions.
  for (const minion of match.minions) {
    if (minion.dead) continue;
    const color = minion.team === 'blue' ? map.blue : map.red;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b0807'; ctx.font = 'bold 9px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(minion.short, minion.x, minion.y + 1);
    drawBar(ctx, minion.x - 12, minion.y - 16, 24, 3, minion.hp, minion.maxHp, color);
  }
  // Projectiles.
  for (const projectile of match.projectiles) {
    ctx.fillStyle = projectile.color || '#ffe8a3';
    ctx.shadowColor = projectile.color || '#ffe8a3';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(projectile.x, projectile.y, projectile.radius || 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  // Effects.
  for (const effect of match.effects) {
    const alpha = Math.max(0, effect.life / effect.maxLife);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = effect.color || '#ffe8a3';
    ctx.fillStyle = effect.color || '#ffe8a3';
    if (effect.type === 'ring' || effect.type === 'burst') {
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1.2 - alpha * 0.3), 0, Math.PI * 2); ctx.stroke();
    } else if (effect.type === 'line') {
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(effect.x - Math.cos(effect.angle) * 90, effect.y - Math.sin(effect.angle) * 90);
      ctx.lineTo(effect.x + Math.cos(effect.angle) * 90, effect.y + Math.sin(effect.angle) * 90);
      ctx.stroke();
    } else if (effect.type === 'slash') {
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius, effect.angle - 0.7, effect.angle + 0.7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // Heroes last so their nameplates stay readable.
  for (const hero of match.heroes) {
    if (hero.dead) continue;
    const color = hero.team === 'blue' ? map.blue : map.red;
    if (hero.isPlayer) {
      ctx.strokeStyle = '#ffe8a3'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hero.x, hero.y, 25 + Math.sin(now * 3) * 2, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.beginPath(); ctx.arc(hero.x, hero.y, hero.radius + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hero.color || color;
    ctx.beginPath(); ctx.arc(hero.x, hero.y, hero.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0807'; ctx.font = 'bold 14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(hero.glyph || '✦', hero.x, hero.y + 1);
    if (hero.shield > 0) {
      ctx.strokeStyle = '#9df3d1'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hero.x, hero.y, hero.radius + 6, 0, Math.PI * 2); ctx.stroke();
    }
    drawBar(ctx, hero.x - 23, hero.y - 29, 46, 4, hero.hp, hero.maxHp, color);
    drawBar(ctx, hero.x - 23, hero.y - 23, 46, 2, hero.mana, hero.maxMana, '#5bc0eb');
    ctx.font = '9px serif'; ctx.fillStyle = hero.isPlayer ? '#ffe8a3' : '#e6d8c4';
    ctx.textAlign = 'center';
    ctx.fillText(`${hero.name}${hero.isPlayer ? ' · KAU' : ''}`, hero.x, hero.y - 36);
    ctx.fillStyle = '#b9a58d'; ctx.font = '8px serif';
    ctx.fillText(`L${hero.level}`, hero.x, hero.y + 27);
  }
  // Floating text.
  for (const text of match.texts) {
    ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
    ctx.fillStyle = text.color;
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    ctx.fillText(text.text, text.x, text.y);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // Minimap.
  const miniW = 172;
  const miniH = 104;
  const miniX = width - miniW - 14;
  const miniY = height - miniH - 14;
  ctx.fillStyle = 'rgba(7, 5, 4, 0.82)';
  ctx.fillRect(miniX, miniY, miniW, miniH);
  ctx.strokeStyle = 'rgba(201, 162, 92, 0.5)';
  ctx.strokeRect(miniX + 0.5, miniY + 0.5, miniW - 1, miniH - 1);
  const sx = miniW / map.w;
  const sy = miniH / map.h;
  ctx.globalAlpha = 0.48;
  ctx.strokeStyle = map.lane;
  for (const lane of ['top', 'mid', 'bot']) {
    ctx.beginPath();
    map.lanes[lane].forEach(([x, y], index) => {
      const px = miniX + x * sx;
      const py = miniY + y * sy;
      if (index) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    });
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const tower of match.towers) {
    if (tower.dead) continue;
    ctx.fillStyle = tower.team === 'blue' ? map.blue : map.red;
    ctx.fillRect(miniX + tower.x * sx - 1.5, miniY + tower.y * sy - 1.5, tower.kind === 'core' ? 5 : 3, tower.kind === 'core' ? 5 : 3);
  }
  for (const hero of match.heroes) {
    if (hero.dead) continue;
    ctx.fillStyle = hero.isPlayer ? '#ffe8a3' : hero.team === 'blue' ? map.blue : map.red;
    ctx.beginPath(); ctx.arc(miniX + hero.x * sx, miniY + hero.y * sy, hero.isPlayer ? 3 : 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(244, 230, 206, 0.72)';
  ctx.font = '8px serif'; ctx.textAlign = 'left';
  ctx.fillText(`${match.map.name} · ${Math.floor(match.time / 60)}:${String(Math.floor(match.time % 60)).padStart(2, '0')}`, miniX + 5, miniY + miniH - 5);
}

export function defaultMobaProgress() {
  return {
    version: 1,
    matches: 0,
    wins: 0,
    losses: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    bestTime: 0,
    heroPlays: {},
    mapWins: {},
    lastHero: MOBA_HEROES[0]?.id || 'core_sera',
    lastMap: MOBA_MAPS[0]?.id || 'ashen_rift',
    lastLane: 'mid',
  };
}

export function sanitizeMobaProgress(raw) {
  const base = defaultMobaProgress();
  if (!raw || typeof raw !== 'object') return base;
  for (const key of ['matches', 'wins', 'losses', 'kills', 'deaths', 'assists']) {
    const value = Number(raw[key]);
    base[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }
  const best = Number(raw.bestTime);
  base.bestTime = Number.isFinite(best) ? Math.max(0, Math.round(best)) : 0;
  const heroPlays = {};
  if (raw.heroPlays && typeof raw.heroPlays === 'object') {
    for (const [id, value] of Object.entries(raw.heroPlays)) {
      if (MOBA_HERO_BY_ID[id] && Number.isFinite(Number(value))) heroPlays[id] = Math.max(0, Math.floor(Number(value)));
    }
  }
  base.heroPlays = heroPlays;
  const mapWins = {};
  if (raw.mapWins && typeof raw.mapWins === 'object') {
    for (const [id, value] of Object.entries(raw.mapWins)) {
      if (MOBA_MAP_BY_ID[id] && Number.isFinite(Number(value))) mapWins[id] = Math.max(0, Math.floor(Number(value)));
    }
  }
  base.mapWins = mapWins;
  base.lastHero = MOBA_HERO_BY_ID[raw.lastHero] ? raw.lastHero : base.lastHero;
  base.lastMap = MOBA_MAP_BY_ID[raw.lastMap] ? raw.lastMap : base.lastMap;
  base.lastLane = MOBA_LANES.includes(raw.lastLane) ? raw.lastLane : 'mid';
  for (const [key, value] of Object.entries(raw)) if (!(key in base)) base[key] = value;
  return base;
}

export function recordMobaMatch(rawProgress, result = {}) {
  const progress = sanitizeMobaProgress(rawProgress);
  const heroId = MOBA_HERO_BY_ID[result.heroId] ? result.heroId : progress.lastHero;
  const mapId = MOBA_MAP_BY_ID[result.mapId] ? result.mapId : progress.lastMap;
  const win = !!result.win;
  progress.matches += 1;
  if (win) progress.wins += 1; else progress.losses += 1;
  progress.kills += Math.max(0, Math.floor(Number(result.kills) || 0));
  progress.deaths += Math.max(0, Math.floor(Number(result.deaths) || 0));
  progress.assists += Math.max(0, Math.floor(Number(result.assists) || 0));
  const duration = Math.max(0, Math.round(Number(result.duration) || 0));
  if (win && (!progress.bestTime || duration < progress.bestTime)) progress.bestTime = duration;
  progress.heroPlays[heroId] = (progress.heroPlays[heroId] || 0) + 1;
  if (win) progress.mapWins[mapId] = (progress.mapWins[mapId] || 0) + 1;
  progress.lastHero = heroId;
  progress.lastMap = mapId;
  progress.lastLane = MOBA_LANES.includes(result.lane) ? result.lane : progress.lastLane;
  return { progress, win, heroId, mapId, duration };
}

export function mobaSummary(progress = defaultMobaProgress()) {
  const rate = progress.matches ? Math.round((progress.wins / progress.matches) * 100) : 0;
  const heroesPlayed = Object.keys(progress.heroPlays || {}).filter((id) => MOBA_HERO_BY_ID[id]).length;
  return {
    matches: progress.matches,
    wins: progress.wins,
    losses: progress.losses,
    winRate: rate,
    kills: progress.kills,
    deaths: progress.deaths,
    assists: progress.assists,
    bestTime: progress.bestTime,
    heroesPlayed,
    heroes: MOBA_HERO_COUNT,
    maps: MOBA_MAPS.length,
  };
}
