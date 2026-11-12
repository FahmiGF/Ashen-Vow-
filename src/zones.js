// Ashen Vow — zone configuration.
// A room belongs to a zone; a zone owns its palette, particle mood, map colour
// and music track IDs. Adding a zone here (plus rooms in core.js) never
// requires touching the audio or map code.
import { ALL_ROOMS, ROOMS } from './core.js';
import { BIOMES } from './expansion.js';

export const ZONES = {
  ashen: {
    id: 'ashen',
    name: 'Ashen Hall',
    subtitle: 'Balai Abu',
    color: '#d07a35',
    mapColor: '#d07a35',
    music: 'ashen',
    bossMusic: 'boss',
    particle: 'ash',
    palette: {
      top: '#0c0a09',
      mid: '#1b1410',
      low: '#2a1a11',
      glow: '#d07a35',
      fog: '#3a2a1f',
    },
  },
  mycelial: {
    id: 'mycelial',
    name: 'Mycelial Hollow',
    subtitle: 'Rongga Miselium',
    color: '#a86bd8',
    mapColor: '#a86bd8',
    music: 'mycelial',
    bossMusic: 'mycelialBoss',
    particle: 'spores',
    palette: {
      top: '#0d0614',
      mid: '#1d0f2b',
      low: '#2a1640',
      glow: '#b07be8',
      fog: '#38224f',
    },
  },
  cistern: {
    id: 'cistern',
    name: 'Tidewrought Cistern',
    subtitle: 'Sistem Air Pasang',
    color: '#3fa89a',
    mapColor: '#3fa89a',
    music: 'cistern',
    bossMusic: 'boss',
    particle: 'bubbles',
    palette: {
      top: '#04100f',
      mid: '#0b2624',
      low: '#143a35',
      glow: '#5fd3c2',
      fog: '#1d4b47',
    },
  },
  frostglass: {
    id: 'frostglass',
    name: 'Frostglass Cathedral',
    subtitle: 'Katedral Kaca Beku',
    color: '#7fc9e8',
    mapColor: '#7fc9e8',
    music: 'frostglass',
    bossMusic: 'boss',
    particle: 'snow',
    palette: {
      top: '#060b14',
      mid: '#101d2e',
      low: '#1d3047',
      glow: '#9fdcff',
      fog: '#29405c',
    },
  },
  cinder: {
    id: 'cinder',
    name: 'Cinder Maw',
    subtitle: 'Mulut Bara',
    color: '#e0553b',
    mapColor: '#e0553b',
    music: 'cinder',
    bossMusic: 'boss',
    particle: 'embers',
    palette: {
      top: '#120503',
      mid: '#2a0b05',
      low: '#41130a',
      glow: '#ff7a3c',
      fog: '#5a1f0e',
    },
  },
};

// The ten campaign biomes reuse the zone contract so map, music and palette
// lookup keep working without special cases.
for (const biome of Object.values(BIOMES)) {
  ZONES[biome.id] = {
    id: biome.id,
    name: biome.subtitle,
    subtitle: biome.name,
    color: biome.accent,
    mapColor: biome.accent,
    music: biome.music,
    bossMusic: 'boss',
    particle: biome.particle,
    palette: { ...biome.palette },
  };
}

export const ZONE_IDS = Object.keys(ZONES);
export const ZONE_LIST = Object.values(ZONES);

// Provisional mapping of the v0.0.7 rooms onto the five-zone world. Later
// milestones replace entries as new rooms are added; the map and music read
// this table, never the renderer or audio engine.
export const ROOM_ZONES = [
  'ashen', // 0 Gerbang Abu
  'ashen', // 1 Balai Sumpah
  'ashen', // 2 Singgasana Bara (Guardian I)
  'cinder', // 3 Sarang Wyrm
  'ashen', // 4 Jembatan Tulang
  'frostglass', // 5 Katedral Sunyi
  'frostglass', // 6 Menara Lonceng
  'cinder', // 7 Puncak Sumpah
  'mycelial', // 8 Lubang Masuk
  'mycelial', // 9 Taman Spora
  'mycelial', // 10 Jembatan Gantung
  'mycelial', // 11 Sarang Induk
  'mycelial', // 12 Relung Tersembunyi
  'mycelial', // 13 Altar Spora
];

export function zoneIdForRoom(index) {
  const room = ALL_ROOMS[index];
  if (room?.zone && ZONES[room.zone]) return room.zone;
  return ROOM_ZONES[index] || 'ashen';
}

export function zoneForRoom(index) {
  return ZONES[zoneIdForRoom(index)] || ZONES.ashen;
}

export function zoneMusicForRoom(index) {
  return zoneForRoom(index).music;
}

export function roomZoneSummary() {
  return ROOMS.map((room, index) => ({
    index,
    roomId: room.id,
    roomName: room.name,
    zone: zoneIdForRoom(index),
  }));
}
