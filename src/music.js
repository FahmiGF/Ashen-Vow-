// Ashen Vow — procedural music engine.
// Zero audio assets: every track is synthesised from oscillators and filtered
// noise. MusicManager owns its own gain bus, crossfades between tracks, and
// exposes an optional combat layer that fades in near enemies.
export const TRACKS = {
  menu: {
    id: 'menu',
    label: 'Menu — Solemn, hopeful',
    bpm: 60,
    root: 73.42,
    chord: [0, 7, 12, 19],
    arp: [0, 7, 12, 15, 12, 7, 3, 7],
    wave: 'sine',
    pad: 0.05,
    melody: 0.022,
    bass: true,
    drums: false,
    filter: 900,
    color: '#d07a35',
  },
  ashen: {
    id: 'ashen',
    label: 'Ashen Hall — Warm, haunted',
    bpm: 70,
    root: 110,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 12, 10, 7, 3],
    wave: 'triangle',
    pad: 0.042,
    melody: 0.02,
    bass: true,
    drums: false,
    filter: 700,
    color: '#d07a35',
  },
  spiral: {
    id: 'spiral',
    label: 'Eternal Spiral — Relentless, rising',
    bpm: 88,
    root: 87.31,
    chord: [0, 3, 7, 10],
    arp: [0, 7, 10, 12, 15, 12, 10, 7],
    wave: 'sawtooth',
    pad: 0.036,
    melody: 0.024,
    bass: true,
    drums: true,
    filter: 1150,
    color: '#b6a4ff',
  },
  spiralBoss: {
    id: 'spiralBoss',
    label: 'Spiral Tyrant — Choir of the inner ring',
    bpm: 104,
    root: 82.41,
    chord: [0, 1, 5, 8],
    arp: [0, 8, 5, 12, 13, 12, 8, 1],
    wave: 'square',
    pad: 0.042,
    melody: 0.028,
    bass: true,
    drums: true,
    filter: 1500,
    color: '#ffb45c',
  },
  spiralTrailer: {
    id: 'spiralTrailer',
    label: 'Spiral Trailer — Epic, slow build',
    bpm: 64,
    root: 65.41,
    chord: [0, 5, 7, 12],
    arp: [0, 7, 12, 17, 19, 17, 12, 7],
    wave: 'triangle',
    pad: 0.06,
    melody: 0.03,
    bass: true,
    drums: true,
    filter: 720,
    color: '#c9a9ff',
  },
  mycelial: {
    id: 'mycelial',
    label: 'Mycelial Hollow — Dreamy, eerie',
    bpm: 80,
    root: 98,
    chord: [0, 5, 7, 12],
    arp: [0, 5, 12, 15, 12, 7, 5, 2],
    wave: 'sine',
    pad: 0.046,
    melody: 0.024,
    bass: false,
    drums: false,
    filter: 1200,
    color: '#a86bd8',
  },
  cistern: {
    id: 'cistern',
    label: 'Tidewrought Cistern — Cold, echoing',
    bpm: 65,
    root: 82.41,
    chord: [0, 7, 10, 14],
    arp: [0, 10, 7, 12, 19, 12, 7, 10],
    wave: 'sine',
    pad: 0.04,
    melody: 0.02,
    bass: true,
    drums: false,
    filter: 600,
    color: '#3fa89a',
  },
  frostglass: {
    id: 'frostglass',
    label: 'Frostglass Cathedral — Majestic, fragile',
    bpm: 75,
    root: 130.81,
    chord: [0, 4, 7, 12],
    arp: [0, 4, 7, 12, 16, 12, 7, 4],
    wave: 'triangle',
    pad: 0.045,
    melody: 0.017,
    bass: false,
    drums: false,
    filter: 1600,
    color: '#7fc9e8',
  },
  cinder: {
    id: 'cinder',
    label: 'Cinder Maw — Heavy, urgent',
    bpm: 95,
    root: 73.42,
    chord: [0, 3, 7, 10],
    arp: [0, 0, 3, 7, 3, 10, 7, 3],
    wave: 'sawtooth',
    pad: 0.038,
    melody: 0.022,
    bass: true,
    drums: true,
    filter: 520,
    color: '#e0553b',
  },
  ashenwood: {
    id: 'ashenwood',
    label: 'Hutan Abu — Warm, watchful',
    bpm: 72,
    root: 110,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 12, 10, 7, 3],
    wave: 'triangle',
    pad: 0.04,
    melody: 0.019,
    bass: true,
    drums: false,
    filter: 680,
    color: '#d07a35',
  },
  bonemarsh: {
    id: 'bonemarsh',
    label: 'Rawa Tulang — Murky, patient',
    bpm: 64,
    root: 98,
    chord: [0, 2, 7, 9],
    arp: [0, 2, 7, 9, 12, 9, 7, 2],
    wave: 'sine',
    pad: 0.045,
    melody: 0.016,
    bass: true,
    drums: false,
    filter: 520,
    color: '#8fae6a',
  },
  echocrater: {
    id: 'echocrater',
    label: 'Kawah Gema — Forge-hot, relentless',
    bpm: 104,
    root: 73.42,
    chord: [0, 3, 7, 10],
    arp: [0, 0, 3, 7, 3, 10, 7, 3],
    wave: 'sawtooth',
    pad: 0.036,
    melody: 0.024,
    bass: true,
    drums: true,
    filter: 500,
    color: '#e0553b',
  },
  buriedcity: {
    id: 'buriedcity',
    label: 'Kota Terkubur — Dusty, ceremonial',
    bpm: 68,
    root: 87.31,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 14, 11, 7, 4],
    wave: 'triangle',
    pad: 0.042,
    melody: 0.018,
    bass: true,
    drums: false,
    filter: 760,
    color: '#c9a25c',
  },
  crystalcave: {
    id: 'crystalcave',
    label: 'Gua Kristal — Glassy, remembering',
    bpm: 78,
    root: 130.81,
    chord: [0, 5, 7, 12],
    arp: [0, 5, 12, 17, 19, 17, 12, 5],
    wave: 'sine',
    pad: 0.046,
    melody: 0.02,
    bass: false,
    drums: false,
    filter: 1800,
    color: '#7fc9e8',
  },
  stormexpanse: {
    id: 'stormexpanse',
    label: 'Padang Badai — Charged, restless',
    bpm: 112,
    root: 82.41,
    chord: [0, 2, 7, 10],
    arp: [0, 2, 7, 10, 14, 10, 7, 2],
    wave: 'sawtooth',
    pad: 0.038,
    melody: 0.023,
    bass: true,
    drums: true,
    filter: 700,
    color: '#6fa8dc',
  },
  roottemple: {
    id: 'roottemple',
    label: 'Kuil Akar — Breathing, ancient',
    bpm: 58,
    root: 92.5,
    chord: [0, 5, 7, 10],
    arp: [0, 5, 7, 10, 12, 10, 7, 5],
    wave: 'triangle',
    pad: 0.05,
    melody: 0.017,
    bass: true,
    drums: false,
    filter: 620,
    color: '#a86bd8',
  },
  mistsea: {
    id: 'mistsea',
    label: 'Lautan Kabut — Vast, mournful',
    bpm: 60,
    root: 116.54,
    chord: [0, 3, 7, 14],
    arp: [0, 3, 7, 14, 15, 14, 7, 3],
    wave: 'sine',
    pad: 0.048,
    melody: 0.016,
    bass: true,
    drums: false,
    filter: 560,
    color: '#8ba8a0',
  },
  clockwork: {
    id: 'clockwork',
    label: 'Menara Waktu — Ticking, inevitable',
    bpm: 120,
    root: 98,
    chord: [0, 4, 7, 10],
    arp: [0, 4, 7, 10, 12, 10, 7, 4],
    wave: 'square',
    pad: 0.032,
    melody: 0.02,
    bass: true,
    drums: true,
    filter: 900,
    color: '#d6ac66',
  },
  forgotten: {
    id: 'forgotten',
    label: 'Singgasana Terlupakan — Final, luminous',
    bpm: 54,
    root: 146.83,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 12, 19, 24, 19],
    wave: 'sine',
    pad: 0.052,
    melody: 0.022,
    bass: true,
    drums: false,
    filter: 1400,
    color: '#e8b46a',
  },
  boss: {
    id: 'boss',
    label: 'Boss — Intense, rhythmic',
    bpm: 132,
    root: 82.41,
    chord: [0, 1, 7, 8],
    arp: [0, 1, 7, 8, 12, 8, 7, 1],
    wave: 'sawtooth',
    pad: 0.042,
    melody: 0.028,
    bass: true,
    drums: true,
    filter: 640,
    color: '#e0553b',
  },
  mycelialBoss: {
    id: 'mycelialBoss',
    label: 'Sporebound — Swarming, organic',
    bpm: 124,
    root: 87.31,
    chord: [0, 5, 6, 10],
    arp: [0, 5, 10, 12, 15, 12, 10, 6],
    wave: 'triangle',
    pad: 0.048,
    melody: 0.03,
    bass: true,
    drums: true,
    filter: 760,
    color: '#b07be8',
  },
  cisternBoss: {
    id: 'cisternBoss',
    label: 'Vasska — Drowning, ceremonial',
    bpm: 96,
    root: 77.78,
    chord: [0, 3, 7, 10],
    arp: [0, 7, 3, 12, 10, 7, 3, 0],
    wave: 'sine',
    pad: 0.05,
    melody: 0.028,
    bass: true,
    drums: true,
    filter: 640,
    color: '#5fd3c2',
  },
  hearthfall: {
    id: 'hearthfall',
    label: 'Hearthfall — Warm, wounded',
    bpm: 66,
    root: 103.83,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 12, 10, 7, 3],
    wave: 'triangle',
    pad: 0.046,
    melody: 0.021,
    bass: true,
    drums: false,
    filter: 740,
    color: '#e08a4a',
  },
  glassorchard: {
    id: 'glassorchard',
    label: 'Glass Orchard — Brittle, reverent',
    bpm: 74,
    root: 123.47,
    chord: [0, 5, 7, 12],
    arp: [0, 5, 12, 17, 19, 17, 12, 5],
    wave: 'sine',
    pad: 0.044,
    melody: 0.019,
    bass: false,
    drums: false,
    filter: 1500,
    color: '#8fc9a8',
  },
  hollowcourt: {
    id: 'hollowcourt',
    label: 'The Hollow Court — Empty, patient',
    bpm: 62,
    root: 92.5,
    chord: [0, 3, 7, 11],
    arp: [0, 3, 7, 11, 14, 11, 7, 3],
    wave: 'triangle',
    pad: 0.05,
    melody: 0.017,
    bass: true,
    drums: false,
    filter: 620,
    color: '#b28fd8',
  },
  cinderworks: {
    id: 'cinderworks',
    label: 'Cinderworks — Industrial, relentless',
    bpm: 92,
    root: 82.41,
    chord: [0, 3, 6, 10],
    arp: [0, 3, 6, 10, 12, 10, 6, 3],
    wave: 'square',
    pad: 0.035,
    melody: 0.02,
    bass: true,
    drums: true,
    filter: 640,
    color: '#d96a4a',
  },
  lastvigil: {
    id: 'lastvigil',
    label: 'Last Vigil — Cold, watchful',
    bpm: 58,
    root: 98,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 14, 11, 7, 4],
    wave: 'sine',
    pad: 0.05,
    melody: 0.018,
    bass: true,
    drums: false,
    filter: 1150,
    color: '#7fa8d8',
  },
  reliquary: {
    id: 'reliquary',
    label: 'The Ashen Reliquary — Golden, buried',
    bpm: 54,
    root: 110,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 14, 11, 7, 4],
    wave: 'sine',
    pad: 0.052,
    melody: 0.016,
    bass: true,
    drums: false,
    filter: 980,
    color: '#d8b45c',
  },
  reliquaryBoss: {
    id: 'reliquaryBoss',
    label: 'The First Vow — Oath, unbroken',
    bpm: 142,
    root: 82.41,
    chord: [0, 2, 7, 11],
    arp: [0, 2, 7, 11, 14, 11, 7, 2],
    wave: 'square',
    pad: 0.042,
    melody: 0.03,
    bass: true,
    drums: true,
    filter: 820,
    color: '#ffe0a0',
  },
  courtBoss: {
    id: 'courtBoss',
    label: 'Hollow Court Boss — Regal, collapsing',
    bpm: 138,
    root: 87.31,
    chord: [0, 1, 6, 10],
    arp: [0, 1, 6, 10, 13, 10, 6, 1],
    wave: 'square',
    pad: 0.04,
    melody: 0.029,
    bass: true,
    drums: true,
    filter: 700,
    color: '#e0c8ff',
  },
  hearth: {
    id: 'hearth',
    label: 'The Hearth — Home, quiet',
    bpm: 56,
    root: 110,
    chord: [0, 4, 7, 9],
    arp: [0, 4, 7, 9, 12, 9, 7, 4],
    wave: 'sine',
    pad: 0.052,
    melody: 0.018,
    bass: true,
    drums: false,
    filter: 840,
    color: '#d8a35c',
  },
  // ── Eternal Stage boss tracks ────────────────────────────────────────────
  // One distinct theme per pack guardian, plus the two shared court extras.
  bossAsh: {
    id: 'bossAsh',
    label: 'Ash King — Colossal, relentless',
    bpm: 150,
    root: 87.31,
    chord: [0, 1, 7, 8],
    arp: [0, 1, 7, 8, 13, 8, 7, 1, 0, 7, 12, 7, 8, 13, 8, 1],
    wave: 'sawtooth',
    pad: 0.05,
    melody: 0.032,
    bass: true,
    drums: true,
    filter: 720,
    color: '#e0553b',
  },
  bossGlass: {
    id: 'bossGlass',
    label: 'Glass Warden — Brittle, shrieking',
    bpm: 140,
    root: 98,
    chord: [0, 5, 7, 11],
    arp: [0, 5, 7, 11, 12, 17, 19, 17, 12, 11, 7, 5],
    wave: 'triangle',
    pad: 0.046,
    melody: 0.03,
    bass: true,
    drums: true,
    filter: 980,
    color: '#8fc9a8',
  },
  bossAbbot: {
    id: 'bossAbbot',
    label: 'Hollow Abbot — Choral dread',
    bpm: 118,
    root: 73.42,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 10, 7, 12, 10, 3, 0],
    wave: 'sine',
    pad: 0.055,
    melody: 0.026,
    bass: true,
    drums: true,
    filter: 620,
    color: '#a86bd8',
  },
  bossStorm: {
    id: 'bossStorm',
    label: 'Storm Valkyr — Thunderous, soaring',
    bpm: 158,
    root: 110,
    chord: [0, 2, 7, 9],
    arp: [0, 7, 9, 12, 14, 12, 9, 7, 0, 2, 7, 14, 16, 14, 7, 2],
    wave: 'sawtooth',
    pad: 0.045,
    melody: 0.031,
    bass: true,
    drums: true,
    filter: 840,
    color: '#7fc9e8',
  },
  bossDawn: {
    id: 'bossDawn',
    label: 'Last Dawn — Radiant, tragic',
    bpm: 132,
    root: 123.47,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 11, 12, 16, 19, 23, 19, 16, 12, 11],
    wave: 'triangle',
    pad: 0.05,
    melody: 0.028,
    bass: true,
    drums: true,
    filter: 1150,
    color: '#e8b46a',
  },
  bossJudge: {
    id: 'bossJudge',
    label: 'Oath Eater — Apocalyptic finale',
    bpm: 170,
    root: 92.5,
    chord: [0, 1, 6, 8],
    arp: [0, 1, 6, 8, 12, 13, 18, 20, 18, 13, 12, 8, 6, 1],
    wave: 'sawtooth',
    pad: 0.052,
    melody: 0.034,
    bass: true,
    drums: true,
    filter: 700,
    color: '#d6ac66',
  },
  // ── Faewood: mushroom and fairy biome ────────────────────────────────────
  faewood: {
    id: 'faewood',
    label: 'Faewood — Glimmering, watchful',
    bpm: 88,
    root: 146.83,
    chord: [0, 2, 7, 9],
    arp: [0, 7, 9, 12, 14, 12, 9, 7, 2, 9, 14, 16, 14, 9, 7, 2],
    wave: 'sine',
    pad: 0.042,
    melody: 0.02,
    bass: false,
    drums: false,
    filter: 1650,
    color: '#9be8c8',
  },
  magmaBoss: {
    id: 'magmaBoss',
    label: 'Magma Slime — Boiling, heavy',
    bpm: 146,
    root: 65.41,
    chord: [0, 1, 5, 8],
    arp: [0, 1, 5, 8, 12, 13, 17, 20, 17, 13, 12, 8, 5, 1],
    wave: 'sawtooth',
    pad: 0.055,
    melody: 0.033,
    bass: true,
    drums: true,
    filter: 560,
    color: '#ff7a3c',
  },
  fairyBoss: {
    id: 'fairyBoss',
    label: 'Spectral Fairy Dragon — Celestial, furious',
    bpm: 162,
    root: 110,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 14, 15, 19, 22, 19, 15, 14, 10, 7, 3, 0, 7],
    wave: 'triangle',
    pad: 0.05,
    melody: 0.035,
    bass: true,
    drums: true,
    filter: 1250,
    color: '#f0c8ff',
  },
  celebration: {
    id: 'celebration',
    label: 'Celebration — Opus freed, dawn rising',
    bpm: 104,
    root: 130.81,
    chord: [0, 4, 7, 11],
    arp: [0, 4, 7, 12, 16, 19, 24, 19, 16, 12, 7, 4, 0, 7, 12, 16],
    wave: 'triangle',
    pad: 0.055,
    melody: 0.04,
    bass: true,
    drums: true,
    filter: 2100,
    color: '#ffe6a8',
  },
  frontier: {
    id: 'frontier',
    label: 'Infinite Frontiers — Vast, ascending',
    bpm: 92,
    root: 98,
    chord: [0, 5, 7, 12],
    arp: [0, 5, 7, 12, 17, 12, 7, 5, 0, 7, 12, 19, 17, 12, 7, 5],
    wave: 'triangle',
    pad: 0.044,
    melody: 0.024,
    bass: true,
    drums: false,
    filter: 1450,
    color: '#8ec5fc',
  },
  frontierBoss: {
    id: 'frontierBoss',
    label: 'Aethron, the Origin Beyond — First flame, final throne',
    bpm: 150,
    root: 61.74,
    chord: [0, 3, 7, 10],
    arp: [0, 3, 7, 10, 15, 19, 22, 19, 15, 10, 7, 3, 0, 3, 7, 10],
    wave: 'sawtooth',
    pad: 0.055,
    melody: 0.036,
    bass: true,
    drums: true,
    filter: 980,
    color: '#f72585',
  },
  overdrive: {
    id: 'overdrive',
    label: 'Overdrive — Eternal Realm, high pulse',
    bpm: 108,
    root: 110,
    chord: [0, 3, 7, 11],
    arp: [0, 7, 11, 14, 19, 14, 11, 7],
    wave: 'sawtooth',
    pad: 0.042,
    melody: 0.026,
    bass: true,
    drums: true,
    filter: 1650,
    color: '#fb7185',
  },
  overdriveBoss: {
    id: 'overdriveBoss',
    label: 'Overdrive — First God Pantheon',
    bpm: 142,
    root: 73.42,
    chord: [0, 4, 7, 11],
    arp: [0, 7, 12, 16, 19, 23, 19, 12],
    wave: 'square',
    pad: 0.05,
    melody: 0.032,
    bass: true,
    drums: true,
    filter: 1420,
    color: '#fbbf24',
  },
  rift: {
    id: 'rift',
    label: 'The Rift — Fractured, dual-phase',
    bpm: 112,
    root: 92.5,
    chord: [0, 3, 6, 10],
    arp: [0, 6, 10, 12, 15, 12, 10, 6],
    wave: 'sawtooth',
    pad: 0.04,
    melody: 0.025,
    bass: true,
    drums: true,
    filter: 1380,
    color: '#e05a7a',
  },
  riftBoss: {
    id: 'riftBoss',
    label: 'The Devilish Scum — Sovereign of the Seam',
    bpm: 134,
    root: 82.41,
    chord: [0, 1, 5, 8],
    arp: [0, 8, 12, 13, 17, 13, 8, 1],
    wave: 'square',
    pad: 0.048,
    melody: 0.03,
    bass: true,
    drums: true,
    filter: 1620,
    color: '#ff3b5c',
  },
  victory: {
    id: 'victory',
    label: 'Victory — Bittersweet',
    bpm: 55,
    root: 130.81,
    chord: [0, 4, 7, 11],
    arp: [0, 7, 12, 16, 19, 16, 12, 7],
    wave: 'sine',
    pad: 0.05,
    melody: 0.024,
    bass: true,
    drums: false,
    filter: 1100,
    color: '#e0b45f',
  },
};

