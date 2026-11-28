// Pre-bake English ElevenLabs voiceover MP3s for every shot in src/trailer.js.
// Reads ELEVENLABS_API_KEY from process.env or ../doomscrolling-videos/.env (never prints the key).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRAILER_SHOTS } from '../src/trailer.js';
import { voiceRequestFor } from '../src/voice.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = join(ROOT, 'assets', 'voice', 'trailer');

function loadApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const candidates = [
    join(ROOT, '.env'),
    resolve(ROOT, '..', 'doomscrolling-videos', '.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const match = text.match(/^\s*ELEVENLABS_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

async function main() {
  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY not found in env, .env, or ../doomscrolling-videos/.env');
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  let generated = 0;
  let skipped = 0;

  for (const shot of TRAILER_SHOTS) {
    const outPath = join(OUT_DIR, `${shot.id}.mp3`);
    if (existsSync(outPath) && !process.argv.includes('--force')) {
      skipped += 1;
      continue;
    }
    const req = voiceRequestFor({ text: shot.narration, cast: shot.cast });
    if (!req.ok) throw new Error(`Invalid narration for ${shot.id}: ${req.reason}`);
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(req.body.voiceId)}?output_format=mp3_44100_128`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: req.body.text,
        model_id: req.body.modelId,
        voice_settings: req.body.delivery,
      }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`ElevenLabs failed for ${shot.id} (${res.status}): ${msg.slice(0, 180)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(outPath, buf);
    generated += 1;
    console.log(`Baked ${shot.id}.mp3 (${buf.length} bytes)`);
  }
  console.log(`Done. Generated ${generated}, skipped ${skipped}. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
