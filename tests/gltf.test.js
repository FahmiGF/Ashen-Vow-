// Tests for the GLB asset pipeline, the glTF parser, the WebGL2 renderer
// contract, and the Update X 3D content pack.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseGLB,
  isGLB,
  readGLBChunks,
  mat4Multiply,
  mat4Invert,
  mat4FromTRS,
  mat4Perspective,
  mat4LookAt,
  sampleChannel,
} from '../src/glb.js';
import {
  MODE3D_AREAS,
  MODE3D_ELITES,
  MODE3D_BOSSES,
  MODE3D_RELICS,
  MODE3D_VAULTS,
  MODE3D_DUNGEONS,
  RELIC_BASELINE,
  applyRelics,
  areaVault,
  contentSummary,
} from '../src/mode3d_content.js';
import { Ashen3DGame, MODE3D_REGIONS, gfx3DStatus, content3DSummary } from '../src/mode3d.js';
import { propNameFor, propScaleFor } from '../src/webgl3d.js';
import { HORROR3D_SITES } from '../src/mode3d_horror.js';
import { probeCapabilities } from '../src/gpu.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_DIR = join(ROOT, 'assets', '3d');
const files = readdirSync(ASSET_DIR).filter((file) => file.endsWith('.glb'));
const cache = new Map();
const load = (file) => {
  if (!cache.has(file)) cache.set(file, parseGLB(readFileSync(join(ASSET_DIR, file))));
  return cache.get(file);
};
const characters = files.filter((file) => file !== 'props.glb');

test('every exported asset is a valid binary glTF container', () => {
  assert.ok(files.length >= 8, `expected the GLB kit, got ${files.length} files`);
  for (const file of files) {
    const buffer = readFileSync(join(ASSET_DIR, file));
    assert.ok(isGLB(buffer), `${file} has the glTF magic header`);
    const { json, bin } = readGLBChunks(buffer);
    assert.equal(json.asset.version, '2.0');
    assert.ok(bin && bin.byteLength > 1024, `${file} carries a binary chunk`);
  }
});

test('character assets ship skins, clips, UVs, LODs and a collision proxy', () => {
  for (const file of characters) {
    const asset = load(file);
    const stats = asset.stats();
    assert.ok(stats.joints >= 11, `${file} has a real skeleton (${stats.joints} joints)`);
    assert.equal(stats.lods, 3, `${file} has three LOD nodes`);
    assert.equal(stats.collisionMeshes, 1, `${file} has a collision mesh`);
    assert.ok(stats.hasUVs, `${file} primitives carry TEXCOORD_0`);
    assert.ok(stats.triangles > 1500, `${file} is detailed (${stats.triangles} triangles)`);
    assert.deepEqual(asset.animationNames(), ['Idle', 'Walk', 'Attack'], `${file} authors three clips`);
    const skin = asset.getSkin(0);
    assert.equal(skin.jointCount, stats.joints);
    assert.ok(skin.inverseBindMatrices.length === skin.jointCount * 16);
  }
});

test('LOD0 is heavier than LOD2 and node names follow the authored convention', () => {
  for (const file of characters) {
    const asset = load(file);
    const lods = asset.lodNodes();
    assert.deepEqual(lods.map((node) => node.lod), [0, 1, 2]);
    const triangles = lods.map((node) => {
      const mesh = asset.getMesh(node.mesh);
      return mesh.primitives.reduce((sum, primitive) => sum + (primitive.indices?.length || 0) / 3, 0);
    });
    assert.ok(triangles[0] > triangles[2], `${file} LOD0 (${triangles[0]}) exceeds LOD2 (${triangles[2]})`);
    assert.ok(/^[A-Za-z]+_COL$/.test(asset.collisionNodes()[0].name));
  }
});

test('inverse bind matrices invert the authored bind pose', () => {
  const asset = load('sera.glb');
  const nodes = asset.getNodes();
  const skin = asset.getSkin(0);
  const byIndex = new Map(nodes.map((node) => [node.index, node]));
  const parentOf = new Map();
  for (const node of nodes) for (const child of node.children) parentOf.set(child, node.index);
  const worldPosition = (index) => {
    let sum = [0, 0, 0];
    let cursor = index;
    while (cursor !== undefined && cursor >= 0) {
      const node = byIndex.get(cursor);
      sum = [sum[0] + node.translation[0], sum[1] + node.translation[1], sum[2] + node.translation[2]];
      cursor = parentOf.get(cursor);
    }
    return sum;
  };
  const headJoint = skin.joints.findIndex((nodeIndex) => /_head$/.test(byIndex.get(nodeIndex).name));
  assert.ok(headJoint >= 0, 'the head joint is present');
  const world = worldPosition(skin.joints[headJoint]);
  const ibm = skin.inverseBindMatrices;
  const base = headJoint * 16;
  assert.ok(Math.abs(ibm[base + 12] + world[0]) < 1e-4);
  assert.ok(Math.abs(ibm[base + 13] + world[1]) < 1e-4);
  assert.ok(Math.abs(ibm[base + 14] + world[2]) < 1e-4);
  assert.ok(world[1] > 1.4, 'head sits near the top of the armature');
});

