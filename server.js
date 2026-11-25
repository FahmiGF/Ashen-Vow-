import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { GAME_VERSION } from './src/updates.js';
import { createAdminService } from './src/admin_server.js';

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
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
};

// Small asset cache: avoids re-reading and re-compressing unchanged files on
// every reload. Keyed by path + mtime + size, so editing a file invalidates it.
const assetCache = new Map();
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);
const bootAt = Date.now();
let requestCount = 0;
let requestErrors = 0;
let latencyTotal = 0;
let peakSockets = 0;
const admin = createAdminService({
  dataDir: join(ROOT, 'data'),
  metrics: () => {
    const sockets = [...rooms.values()].reduce((sum, room) => sum + room.sockets.size, 0);
    return {
      status: 'healthy',
      uptimeSeconds: Math.round((Date.now() - bootAt) / 1000),
      requests: requestCount,
      errors: requestErrors,
      errorRate: requestCount ? Math.round((requestErrors / requestCount) * 10000) / 100 : 0,
      averageLatencyMs: requestCount ? Math.round((latencyTotal / requestCount) * 10) / 10 : 0,
      memoryMb: Math.round(process.memoryUsage().rss / 1048576),
      activeCoopRooms: rooms.size,
      connectedPlayers: sockets,
      peakSockets,
      node: process.version,
      host: HOST,
      port: PORT,
    };
  },
});

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

// ── ElevenLabs voice proxy (Update XXV) ───────────────────────────────────
// The key never reaches the browser. The client posts text + a cast id, the
// server maps that to a catalogue voice, calls ElevenLabs once and caches the
// MP3 by text+voice hash so replaying a boss line costs nothing.
const VOICE_ENDPOINT = 'https://api.elevenlabs.io/v1/text-to-speech';
const VOICE_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const VOICE_MAX_CHARS = 600;
const VOICE_CACHE_LIMIT = 64;
const VOICE_CAST_IDS = {
  narrator: process.env.ELEVENLABS_VOICE_NARRATOR || '21m00Tcm4TlvDq8ikWAM',
  warden: process.env.ELEVENLABS_VOICE_WARDEN || 'pNInz6obpgDQGcFmaJgB',
  wyrm: process.env.ELEVENLABS_VOICE_WYRM || 'VR6AewLTigWG4xSOukaG',
  oathbreaker: process.env.ELEVENLABS_VOICE_OATHBREAKER || 'ErXwobaYiN019PkySvjV',
  tidebound: process.env.ELEVENLABS_VOICE_TIDEBOUND || 'yoZ06aMxZJJ28mfd3POQ',
  wickbearer: process.env.ELEVENLABS_VOICE_WICKBEARER || 'EXAVITQu4vr4xnSDxMaL',
  ghost: process.env.ELEVENLABS_VOICE_GHOST || 'TX3LPaxmHKxFdv7VOQHJ',
  trailer: process.env.ELEVENLABS_VOICE_TRAILER || 'onwK4e9ZLuTAKqWW03F9',
};
const voiceCache = new Map();

function voiceConfigured() {
  return typeof process.env.ELEVENLABS_API_KEY === 'string' && process.env.ELEVENLABS_API_KEY.trim().length > 10;
}

function readJsonBody(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const parts = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('payload-too-large'));
        req.destroy();
        return;
      }
      parts.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(parts).toString('utf8') || '{}'));
      } catch {
        reject(new Error('bad-json'));
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, status, value) {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

async function handleVoice(req, res, url) {
  if (url.pathname !== '/api/voice') return false;
  if (req.method === 'GET') {
    jsonResponse(res, 200, {
      configured: voiceConfigured(),
      provider: 'elevenlabs',
      model: VOICE_MODEL,
      maxChars: VOICE_MAX_CHARS,
      cast: Object.keys(VOICE_CAST_IDS),
      cached: voiceCache.size,
    });
    return true;
  }
  if (req.method !== 'POST') {
    jsonResponse(res, 405, { error: 'method-not-allowed' });
    return true;
  }
  if (!voiceConfigured()) {
    jsonResponse(res, 503, { error: 'not-configured', provider: 'elevenlabs' });
    return true;
  }
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    jsonResponse(res, 400, { error: String(error.message || 'bad-request') });
    return true;
  }
  const text = String(body.text || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    jsonResponse(res, 400, { error: 'empty-text' });
    return true;
  }
  if (text.length > VOICE_MAX_CHARS) {
    jsonResponse(res, 413, { error: 'text-too-long', maxChars: VOICE_MAX_CHARS });
    return true;
  }
  const cast = typeof body.cast === 'string' && VOICE_CAST_IDS[body.cast] ? body.cast : 'narrator';
  const requested = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';
  // Only accept a catalogue voice or a well-formed id; never a path segment.
  const voiceId = /^[A-Za-z0-9]{8,64}$/.test(requested) ? requested : VOICE_CAST_IDS[cast];
  const modelId = typeof body.modelId === 'string' && /^[a-z0-9_]{4,40}$/.test(body.modelId) ? body.modelId : VOICE_MODEL;
  const cacheKey = createHash('sha256').update(`${voiceId}|${modelId}|${text}`).digest('hex');
  const cached = voiceCache.get(cacheKey);
  if (cached) {
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': cached.length,
      'Cache-Control': 'private, max-age=86400',
      'X-Voice-Cache': 'hit',
    });
    res.end(cached);
    return true;
  }
  try {
    const upstream = await fetch(`${VOICE_ENDPOINT}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: body.delivery && typeof body.delivery === 'object' ? body.delivery : undefined,
      }),
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      jsonResponse(res, 502, { error: 'upstream-error', status: upstream.status, detail: detail.slice(0, 200) });
      return true;
    }
    const audio = Buffer.from(await upstream.arrayBuffer());
    if (voiceCache.size >= VOICE_CACHE_LIMIT) voiceCache.delete(voiceCache.keys().next().value);
    voiceCache.set(cacheKey, audio);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audio.length,
      'Cache-Control': 'private, max-age=86400',
      'X-Voice-Cache': 'miss',
    });
    res.end(audio);
  } catch (error) {
    jsonResponse(res, 502, { error: 'voice-unreachable', detail: String(error.message || error).slice(0, 200) });
  }
  return true;
}

const server = createServer(async (req, res) => {
  const started = performance.now();
  requestCount += 1;
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    if (pathname === '/admin' || pathname === '/admin/') pathname = '/admin.html';
    if (pathname.startsWith('/data/') || pathname.startsWith('/.') || pathname.includes('/../')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (await handleVoice(req, res, url)) return;
    if (await admin.handle(req, res, url, ip)) return;
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
    requestErrors += 1;
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  } finally {
    latencyTotal += performance.now() - started;
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
  if (admin.state && (!admin.state.settings.matchmakingOpen || admin.state.settings.maintenance)) {
    socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
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
  peakSockets = Math.max(peakSockets, [...rooms.values()].reduce((sum, entry) => sum + entry.sockets.size, 0));
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
