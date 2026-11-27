import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const PORT = 4600 + (process.pid % 300);
const URL = `http://127.0.0.1:${PORT}/`;
const WS_URL = `ws://127.0.0.1:${PORT}/ws?room=RELAY`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(URL, { method: 'HEAD' });
      if (response.ok) return;
    } catch {
      /* still starting */
    }
    await sleep(75);
  }
  throw new Error('relay test server did not start');
}

function connect() {
  const ws = new WebSocket(WS_URL);
  const messages = [];
  ws.addEventListener('message', (event) => {
    try {
      messages.push(JSON.parse(event.data));
    } catch {
      /* ignore non-JSON */
    }
  });
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return { ws, messages, opened };
}

async function waitFor(client, predicate, label = 'message') {
  for (let i = 0; i < 60; i += 1) {
    const found = client.messages.find(predicate);
    if (found) return found;
    await sleep(40);
  }
  throw new Error(`timed out waiting for ${label}: ${JSON.stringify(client.messages)}`);
}

test('WebSocket relay rejects spoofing, targets replies, caps rooms, survives bad JSON, and migrates host', async () => {
  const dataDir = await mkdtemp(resolve(tmpdir(), 'ashen-coop-test-'));
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', ASHEN_ADMIN_DATA_DIR: dataDir },
    stdio: 'ignore',
  });
  const clients = [];
  try {
    await waitForServer();

    const host = connect();
    clients.push(host);
    await host.opened;
    const welcome = await waitFor(host, (message) => message.type === 'server_welcome', 'host welcome');
    assert.equal(welcome.role, 'host');
    assert.ok(welcome.id);

    const guest = connect();
    clients.push(guest);
    await guest.opened;
    const guestWelcome = await waitFor(guest, (message) => message.type === 'server_welcome', 'guest welcome');
    assert.equal(guestWelcome.role, 'guest');

    const third = connect();
    clients.push(third);
    await third.opened;
    const thirdWelcome = await waitFor(third, (message) => message.type === 'server_welcome', 'third welcome');
    assert.equal(thirdWelcome.role, 'guest');

    // Sender fields are server-owned; a client cannot impersonate another peer.
    host.ws.send(JSON.stringify({ type: 'chat', text: 'hello', _from: 'stolen-id', _role: 'host' }));
    const chat = await waitFor(guest, (message) => message.type === 'chat', 'relayed chat');
    assert.equal(chat._from, welcome.id);
    assert.equal(chat._role, 'host');
    assert.equal(chat.text, 'hello');

    // `to` replies go only to the addressed peer, never to the whole room.
    host.ws.send(JSON.stringify({ type: 'private', to: guestWelcome.id, text: 'secret' }));
    const privateMessage = await waitFor(guest, (message) => message.type === 'private', 'targeted message');
    assert.equal(privateMessage.text, 'secret');
    await sleep(120);
    assert.ok(!third.messages.some((message) => message.type === 'private'), 'third peer must not receive a targeted message');

    const fourth = connect();
    clients.push(fourth);
    await fourth.opened;
    await waitFor(fourth, (message) => message.type === 'server_welcome', 'fourth welcome');

    const fifth = connect();
    clients.push(fifth);
    await fifth.opened;
    const full = await waitFor(fifth, (message) => message.type === 'error', 'room-full error');
    assert.match(full.error, /penuh/i);

    // A malformed frame is ignored; the connection remains usable.
    guest.ws.send('this is not json');
    guest.ws.send(JSON.stringify({ type: 'ping', t: 123 }));
    const pong = await waitFor(guest, (message) => message.type === 'pong', 'pong');
    assert.equal(pong.t, 123);

    // The relay promotes a surviving peer instead of dropping the room.
    host.ws.close();
    const promoted = await waitFor(guest, (message) => message.type === 'server_host', 'host migration');
    assert.equal(promoted.room, 'RELAY');
  } finally {
    for (const client of clients) {
      try {
        client.ws.close();
      } catch {
        /* ignore */
      }
    }
    server.kill();
    await rm(dataDir, { recursive: true, force: true, maxRetries: 3 });
  }
});