test('animation channels target real joints and sample as normalised quaternions', () => {
  const asset = load('sera.glb');
  const nodeCount = asset.getNodes().length;
  const clips = asset.getAnimations();
  assert.equal(clips.length, 3);
  for (const clip of clips) {
    assert.ok(clip.duration > 0, `${clip.name} has a duration`);
    for (const channel of clip.channels) {
      assert.ok(channel.node >= 0 && channel.node < nodeCount);
      assert.equal(channel.path, 'rotation');
      assert.ok(channel.times.length >= 3);
      assert.equal(channel.values.length, channel.times.length * 4);
    }
  }
  const walk = clips.find((clip) => clip.name === 'Walk');
  const channel = walk.channels[0];
  const mid = sampleChannel(channel, (channel.times[0] + channel.times[channel.times.length - 1]) / 2);
  assert.equal(mid.length, 4);
  assert.ok(Math.abs(Math.hypot(...mid) - 1) < 0.02, 'interpolated quaternion stays normalised');
});

test('matrix helpers compose and invert correctly', () => {
  const a = mat4FromTRS([3, 4, 5], [0, Math.sin(0.5), 0, Math.cos(0.5)], [1, 1, 1]);
  const b = mat4FromTRS([1, 0, 0], [0, 0, 0, 1], [2, 2, 2]);
  const combined = mat4Multiply(a, b);
  const identity = mat4Multiply(combined, mat4Invert(combined));
  for (let i = 0; i < 16; i += 1) {
    const expected = i % 5 === 0 ? 1 : 0;
    assert.ok(Math.abs(identity[i] - expected) < 1e-4, `identity element ${i}`);
  }
  const view = mat4LookAt([0, 0, -10], [0, 0, 0], [0, 1, 0]);
  assert.ok(Array.from(view).every((value) => Number.isFinite(value)));
  const proj = mat4Perspective(Math.PI / 3, 16 / 9, 0.1, 500);
  assert.ok(proj[11] === -1);
});

test('prop kit covers every scenery type the 3D engine can emit', () => {
  const asset = load('props.glb');
  const names = asset.getNodes().map((node) => node.name);
  for (const name of ['worldtree', 'hut', 'ruin', 'totem', 'crystal', 'rock', 'bridge', 'horror_manor', 'horror_asylum', 'horror_chapel', 'horror_mill', 'horror_lighthouse']) {
    assert.ok(names.includes(name), `props.glb contains ${name}`);
  }
  assert.equal(asset.animationNames().length, 0, 'props are static');
  assert.ok(propNameFor('worldtree') === 'worldtree');
  assert.equal(propNameFor('bonfire'), 'totem');
  assert.equal(propNameFor('manor'), 'horror_manor');
  assert.equal(propNameFor('lighthouse'), 'horror_lighthouse');
  assert.equal(propNameFor('unknown-prop'), null);
  assert.ok(propScaleFor('worldtree', { height: 260 }) > propScaleFor('worldtree', { height: 120 }));
});

test('content pack ships fifteen areas including five 3D horror sites', () => {
  const summary = contentSummary();
  assert.deepEqual(summary, { areas: 15, dungeons: 5, elites: 6, bosses: 6, relics: 20, vaults: 10, horrorSites: 5 });
  assert.deepEqual(content3DSummary(), summary);
  assert.equal(HORROR3D_SITES.length, 5);
  assert.equal(new Set(MODE3D_AREAS.map((area) => area.id)).size, 15);
  assert.equal(new Set(MODE3D_RELICS.map((relic) => relic.id)).size, 20);
  assert.equal(new Set(MODE3D_VAULTS.map((vault) => vault.id)).size, 10);
  assert.equal(new Set(MODE3D_DUNGEONS.map((dungeon) => dungeon.id)).size, 5);
});

