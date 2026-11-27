import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAME_VERSION, LATEST_UPDATE } from '../src/updates.js';
import { ALL_ROOMS } from '../src/core.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('package.json, GAME_VERSION and the docs agree on the current version', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, GAME_VERSION);
  assert.ok(pkg.description.startsWith(`Ashen Vow v${GAME_VERSION} `));
  assert.equal(LATEST_UPDATE.version, GAME_VERSION);
  assert.equal(read('README.md').split(/\r?\n/, 1)[0], `# Ashen Vow — v${GAME_VERSION}`);
  const handoffRelease = read('CLAUDE.md').match(/^## 0\. v(\d+\.\d+\.\d+)/m);
  assert.equal(handoffRelease?.[1], GAME_VERSION);
  assert.match(read('CLAUDE.md').split('\n').slice(0, 12).join('\n'), new RegExp(`v${GAME_VERSION.replace(/\./g, '\\.')}`));
  assert.match(read('MASTERPLAN.md').split('\n').slice(0, 8).join('\n'), new RegExp(`v${GAME_VERSION.replace(/\./g, '\\.')}`));
  assert.match(read('index.html'), new RegExp(`<title>Ashen Vow — v${GAME_VERSION.replace(/\./g, '\\.')}</title>`));
});

test('the room total stated in CLAUDE.md matches the live engine', () => {
  const head = read('CLAUDE.md').split('\n').slice(0, 12).join('\n');
  const match = head.match(/\*\*(\d+) rooms\*\* in `ALL_ROOMS`/);
  assert.ok(match, 'CLAUDE.md header states the room total');
  assert.equal(Number(match[1]), ALL_ROOMS.length);
});
