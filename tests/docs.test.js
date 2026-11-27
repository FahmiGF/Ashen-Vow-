import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GAME_VERSION } from '../src/version.js';
import { GAME_VERSION as UPDATES_VERSION } from '../src/updates.js';
import { ALL_ROOMS, ALL_BOSS_INFO, ALL_ENEMY_INFO } from '../src/core.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('package.json, version.js, updates.js and the docs agree on the current version', () => {
  const pkg = JSON.parse(read('package.json'));
  const verRe = new RegExp(`v${GAME_VERSION.replace(/\./g, '\\.')}`);
  assert.equal(UPDATES_VERSION, GAME_VERSION);
  assert.equal(pkg.version, GAME_VERSION);
  assert.match(pkg.description, verRe);
  assert.match(read('CLAUDE.md').split('\n').slice(0, 12).join('\n'), verRe);
  assert.match(read('MASTERPLAN.md').split('\n').slice(0, 8).join('\n'), verRe);
  assert.match(read('README.md').split('\n').slice(0, 4).join('\n'), verRe);
  assert.match(read('index.html'), new RegExp(`<title>Ashen Vow — v${GAME_VERSION.replace(/\./g, '\\.')}</title>`));
  assert.match(read('index.html'), new RegExp(`ASHEN VOW · v${GAME_VERSION.replace(/\./g, '\\.')}`));
  assert.ok(existsSync(new URL('../docs/archive/MASTERPLAN-3.0.md', import.meta.url)));
});

test('the room, boss and enemy totals stated in CLAUDE.md match the live engine', () => {
  const head = read('CLAUDE.md').split('\n').slice(0, 12).join('\n');
  const roomMatch = head.match(/\*\*(\d+) rooms\*\* in `ALL_ROOMS`/);
  assert.ok(roomMatch, 'CLAUDE.md header states the room total');
  assert.equal(Number(roomMatch[1]), ALL_ROOMS.length);

  const bossMatch = head.match(/\*\*(\d+) bosses\*\*/);
  assert.ok(bossMatch, 'CLAUDE.md header states the boss total');
  assert.equal(Number(bossMatch[1]), Object.keys(ALL_BOSS_INFO).length);

  const enemyMatch = head.match(/\*\*(\d+) enemy types\*\*/);
  assert.ok(enemyMatch, 'CLAUDE.md header states the enemy total');
  assert.equal(Number(enemyMatch[1]), Object.keys(ALL_ENEMY_INFO).length);
});
