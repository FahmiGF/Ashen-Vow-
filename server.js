import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { GAME_VERSION } from './src/updates.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 4300;
// Loopback by default. Set HOST=0.0.0.0 to let other machines on the LAN join
// a co-op session; the WebSocket relay below is the only public surface.
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Small asset cache: avoids re-reading and re-compressing unchanged files on
// every reload. Keyed by path + mtime + size, so editing a file invalidates it.
const assetCache = new Map();
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);

async function loadAsset(target, ext) {
  const info = await stat(target);
  if (!info.isFile()) throw new Error('not a file');
  const key = `${target}|${info.mtimeMs}|${info.size}`;
  const cached = assetCache.get(key);
  if (cached) return cached;
  const raw = await readFile(target);
  const asset = {
    raw,
    gzip: COMPRESSIBLE.has(ext) && raw.length > 1024 ? gzipSync(raw, { level: 6 }) : null,
    etag: `W/"${info.size.toString(16)}-${Math.round(info.mtimeMs).toString(16)}"`,
    type: MIME[ext] || 'application/octet-stream',
  };
  assetCache.set(key, asset);
  if (assetCache.size > 80) assetCache.delete(assetCache.keys().next().value);
  return asset;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const target = normalize(join(ROOT, pathname));
    if (!target.startsWith(normalize(ROOT + sep))) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const ext = extname(target).toLowerCase();
    const asset = await loadAsset(target, ext);
    // Revalidation instead of a full re-download keeps the hot reload path cheap.
    if (req.headers['if-none-match'] === asset.etag) {
      res.writeHead(304, { ETag: asset.etag, 'Cache-Control': 'no-cache' });
      res.end();
      return;
    }
    const useGzip = asset.gzip && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    const headers = {
      'Content-Type': asset.type,
      'Cache-Control': 'no-cache',
      ETag: asset.etag,
      Vary: 'Accept-Encoding',
      'Content-Length': (useGzip ? asset.gzip : asset.raw).length,
    };
    if (useGzip) headers['Content-Encoding'] = 'gzip';
    res.writeHead(200, headers);
    res.end(useGzip ? asset.gzip : asset.raw);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

// ── zero-dependency WebSocket relay for co-op sessions ─────────────────────
// RFC 6455 server handshake + text-frame relay. Clients are grouped by the
// `?room=CODE` query parameter. The host is the first socket in a room and is
// migrated automatically when it disconnects. The relay never interprets game
// state, which keeps the authoritative simulation client-side (listen server).
const MAX_PLAYERS = 4;
const MAX_MESSAGE = 24 * 1024;
const MAX_MESSAGES_PER_SECOND = 90;
const rooms = new Map();
const metaBySocket = new WeakMap();
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function wsFrame(text, opcode = 0x1) {
  const payload = Buffer.from(String(text), 'utf8');
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x80 | opcode;
  return Buffer.concat([header, payload]);
}

function wsSend(socket, value) {
  if (!socket || socket.destroyed || !socket.writable) return;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  try {
    socket.write(wsFrame(text, 0x1));
  } catch {
    /* socket closed mid-write */
  }
}

function roomSockets(code) {
  return rooms.get(code)?.sockets || new Set();
}

function broadcast(code, message, except) {
  for (const socket of roomSockets(code)) {
    if (socket === except) continue;
    wsSend(socket, message);
  }
}

function roomSummary(code) {
  const room = rooms.get(code);
  return {
    type: 'server_peer',
    room: code,
    players: room ? room.sockets.size : 0,
    max: MAX_PLAYERS,
  };
}

function cleanupSocket(socket) {
  const meta = metaBySocket.get(socket);
  if (!meta) return;
  const room = rooms.get(meta.room);
  if (!room) return;
  room.sockets.delete(socket);
  const left = { ...roomSummary(meta.room), type: 'server_peer', left: true, leftPeer: meta.id };
  if (room.sockets.size === 0) {
    rooms.delete(meta.room);
    return;
  }
  if (room.host === socket) {
    const next = room.sockets.values().next().value;
    room.host = next;
    wsSend(next, { type: 'server_host', room: meta.room, players: room.sockets.size });
  }
  broadcast(meta.room, left);
}

function handlePayload(socket, meta, payload) {
  if (payload.length > MAX_MESSAGE) {
    socket.destroy();
    return;
  }
  const now = Date.now();
  if (now - meta.windowAt > 1000) {
    meta.windowAt = now;
    meta.windowCount = 0;
  }
  meta.windowCount += 1;
  if (meta.windowCount > MAX_MESSAGES_PER_SECOND) return;
  let message;
  try {
    message = JSON.parse(payload.toString('utf8'));
  } catch {
    return;
  }
  if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;
  // Clients cannot spoof server messages or change their role.
  if (message.type.startsWith('server_')) return;
  meta.lastSeen = now;
  // Tag the relayed envelope so the host can attribute inputs. Client-supplied
  // sender fields are stripped to prevent impersonation.
  delete message._from;
  delete message._role;
  const target = typeof message.to === 'string' ? message.to : null;
  delete message.to;
  if (message.type === 'ping') {
    wsSend(socket, { type: 'pong', t: message.t || now });
    return;
  }
  const envelope = { ...message, _from: meta.id, _role: meta.role };
  if (target) {
    for (const peer of roomSockets(meta.room)) {
      if (metaBySocket.get(peer)?.id === target) {
        wsSend(peer, envelope);
        return;
      }
    }
    return;
  }
  broadcast(meta.room, envelope, socket);
}

function consumeFrames(socket, meta, chunk) {
  meta.buffer = Buffer.concat([meta.buffer, chunk]);
  while (meta.buffer.length >= 2) {
    const first = meta.buffer[0];
    const second = meta.buffer[1];
    const fin = (first & 0x80) !== 0;
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let offset = 2;
    if (length === 126) {
      if (meta.buffer.length < 4) return;
      length = meta.buffer.readUInt16BE(2);
      offset = 4;
    } else if (length === 127) {
      if (meta.buffer.length < 10) return;
      length = Number(meta.buffer.readBigUInt64BE(2));
      offset = 10;
    }
    if (length > MAX_MESSAGE || !masked) {
      socket.destroy();
      return;
    }
    const maskStart = offset;
    offset += 4;
    if (meta.buffer.length < offset + length) return;
    const payload = Buffer.from(meta.buffer.subarray(offset, offset + length));
    const mask = meta.buffer.subarray(maskStart, maskStart + 4);
    for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
    meta.buffer = meta.buffer.subarray(offset + length);
    // Fragmented frames are rejected. A relay has no reason to buffer an
    // unbounded continuation stream, and accepting it would let a client hold
    // partial state indefinitely.
    if (!fin) {
      socket.destroy();
      return;
    }
    if (opcode === 0x8) {
      try {
        socket.end(wsFrame('', 0x8));
      } catch {
        socket.destroy();
      }
      cleanupSocket(socket);
      return;
    }
    if (opcode === 0x9) {
      try {
        socket.write(wsFrame(payload.toString('utf8'), 0xa));
      } catch {
        /* ignore */
      }
      continue;
    }
    if (opcode === 0x1 || opcode === 0x2) handlePayload(socket, meta, payload);
  }
}

server.on('upgrade', (req, socket) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  const key = req.headers['sec-websocket-key'];
  if (!key || req.headers.upgrade?.toLowerCase() !== 'websocket') {
    socket.destroy();
    return;
  }
  const accept = createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n'
      + 'Upgrade: websocket\r\n'
      + 'Connection: Upgrade\r\n'
      + `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  socket.setNoDelay(true);

  const code = (url.searchParams.get('room') || 'LOBBY')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8) || 'LOBBY';
  let room = rooms.get(code);
  if (!room) {
    room = { code, sockets: new Set(), host: null };
    rooms.set(code, room);
  }
  if (room.sockets.size >= MAX_PLAYERS) {
    wsSend(socket, { type: 'error', error: 'Room penuh (4/4).' });
    try {
      socket.end(wsFrame('', 0x8));
    } catch {
      socket.destroy();
    }
    return;
  }
  room.sockets.add(socket);
  const role = room.host ? 'guest' : 'host';
  if (!room.host) room.host = socket;
  const meta = {
    room: code,
    role,
    id: `p${room.sockets.size}_${Math.random().toString(36).slice(2, 8)}`,
    buffer: Buffer.alloc(0),
    windowAt: Date.now(),
    windowCount: 0,
    lastSeen: Date.now(),
  };
  metaBySocket.set(socket, meta);
  wsSend(socket, {
    type: 'server_welcome',
    role,
    id: meta.id,
    room: code,
    players: room.sockets.size,
    max: MAX_PLAYERS,
  });
  broadcast(code, roomSummary(code), socket);
  socket.on('data', (chunk) => consumeFrames(socket, meta, chunk));
  socket.on('close', () => cleanupSocket(socket));
  socket.on('error', () => cleanupSocket(socket));
});

server.listen(PORT, HOST, () => {
  const where = HOST === '127.0.0.1' ? `http://127.0.0.1:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Ashen Vow v${GAME_VERSION} running at ${where} (co-op relay: /ws)`);
});