test('every area references a real region, elite, boss and vault', () => {
  for (const area of MODE3D_AREAS) {
    assert.ok(MODE3D_REGIONS[area.region], `${area.id} uses a known region`);
    if (area.horror) {
      assert.ok(HORROR3D_SITES.some((site) => site.id === area.horrorSite), `${area.id} maps to a real horror site`);
      assert.equal(area.enemies.length, 0, `${area.id} uses the horror runtime`);
      continue;
    }
    assert.ok(area.enemies.length >= 2, `${area.id} spawns enemies`);
    if (area.elite) assert.ok(MODE3D_ELITES.some((elite) => elite.id === area.elite), `${area.id} elite exists`);
    if (area.boss) assert.ok(MODE3D_BOSSES.some((boss) => boss.id === area.boss), `${area.id} boss exists`);
    const vault = areaVault(area.id);
    assert.ok(vault, `${area.id} has a vault`);
    assert.ok(MODE3D_RELICS.some((relic) => relic.id === vault.relic), `${vault.id} grants a real relic`);
  }
  for (const vault of MODE3D_VAULTS) {
    assert.ok(MODE3D_AREAS.some((area) => area.id === vault.area), `${vault.id} is attached to an area`);
  }
  for (const dungeon of MODE3D_DUNGEONS) {
    assert.ok(MODE3D_REGIONS[dungeon.region]);
    assert.ok(dungeon.rooms >= 3 && dungeon.rewardEchoes > 0);
    assert.ok(dungeon.modifiers.length > 0);
  }
});

test('relic effects are additive, keyed and clamped', () => {
  const keys = Object.keys(RELIC_BASELINE);
  for (const relic of MODE3D_RELICS) {
    assert.ok(relic.name && relic.desc, `${relic.id} has UI text`);
    for (const key of Object.keys(relic.effect)) {
      assert.ok(keys.includes(key), `${relic.id} uses the known key ${key}`);
    }
  }
  const single = applyRelics(['relic_ember_heart']);
  assert.ok(Math.abs(single.damage - 1.15) < 1e-9);
  assert.ok(Math.abs(single.maxHp - 0.92) < 1e-9);
  const stacked = applyRelics(MODE3D_RELICS.map((relic) => relic.id));
  assert.ok(stacked.damage >= 0.25);
  assert.ok(stacked.maxHp >= 0.4);
  assert.ok(stacked.speed >= 0.4);
  assert.ok(stacked.crit <= 0.75);
  assert.ok(stacked.lifesteal <= 0.5);
  assert.ok(stacked.thorns <= 0.6);
  assert.equal(applyRelics(['missing_relic']).damage, 1);
});

test('3D game applies relics to real stats and loads authored areas', () => {
  const game = new Ashen3DGame({});
  assert.equal(game.areaId, 'thornveil_heart');
  const baseHp = game.player.maxHp;
  assert.ok(game.pickRelic('relic_ember_heart'));
  assert.ok(game.modifiers.damage > 1);
  assert.ok(game.player.maxHp < baseHp, 'reduced max HP relic lowers the live maximum');
  assert.equal(game.pickRelic('relic_ember_heart'), false, 'duplicate relics are rejected');

  assert.ok(game.setArea('obsidian_forge'));
  assert.equal(game.enemies.length, 3);
  assert.ok(game.elite && /Ember Knight/.test(game.elite.name));
  assert.ok(game.boss && game.boss.name === 'Ashen Tyrant');
  assert.equal(game.region, MODE3D_REGIONS.infernal.id);

  assert.ok(game.setArea('veilroot_approach'));
  assert.equal(game.elite, null);
  assert.equal(game.boss, null);
  assert.ok(game.enemies.length >= 2);
});

test('vaults grant their relic once and award echoes', () => {
  const game = new Ashen3DGame({});
  game.setArea('bellfall_abbey');
  const vault = game.vault;
  assert.ok(vault && !vault.collected);
  const echoesBefore = game.echoes;
  game.player.x = vault.x;
  game.player.z = vault.z;
  game.updateVault();
  assert.ok(vault.collected, 'vault is marked collected');
  assert.ok(game.relics.includes(vault.relic));
  assert.ok(game.echoes > echoesBefore);
  game.updateVault();
  assert.equal(game.relics.filter((id) => id === vault.relic).length, 1, 'no duplicate pickup');
});

test('3D combat scales with relic damage and emits spatial sound events', () => {
  const game = new Ashen3DGame({});
  game.setArea('veilroot_approach');
  const enemy = game.enemies[0];
  game.player.x = enemy.x;
  game.player.z = enemy.z - 40;
  game.player.yaw = Math.atan2(enemy.x - game.player.x, enemy.z - game.player.z);
  const before = enemy.hp;
  game.execute3DAttack('light', 20);
  assert.ok(enemy.hp < before, 'attack lands on the target');
  const drained = game.drainSounds();
  assert.ok(drained.length > 0, 'combat emits positioned audio events');
  assert.equal(game.drainSounds().length, 0, 'draining clears the queue');
});

test('renderer status reports honest capability state without a GPU', () => {
  const status = gfx3DStatus();
  assert.ok(['idle', 'loading', 'ready', 'unsupported', 'failed'].includes(status.state));
  assert.equal(status.available, false, 'no renderer in Node');
  const caps = probeCapabilities();
  assert.equal(caps.webgl2, false);
  assert.equal(caps.rayTracing, false, 'ray tracing is never claimed');
  assert.equal(caps.vramTelemetry, false);
});