export const TRACK_IDS = Object.keys(TRACKS);

export function trackForZone(zoneId) {
  return TRACKS[zoneId] || TRACKS.ashen;
}

export function isKnownTrack(trackId) {
  return Object.prototype.hasOwnProperty.call(TRACKS, trackId);
}

// Every boss kind can claim its own theme. Anything unmapped keeps the zone's
// boss track, so adding a boss never silently drops the music.
export const BOSS_TRACKS = {
  warden: 'boss',
  wyrm: 'boss',
  choir: 'bossAbbot',
  oathbreaker: 'bossJudge',
  sporebound: 'mycelialBoss',
  root: 'bossGlass',
  court_boss_hearthmother: 'courtBoss',
  court_boss_orchardsaint: 'bossGlass',
  court_boss_nameless: 'bossAbbot',
  court_boss_forgeking: 'bossAsh',
  court_boss_lastwatch: 'bossDawn',
  court_boss_firstvow: 'bossJudge',
  pack_ashking: 'bossAsh',
  pack_glasswarden: 'bossGlass',
  pack_hollowabbot: 'bossAbbot',
  pack_stormvalkyr: 'bossStorm',
  pack_dawnseraph: 'bossDawn',
  pack_oatheater: 'bossJudge',
  fairy_magma_slime: 'magmaBoss',
  fairy_spectral_dragon: 'fairyBoss',
  tidebound: 'cisternBoss',
  wickbearer: 'bossDawn',
  skybreaker: 'bossStorm',
  emperor_solvar: 'bossAsh',
  primordial_leviathan: 'cisternBoss',
  zarakh_sovereign: 'magmaBoss',
  elder_yggvar: 'courtBoss',
  astral_devourer: 'bossGlass',
  architect_of_nothing: 'bossAbbot',
  chronos_mechanism: 'reliquaryBoss',
  gorath_first_colossus: 'mycelialBoss',
  aethron_origin: 'frontierBoss',
  sunken_emperor: 'cisternBoss',
  prism_devourer: 'bossGlass',
  forge_titan: 'magmaBoss',
  mother_of_thorns: 'mycelialBoss',
  starbound_regent: 'bossStorm',
  pale_frost_monarch: 'frostglass',
  grand_horologist: 'reliquaryBoss',
  the_unmade: 'overdriveBoss',
  sandstorm_sovereign: 'bossAsh',
  the_first_god: 'overdriveBoss',
};

