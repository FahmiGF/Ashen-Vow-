import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAME_VERSION } from '../src/version.js';
import { GAME_VERSION as UPDATES_VERSION } from '../src/updates.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function staticImports(file) {
  const src = read(file);
  const out = [];
  for (const match of src.matchAll(/^import\s+[\s\S]*?from\s+['"](\.[^'"]+)['"];/gm)) {
    out.push(match[1]);
  }
  return out;
}

test('Masterplan 4.0 P1: main.js does not statically import updates, mapeditor, or storymap', () => {
  const imports = staticImports('src/main.js');
  assert.ok(imports.includes('./version.js'), 'main.js reads GAME_VERSION from lightweight src/version.js');
  for (const deferred of ['./updates.js', './mapeditor.js', './mapeditor_ui.js', './storymap.js', './storymap_ui.js']) {
    assert.ok(!imports.includes(deferred), `startup graph must defer ${deferred}`);
  }
  const mainSrc = read('src/main.js');
  assert.match(mainSrc, /import\(['"]\.\/updates\.js['"]\)/);
  assert.match(mainSrc, /import\(['"]\.\/mapeditor_ui\.js['"]\)/);
  assert.match(mainSrc, /import\(['"]\.\/storymap_ui\.js['"]\)/);
  assert.match(mainSrc, /ensureStylesheet\(['"]\.\/styles-mapeditor\.css['"]\)/);
});

test('Masterplan 4.0 P1: server.js reads GAME_VERSION without loading src/updates.js', () => {
  const serverSrc = read('server.js');
  assert.match(serverSrc, /from ['"]\.\/src\/version\.js['"]/);
  assert.doesNotMatch(serverSrc, /from ['"]\.\/src\/updates\.js['"]/);
  assert.equal(UPDATES_VERSION, GAME_VERSION);
});

test('Masterplan 4.0 P1: index.html does not block render with styles-mapeditor.css', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /href=["']\.\/styles-mapeditor\.css["']/);
});

test('Masterplan 4.0 P1: lazy Update Log, Peta Sumpah, and Peta Kisah guard loading, retry, and stale switches', () => {
  const mainSrc = read('src/main.js');
  assert.match(mainSrc, /class="updates-loading"/);
  assert.match(mainSrc, /data-updates-retry="1"/);
  assert.match(mainSrc, /if \(token !== updateLogRequestToken\) return null;/);
  assert.match(mainSrc, /if \(menuView === 'updates'\) buildUpdateLog\(\);/);
  assert.match(mainSrc, /mapEditorPromise = null;/);
  assert.match(mainSrc, /storyMapPromise = null;/);
});
