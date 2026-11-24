// Ashen Vow — 3D asset inventory.
// Reads every authored .glb in assets/3d and reports what actually exists:
// meshes, LODs, collision proxies, triangles, materials, skins, joints and
// animation clips. Also lists the known gaps for Scary Mode entities that do
// not have a unique model yet, so the document never inflates coverage.
//
// Run: node tools/asset-inventory.mjs   (npm run assets:inventory)
// Output: docs/asset-inventory.md
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseGLB } from '../src/glb.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_DIR = join(ROOT, 'assets', '3d');
const OUT = join(ROOT, 'docs', 'asset-inventory.md');

const KB = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function trianglesOf(asset) {
  const json = asset.json;
  let triangles = 0;
  let vertices = 0;
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const indices = primitive.indices;
      const position = primitive.attributes?.POSITION;
      if (indices !== undefined) triangles += Math.floor(asset.readAccessor(indices).count / 3);
      if (position !== undefined) vertices += asset.readAccessor(position).count;
    }
  }
  return { triangles, vertices };
}

function describeFile(file) {
  const buffer = readFileSync(join(ASSET_DIR, file));
  const asset = parseGLB(buffer);
  const json = asset.json;
  const { triangles, vertices } = trianglesOf(asset);
  const meshNames = (json.meshes || []).map((mesh) => mesh.name || '');
  return {
    file,
    bytes: buffer.length,
    meshes: meshNames.length,
    triangles,
    vertices,
    lods: meshNames.filter((name) => /_LOD\d$/.test(name)).length,
    collision: meshNames.some((name) => /_COL$|_Collision$/i.test(name)),
    materials: (json.materials || []).map((material) => material.name || 'material'),
    skins: json.skins?.length || 0,
    joints: json.skins?.[0]?.joints?.length || 0,
    animations: (json.animations || []).map((clip) => ({
      name: clip.name || 'clip',
      channels: clip.channels?.length || 0,
      duration: clipDuration(asset, clip),
    })),
    extras: json.nodes?.[0]?.extras || null,
  };
}

function clipDuration(asset, clip) {
  let max = 0;
  for (const sampler of clip.samplers || []) {
    const accessor = asset.json.accessors?.[sampler.input];
    if (accessor?.max?.[0] !== undefined) max = Math.max(max, accessor.max[0]);
  }
  return Math.round(max * 100) / 100;
}

const files = readdirSync(ASSET_DIR).filter((file) => file.endsWith('.glb')).sort();
const assets = files.map(describeFile);
const propFile = assets.find((entry) => entry.file === 'props.glb');
const propBuffer = readFileSync(join(ASSET_DIR, 'props.glb'));
const propAsset = parseGLB(propBuffer);
const propNames = (propAsset.json.meshes || []).map((mesh) => (mesh.name || '').replace(/^prop_/, ''));

const characterAssets = assets.filter((entry) => entry.file !== 'props.glb');
const totalBytes = assets.reduce((sum, entry) => sum + entry.bytes, 0);
const totalTriangles = assets.reduce((sum, entry) => sum + entry.triangles, 0);

// Scary Mode entities from src/scary2.js. A ghost only counts as covered when
// `ghost_<id>.glb` actually exists in the kit — never by assertion.
const GHOST_IDS = [
  'hollow_wraith', 'night_stalker', 'silent_knight', 'forgotten_one',
  'weeping_mother', 'mirror_double', 'lantern_eater', 'drowned_bell',
];
const ghostFiles = new Set(assets.map((entry) => entry.file));
const GHOSTS_WITH_MODEL = GHOST_IDS.filter((id) => ghostFiles.has(`ghost_${id}.glb`));
const GHOSTS_WITHOUT_MODEL = GHOST_IDS.filter((id) => !ghostFiles.has(`ghost_${id}.glb`));

// Mode-specific architecture added in Update XXV. Each row is present in
// props.glb or it is not; the renderer maps the same names in propNameFor().
const MODE_PROPS = [
  ['cistern_arch', 'Tidewrought Cistern'],
  ['cistern_pillar', 'Tidewrought Cistern'],
  ['lantern_pyre', 'The Lanternwake'],
  ['lantern_brazier', 'The Lanternwake'],
  ['pirate_wreck', 'Pirate Tide'],
  ['pirate_dock', 'Pirate Tide'],
  ['veil_shrine', 'The Veil of the Forgotten'],
  ['dread_altar', 'The Dread Beyond'],
  ['wd_bastion', 'Wave Defense'],
];
const MODE_PROPS_PRESENT = MODE_PROPS.filter(([name]) => propNames.includes(name));

// Environment packs the design calls for that the current prop kit does not
// cover. Each row is a concrete production task, not a marketing promise.
const MISSING_PACKS = [
  ['Forgotten Village', 'well, fence, cart, road, lamp post, house interior', 'none'],
  ['Mourning Hospital', 'patient room, corridor, reception, operating room, elevator', 'none'],
  ['Black Manor', 'grand hall, staircase, library, bedroom, secret room', 'horror_manor (exterior shell only)'],
  ['Endless Blackwood', 'tree, root, ruin, cave, bridge, shrine', 'worldtree, ruin, bridge, rock'],
  ['Sunken Cathedral', 'nave, pew, altar, bell, flooded crypt', 'horror_chapel (exterior shell only)'],
  ['Carnival of Lost Souls', 'tent, ride, booth, ticket stand, prop toy', 'none'],
  ['Blackwater Depths', 'dock, boat, lighthouse interior, water prop', 'pirate_dock, pirate_wreck, horror_lighthouse (no interior)'],
  ['Eternal Graveyard', 'grave, mausoleum, statue, gate, candle', 'totem, rock'],
  ['Veil Citadel', 'citadel wall, spire, gate, banner', 'none'],
  ['Astral Graveyard', 'floating grave, shard, astral arch', 'crystal'],
  ['Haunted Underground', 'mine wall, support beam, cart, lantern', 'rock, crystal, lantern_pyre, lantern_brazier'],
  ['Forgotten Kingdom', 'throne, keep, curtain, banner, broken furniture', 'none'],
];