export function bossTrackFor(kind, fallback = 'boss') {
  const track = BOSS_TRACKS[kind];
  if (track && TRACKS[track]) return track;
  if (TRACKS[fallback]) return fallback;
  return 'boss';
}

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

const semitone = (root, semis) => root * Math.pow(2, semis / 12);

export class MusicManager {
  constructor(kit) {
    this.kit = kit;
    this.bus = null;
    this.current = null;
    this.trackId = null;
    this.volume = 1;
    this.layerVolumes = { combat: 0 };
    this.phaseLevel = 0;
    this.enabled = true;
  }

  // Boss phase escalation: brighter filter, extra low pulse, louder percussion.
  setBossPhase(phase = 1, maxPhases = 3) {
    const max = Math.max(2, Number(maxPhases) || 2);
    const level = clamp01(((Number(phase) || 1) - 1) / (max - 1));
    this.phaseLevel = level;
    const track = this.current;
    const ctx = this.kit?.ctx;
    if (!track || !ctx) return level;
    const now = ctx.currentTime;
    if (track.phaseGain) {
      track.phaseGain.gain.cancelScheduledValues(now);
      track.phaseGain.gain.setValueAtTime(Math.max(0.0001, track.phaseGain.gain.value), now);
      track.phaseGain.gain.linearRampToValueAtTime(0.0001 + level * 0.9, now + 0.6);
    }
    if (track.filter && track.def?.filter) {
      track.filter.frequency.cancelScheduledValues(now);
      track.filter.frequency.setValueAtTime(track.filter.frequency.value, now);
      track.filter.frequency.linearRampToValueAtTime(track.def.filter * (1 + level * 0.85), now + 0.8);
    }
    return level;
  }

