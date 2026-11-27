import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_VERSION } from '../src/version.js';

const { transform } = createRequire(import.meta.url)('esbuild');
const root = fileURLToPath(new URL('../', import.meta.url));
const releaseDir = join(root, '.release');
const files = {};
const codePath = join(root, 'src');
const scripts = (await readdir(codePath, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
  .sort();
const sheets = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
  .map((entry) => entry.name)
  .sort();

const read = (name) => readFile(join(root, name), 'utf8');
const transformFile = async (name, source, options) => [name, (await transform(source, {
  charset: 'utf8',
  minify: true,
  legalComments: 'inline',
  sourcefile: name,
  ...options,
})).code];

const scriptEntries = await Promise.all(scripts.map(async (name) => transformFile(name, await read(name), {
  loader: 'js', format: 'esm', keepNames: true,
})));
const html = await read('index.html');
const localStyles = /<link\s+rel="stylesheet"\s+href="\.\/([\w-]+\.css)"\s*\/?>/g;
const initialStyles = [...html.matchAll(localStyles)].map((match) => match[1]);
if (initialStyles[0] !== 'styles.css' || initialStyles.some((name) => !sheets.includes(name))) {
  throw new Error('The release build needs the existing local stylesheet order from index.html.');
}

// All startup stylesheets live at the document root, so their relative asset
// URLs and cascade order are preserved when they share one response.
const combined = (await Promise.all(initialStyles.map(read))).join('\n');
const styleEntries = await Promise.all(sheets.map(async (name) => transformFile(
  name, name === 'styles.css' ? combined : await read(name), { loader: 'css' },
)));
let keptStylesheet = false;
files['index.html'] = html.replace(localStyles, (tag) => {
  if (keptStylesheet) return '';
  keptStylesheet = true;
  return tag;
});
for (const [name, code] of [...scriptEntries, ...styleEntries]) files[name] = code;

await mkdir(releaseDir, { recursive: true });
const temporary = join(releaseDir, `assets-${randomUUID()}.json`);
try {
  await writeFile(temporary, JSON.stringify({ version: GAME_VERSION, files }));
  await rename(temporary, join(releaseDir, 'assets.json'));
} finally {
  await rm(temporary, { force: true });
}
console.log(`Built Ashen Vow v${GAME_VERSION}: ${scripts.length} modules and ${initialStyles.length} startup stylesheets combined into one.`);
