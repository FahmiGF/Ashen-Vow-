// The build version every browser smoke expects, read from package.json so a
// release bump does not have to touch thirty scripts. docs.test.js already
// proves package.json, GAME_VERSION, the docs and <title> agree.
import { readFileSync } from 'node:fs';

export const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
export const VERSION_RE = new RegExp(VERSION.split('.').join('[.]'));