  clearBossPhase() {
    this.setBossPhase(1, 2);
  }

  ensureBus() {
    if (!this.kit) return null;
    this.kit.init();
    const ctx = this.kit.ctx;
    if (!ctx) return null;
    if (!this.bus) {
      this.bus = ctx.createGain();
      this.bus.gain.value = this.volume;
      // If the SoundKit exposes a dedicated music bus, use it so Settings can
      // mix music independently from SFX. Otherwise fall back to master.
      const destination = this.kit.music || this.kit.master;
      if (destination) this.bus.connect(destination);
    }
    return ctx;
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (this.bus && this.kit?.ctx) {
      const now = this.kit.ctx.currentTime;
      this.bus.gain.cancelScheduledValues(now);
      this.bus.gain.linearRampToValueAtTime(this.volume, now + 0.15);
    }
  }

  setLayer(name, volume, seconds = 0.8) {
    this.layerVolumes[name] = Math.max(0, Math.min(1, Number(volume) || 0));
    const track = this.current;
    if (!track?.layerGain || !this.kit?.ctx) return;
    const now = this.kit.ctx.currentTime;
    track.layerGain.gain.cancelScheduledValues(now);
    track.layerGain.gain.setValueAtTime(track.layerGain.gain.value, now);
    track.layerGain.gain.linearRampToValueAtTime(this.layerVolumes[name], now + seconds);
  }

