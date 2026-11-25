// Master Plan 3.0 §9.1 size budgets, enforced as a ratchet: the caps below are
// the measured v0.37.0 sizes rounded up, so a change can shrink them but a
// regression fails the suite. Lower a cap whenever a file gets smaller.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const src = join(root, 'src');
const kb = (file) => statSync(file).size / 1024;

// Modules that only a lazy mode may import. Boot must never reach them.
const LAZY_ONLY = ['speedrun.js', 'moba.js', 'wavedefense.js', 'pirates.js', 'fishing.js', 'trials.js', 'puzzle.js', 'mode3d.js', 'updates.js', 'frontier.js'];

function staticImports(file) {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(/^\s*import\s[^;]*?from\s+['"](\.[^'"]+)['"]/gms)].map((m) => m[1].replace(/^\.\//, ''));
}

function bootGraph() {
  const seen = new Set();
  const walk = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    for (const dep of staticImports(join(src, rel))) walk(join(rel, '..', dep).replace(/\\/g, '/').replace(/^\.\//, ''));
  };
  walk('main.js');
  return seen;
}

test('boot never statically imports a lazy-only module', () => {
  const graph = bootGraph();
  for (const lazy of LAZY_ONLY) assert.ok(!graph.has(lazy), `${lazy} is reachable from main.js at boot`);
});

test('every lazy mode module stays under 120 KB', () => {
  for (const name of readdirSync(join(src, 'modes'))) {
    assert.ok(kb(join(src, 'modes', name)) <= 120, `${name} is ${kb(join(src, 'modes', name)).toFixed(1)} KB`);
  }
});

test('main.js and the boot graph do not grow past the v0.37.0 ratchet', () => {
  assert.ok(kb(join(src, 'main.js')) <= 695, `main.js is ${kb(join(src, 'main.js')).toFixed(1)} KB (cap 695)`);
  const total = [...bootGraph()].reduce((sum, rel) => sum + kb(join(src, rel)), 0);
  assert.ok(total <= 2850, `boot graph is ${total.toFixed(0)} KB (cap 2850, target 900)`);
});

test('the save layer owns its keys: main.js has no direct writes to per-slot keys', () => {
  const text = readFileSync(join(src, 'main.js'), 'utf8');
  for (const key of ['PROGRESS_KEY', 'CHARACTER_KEY', 'HORROR_SAVE_KEY', 'HUNTER_SAVE_KEY', 'SECRETS_SAVE_KEY', 'VEIL_SAVE_KEY', 'ETERNAL_SAVE_KEY', 'ARCHIVE_SAVE_KEY', 'DREAD_SAVE_KEY', 'HORROR3D_SAVE_KEY', 'LAB_CHECKPOINT_KEY']) {
    assert.ok(!new RegExp(`localStorage\\.(set|get|remove)Item\\(${key}`).test(text), `${key} bypasses src/save.js`);
  }
});
