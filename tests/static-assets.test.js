import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

test('concurrent static requests share the correct version and revalidate after an edit', async () => {
  const port = 5200 + (process.pid % 400);
  const origin = `http://127.0.0.1:${port}`;
  const name = `static-cache-${randomUUID()}.js`;
  const fixture = new URL(`../assets/${name}`, import.meta.url);
  const dataDir = await mkdtemp(resolve(tmpdir(), 'ashen-static-test-'));
  const first = '// old asset\n'.repeat(180);
  const second = '// new cached asset\n'.repeat(190);
  await writeFile(fixture, first, { flag: 'wx' });
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', ASHEN_ADMIN_DATA_DIR: dataDir },
    stdio: 'ignore',
  });

  try {
    const url = `${origin}/assets/${name}`;
    const load = async (encoding, headers = {}) => {
      const response = await fetch(url, { headers: { 'Accept-Encoding': encoding, ...headers } });
      return {
        status: response.status,
        body: await response.text(),
        etag: response.headers.get('etag'),
        encoding: response.headers.get('content-encoding'),
      };
    };
    let ready = false;
    for (let attempt = 0; attempt < 80 && !ready; attempt += 1) {
      ready = await fetch(origin, { method: 'HEAD' }).then((response) => response.ok, () => false);
      if (!ready) await delay(75);
    }
    assert.ok(ready, 'the local static server starts');

    const requests = ['gzip', 'identity', 'gzip', 'identity'].map((encoding) => load(encoding));
    const results = await Promise.all(requests);
    const etag = results[0].etag;
    assert.ok(etag);
    for (const [index, result] of results.entries()) {
      assert.deepEqual(result, { status: 200, body: first, etag, encoding: index % 2 ? null : 'gzip' });
    }
    const unchanged = await load('gzip', { 'If-None-Match': etag });
    assert.equal(unchanged.status, 304);
    assert.equal(unchanged.body, '');

    await writeFile(fixture, second);
    const changed = await load('gzip', { 'If-None-Match': etag });
    assert.equal(changed.status, 200);
    assert.equal(changed.body, second);
    assert.notEqual(changed.etag, etag);
    assert.deepEqual(await load('identity'), { ...changed, encoding: null });
  } finally {
    server.kill();
    await rm(fixture, { force: true });
    await rm(dataDir, { recursive: true, force: true, maxRetries: 3 });
  }
});