  play(trackId, fade = 1.4) {
    const def = TRACKS[trackId];
    if (!def) return false;
    const ctx = this.ensureBus();
    if (!ctx) return false;
    if (this.current && this.trackId === trackId) {
      // Same track: just make sure it is audible again (e.g. after stop()).
      const now = ctx.currentTime;
      this.current.gain.gain.cancelScheduledValues(now);
      this.current.gain.gain.linearRampToValueAtTime(1, now + fade);
      return true;
    }
    const previous = this.current;
    if (previous) this.fadeOut(previous, Math.min(1.2, fade));
    const built = this.build(trackId, def);
    if (!built) return false;
    this.current = built;
    this.trackId = trackId;
    const now = ctx.currentTime;
    built.gain.gain.setValueAtTime(0.0001, now);
    built.gain.gain.linearRampToValueAtTime(1, now + fade);
    return true;
  }

  crossfadeTo(trackId, fade = 1.8) {
    return this.play(trackId, fade);
  }

  stop(fade = 1.2) {
    if (!this.current) {
      this.trackId = null;
      return;
    }
    this.fadeOut(this.current, fade);
    this.current = null;
    this.trackId = null;
  }

  fadeOut(track, seconds) {
    const ctx = this.kit?.ctx;
    if (!ctx || !track) return;
    const now = ctx.currentTime;
    try {
      track.gain.gain.cancelScheduledValues(now);
      track.gain.gain.setValueAtTime(Math.max(0.0001, track.gain.gain.value), now);
      track.gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    } catch {
      /* already silent */
    }
    clearInterval(track.interval);
    setTimeout(() => {
      for (const osc of track.oscillators) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }
      try {
        track.gain.disconnect();
      } catch {
        /* already disconnected */
      }
    }, Math.max(60, seconds * 1000 + 120));
  }

  build(trackId, def) {
    const ctx = this.kit?.ctx;
    if (!ctx || !this.bus) return null;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(this.bus);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = def.filter || 800;
    filter.Q.value = 0.9;
    filter.connect(gain);

    const pad = ctx.createGain();
    pad.gain.value = def.pad || 0.04;
    pad.connect(filter);

    const oscillators = [];
    for (const semis of def.chord) {
      const osc = ctx.createOscillator();
      osc.type = def.wave;
      osc.frequency.value = semitone(def.root, semis);
      osc.detune.value = (Math.random() - 0.5) * 9;
      const voice = ctx.createGain();
      voice.gain.value = 0.32;
      osc.connect(voice).connect(pad);
      osc.start(now);
      oscillators.push(osc);
    }

    // Slow filter movement keeps pads from sounding static.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = (def.filter || 800) * 0.22;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start(now);
    oscillators.push(lfo);

    const layerGain = ctx.createGain();
    layerGain.gain.value = this.layerVolumes.combat || 0;
    layerGain.connect(gain);

    const phaseGain = ctx.createGain();
    phaseGain.gain.value = 0.0001 + (this.phaseLevel || 0) * 0.9;
    phaseGain.connect(gain);

    const track = {
      id: trackId,
      def,
      gain,
      filter,
      layerGain,
      phaseGain,
      oscillators,
      interval: 0,
      step: 0,
      nextTime: now + 0.08,
    };
    this.schedule(track);
    track.interval = setInterval(() => this.schedule(track), 320);
    return track;
  }

  schedule(track) {
    const ctx = this.kit?.ctx;
    if (!ctx || !track) return;
    const now = ctx.currentTime;
    if (track.nextTime < now - 0.4) track.nextTime = now + 0.05;
    const stepDur = 60 / track.def.bpm / 2;
    while (track.nextTime < now + 1.1) {
      const pattern = track.def.arp;
      const step = track.step % pattern.length;
      const semis = pattern[step];
      if (semis !== null) {
        this.note(
          track,
          semitone(track.def.root * 2, semis),
          track.nextTime,
          stepDur * 1.5,
          track.def.melody || 0.02,
          track.def.wave,
          track.gain,
        );
      }
      if (track.def.bass && step % 4 === 0) {
        this.note(
          track,
          semitone(track.def.root / 2, 0),
          track.nextTime,
          stepDur * 3,
          (track.def.melody || 0.02) * 1.15,
          'sine',
          track.gain,
        );
      }
      if ((this.phaseLevel || 0) > 0.01 && step % 2 === 0) {
        this.note(
          track,
          semitone(track.def.root / 2, step % 4 === 0 ? 7 : 0),
          track.nextTime,
          stepDur * 1.2,
          (track.def.melody || 0.02) * (0.4 + this.phaseLevel * 1.1),
          'square',
          track.phaseGain,
        );
      }
      if (track.def.drums) {
        if (step % 4 === 0) this.kick(track, track.nextTime, track.gain);
        if (step % 2 === 1) this.hat(track, track.nextTime, track.layerGain);
      } else if (step % 8 === 0) {
        // A sparse pulse only becomes audible when the combat layer fades in.
        this.hat(track, track.nextTime, track.layerGain);
      }
      track.nextTime += stepDur;
      track.step += 1;
    }
  }

  note(track, freq, time, dur, level, type, destination) {
    const ctx = this.kit?.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0005, level), time + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(env).connect(destination);
    osc.start(time);
    osc.stop(time + dur + 0.03);
  }

  kick(track, time, destination) {
    const ctx = this.kit?.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.16);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.11, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(env).connect(destination);
    osc.start(time);
    osc.stop(time + 0.24);
    void track;
  }

  hat(track, time, destination) {
    const ctx = this.kit?.ctx;
    if (!ctx || !this.kit.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.kit.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4200;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.05, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    src.connect(filter).connect(env).connect(destination);
    src.start(time);
    src.stop(time + 0.11);
    void track;
  }
}