const md = [];
md.push('# Ashen Vow — 3D Asset Inventory');
md.push('');
md.push('Generated by `npm run assets:inventory` (`tools/asset-inventory.mjs`). Every number below is read');
md.push('from the committed `.glb` files through `src/glb.js`; nothing here is estimated by hand.');
md.push('');
md.push(`- Files: **${assets.length}** (${characterAssets.length} characters + 1 prop kit)`);
md.push(`- Total size: **${KB(totalBytes)}**`);
md.push(`- Total triangles: **${totalTriangles.toLocaleString('en-US')}**`);
md.push('');
md.push('## Files');
md.push('');
md.push('| File | Size | Meshes | LODs | Collision | Triangles | Materials | Skin joints | Clips |');
md.push('| --- | ---: | ---: | ---: | :---: | ---: | ---: | ---: | --- |');
for (const entry of assets) {
  const clips = entry.animations.map((clip) => `${clip.name} (${clip.duration}s)`).join(', ') || '—';
  md.push(`| \`${entry.file}\` | ${KB(entry.bytes)} | ${entry.meshes} | ${entry.lods} | ${entry.collision ? 'yes' : 'no'} | ${entry.triangles.toLocaleString('en-US')} | ${entry.materials.length} | ${entry.joints} | ${clips} |`);
}
md.push('');
md.push('## Character rigs');
md.push('');
md.push('| File | Role | Archetype | Joints | Animation clips | Collision proxy |');
md.push('| --- | --- | --- | ---: | --- | :---: |');
for (const entry of characterAssets) {
  const extras = entry.extras || {};
  md.push(`| \`${entry.file}\` | ${extras.role || '—'} | ${extras.archetype || '—'} | ${entry.joints} | ${entry.animations.map((clip) => clip.name).join(', ')} | ${entry.collision ? 'yes' : 'no'} |`);
}
md.push('');
md.push(`## Prop kit (\`props.glb\`) — ${propNames.length} static meshes`);
md.push('');
md.push('| Prop | Prop | Prop | Prop |');
md.push('| --- | --- | --- | --- |');
for (let i = 0; i < propNames.length; i += 4) {
  const row = [0, 1, 2, 3].map((offset) => propNames[i + offset] || '');
  md.push(`| ${row.map((name) => (name ? `\`${name}\`` : '')).join(' | ')} |`);
}
md.push('');
md.push('## Coverage gaps');
md.push('');
md.push('### Scary Mode ghost models');
md.push('');
md.push(`Authored bodies: **${GHOSTS_WITH_MODEL.length} / ${GHOST_IDS.length}**. A ghost is counted only when`);
md.push('`assets/3d/ghost_<id>.glb` exists and parses with a skin, three LODs and the Idle/Walk/Attack clips.');
md.push('');
for (const id of GHOSTS_WITH_MODEL) md.push(`- \`${id}\` — \`ghost_${id}.glb\``);
if (GHOSTS_WITHOUT_MODEL.length) {
  md.push('');
  md.push('Still borrowing a shared body:');
  md.push('');
  for (const id of GHOSTS_WITHOUT_MODEL) md.push(`- \`${id}\``);
}
md.push('');
md.push('### Mode architecture props');
md.push('');
md.push(`Present: **${MODE_PROPS_PRESENT.length} / ${MODE_PROPS.length}**`);
md.push('');
md.push('| Prop | Mode | In props.glb |');
md.push('| --- | --- | :---: |');
for (const [name, mode] of MODE_PROPS) {
  md.push(`| \`${name}\` | ${mode} | ${propNames.includes(name) ? 'yes' : 'no'} |`);
}
md.push('');
md.push('### Environment packs not yet authored');
md.push('');
md.push('| Pack | Required pieces | What exists today |');
md.push('| --- | --- | --- |');
for (const [pack, required, exists] of MISSING_PACKS) md.push(`| ${pack} | ${required} | ${exists} |`);
md.push('');
md.push('## Honest limits');
md.push('');
md.push('- The kit is authored procedurally by `tools/export-glb.mjs`; there is no Blender source file in the');
md.push('  repository, so this inventory can only describe exported geometry, not editable .blend scenes.');
md.push('- Materials are PBR metallic-roughness factors with no texture images; UVs exist but no texture atlas');
md.push('  is bound yet.');
md.push('- Low-detail variants are the `_LOD1`/`_LOD2` meshes plus the `_COL` proxy, not separate files.');
md.push('- The gap list is deliberately conservative: if a prop is an exterior shell, it is not counted as an');
md.push('  interior pack.');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${md.join('\n')}\n`);
console.log(`asset inventory: ${assets.length} files, ${totalTriangles.toLocaleString('en-US')} triangles, ${KB(totalBytes)}`);
console.log(`wrote ${OUT}`);
console.log(`prop meshes: ${propNames.length} · characters: ${characterAssets.length} · gaps listed: ${GHOSTS_WITHOUT_MODEL.length} ghosts, ${MISSING_PACKS.length} packs`);
