import "server-only";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, db } from "./db";

/**
 * แม่หมอ's voice: Gemini text-to-speech, encoded to MP3 and cached on disk (a line is never generated twice).
 * Keys come from GEMINI_API_KEYS (comma or newline separated) and are tried in order: a key that hits its quota
 * rests (until Google's daily reset, or the retry delay Google gives) and the next key takes over at once.
 */

export const TTS_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, "tts");

const keys = () =>
  (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
    .split(/[\s,]+/)
    .map((k) => k.trim())
    .filter(Boolean);

export const ttsEnabled = () => keys().length > 0;

const VOICE = process.env.GEMINI_TTS_VOICE || "Gacrux";
// newest first; a model that 404s is skipped and the first one that works is remembered
const MODELS = [process.env.GEMINI_TTS_MODEL, "gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"].filter(Boolean) as string[];
/**
 * Gemini TTS has no system instruction, so the style goes in the prompt using Google's director format:
 * notes first, then a TRANSCRIPT header — the model speaks only what follows it.
 */
const STYLE = `# AUDIO PROFILE: Mae Mor, an old Thai fortune teller
## THE SCENE: a dim, candle-lit room; she reads tarot cards for a visitor.
### DIRECTOR'S NOTES
Style: low, husky, raspy and breathy; mysterious and hypnotic, warm underneath.
Pace: slow, with long pauses at every "…".
Language: Thai.
#### TRANSCRIPT
`;

/** Longest plausible clip for this text. Anything longer means the model also read the director's notes aloud. */
const maxSeconds = (text: string) => text.length / 4 + 5;

/* ---------------------------------------------------------------- bookkeeping */

// keys are never stored: only a short fingerprint
const keyId = (key: string) => createHash("sha256").update(key).digest("hex").slice(0, 12);

/** Google resets free daily quotas at midnight Pacific time. */
function nextPtMidnight(now = Date.now()) {
  const la = new Date(new Date(now).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const next = new Date(la);
  next.setHours(24, 0, 0, 0);
  return now + (next.getTime() - la.getTime());
}

let ready = false;
function tdb() {
  const conn = db();
  if (!ready) {
    fs.mkdirSync(TTS_DIR, { recursive: true });
    conn.exec(`
      CREATE TABLE IF NOT EXISTS tts_text (
        name       TEXT PRIMARY KEY,   -- <hash>.mp3
        text       TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tts_keys (
        key_id      TEXT PRIMARY KEY,
        rest_until  INTEGER NOT NULL DEFAULT 0,
        rest_reason TEXT NOT NULL DEFAULT '',
        last_error  TEXT NOT NULL DEFAULT '',
        ok          INTEGER NOT NULL DEFAULT 0,
        limited     INTEGER NOT NULL DEFAULT 0
      );
    `);
    ready = true;
  }
  return conn;
}

function restUntil(id: string) {
  const row = tdb().prepare("SELECT rest_until FROM tts_keys WHERE key_id = ?").get(id) as { rest_until: number } | undefined;
  return row?.rest_until ?? 0;
}

function mark(id: string, field: "ok" | "limited", rest?: { until: number; reason: string; error: string }) {
  tdb()
    .prepare(
      `INSERT INTO tts_keys (key_id, ${field}, rest_until, rest_reason, last_error) VALUES (?, 1, ?, ?, ?)
       ON CONFLICT (key_id) DO UPDATE SET ${field} = ${field} + 1,
         rest_until = excluded.rest_until, rest_reason = excluded.rest_reason, last_error = excluded.last_error`,
    )
    .run(id, rest?.until ?? 0, rest?.reason ?? "", rest?.error.slice(0, 300) ?? "");
}

/** Which limit Google says was hit, and how long to wait. */
function readQuotaError(body: string): { daily: boolean; retryMs: number | null } {
  try {
    const details =
      (JSON.parse(body) as { error?: { details?: { violations?: { quotaId?: string }[]; retryDelay?: string }[] } }).error?.details ?? [];
    const daily = details.flatMap((d) => d.violations ?? []).some((v) => /PerDay/i.test(v.quotaId ?? ""));
    const delay = details.find((d) => d.retryDelay)?.retryDelay;
    return { daily, retryMs: delay ? Math.ceil(parseFloat(delay) * 1000) : null };
  } catch {
    return { daily: false, retryMs: null };
  }
}

/* ---------------------------------------------------------------- audio */

/** Newer models send a WAV file; older ones raw 16-bit PCM. */
function fromWav(buf: Buffer): { pcm: Buffer; rate: number } {
  let rate = 24000;
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.subarray(off, off + 4).toString();
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") rate = buf.readUInt32LE(off + 12);
    if (id === "data") return { pcm: buf.subarray(off + 8, Math.min(buf.length, off + 8 + size)), rate };
    off += 8 + size + (size % 2);
  }
  return { pcm: buf.subarray(44), rate };
}

type Encoder = { encodeBuffer: (s: Int16Array) => Int8Array | Uint8Array; flush: () => Int8Array | Uint8Array };
type EncoderClass = new (channels: number, rate: number, kbps: number) => Encoder;

async function toMp3(pcm: Buffer, sampleRate: number): Promise<Buffer> {
  const mod = (await import("@breezystack/lamejs")) as unknown as { Mp3Encoder?: EncoderClass; default?: { Mp3Encoder?: EncoderClass } };
  const Mp3 = mod.Mp3Encoder ?? mod.default?.Mp3Encoder;
  if (!Mp3) throw new Error("MP3 encoder not found");
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const enc = new Mp3(1, sampleRate, 64);
  const out: Uint8Array[] = [];
  for (let i = 0; i < samples.length; i += 1152) {
    const chunk = enc.encodeBuffer(samples.subarray(i, i + 1152));
    if (chunk.length) out.push(new Uint8Array(chunk));
  }
  const end = enc.flush();
  if (end.length) out.push(new Uint8Array(end));
  return Buffer.concat(out);
}

let workingModel: string | null = null;

async function generateWith(key: string, text: string): Promise<Buffer> {
  // styled first; if the clip comes back too long (instructions spoken), try again, then fall back to the bare text
  for (const prompt of [STYLE + text, STYLE + text, text]) {
    const { pcm, rate } = await synth(key, prompt);
    if (pcm.length / 2 / rate <= maxSeconds(text)) return toMp3(pcm, rate);
    console.warn(`[tts] clip too long for its text (${(pcm.length / 2 / rate).toFixed(1)}s), retrying`);
  }
  throw new Error("Gemini TTS kept reading its instructions");
}

async function synth(key: string, prompt: string): Promise<{ pcm: Buffer; rate: number }> {
  let lastError = "no model";
  for (const model of workingModel ? [workingModel] : MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } },
      }),
    });
    if (res.status === 404) {
      lastError = `${model}: not found`;
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw Object.assign(new Error(`Gemini TTS ${res.status}: ${body.slice(0, 200)}`), { status: res.status, body });
    }
    const data = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[] };
    const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
    if (!part?.data) throw new Error("Gemini TTS returned no audio");
    workingModel = model;
    const raw = Buffer.from(part.data, "base64");
    return /wav/i.test(part.mimeType ?? "") || raw.subarray(0, 4).toString() === "RIFF"
      ? fromWav(raw)
      : { pcm: raw, rate: Number(/rate=(\d+)/.exec(part.mimeType ?? "")?.[1]) || 24000 };
  }
  throw new Error(`Gemini TTS: ${lastError}`);
}

/** Try the keys in order; a key out of quota rests and the next one is used straight away. */
async function generate(text: string): Promise<Buffer> {
  const now = Date.now();
  const available = keys().filter((k) => restUntil(keyId(k)) <= now);
  if (!available.length) throw new Error("Gemini TTS: every key is resting");
  let lastError = "";
  for (const key of available) {
    const id = keyId(key);
    try {
      const mp3 = await generateWith(key, text);
      mark(id, "ok");
      return mp3;
    } catch (e) {
      const err = e as Error & { status?: number; body?: string };
      lastError = err.message;
      if (err.status === 429) {
        const q = readQuotaError(err.body ?? "");
        mark(id, "limited", q.daily ? { until: nextPtMidnight() + 60_000, reason: "daily", error: err.message } : { until: Date.now() + (q.retryMs ?? 60_000), reason: "minute", error: err.message });
      } else if (err.status === 400 || err.status === 401 || err.status === 403) {
        mark(id, "limited", { until: Date.now() + 6 * 3600_000, reason: "invalid", error: err.message });
      } else throw e; // network / server trouble: not the key's fault
    }
  }
  throw new Error(lastError || "Gemini TTS failed");
}

/* ---------------------------------------------------------------- public */

const nameFor = (text: string) => `${createHash("sha256").update(`${VOICE}\n${STYLE}\n${text}`).digest("hex").slice(0, 32)}.mp3`;

export type VoiceLine = { url: string; text: string };

/**
 * Split speech into short lines: Thai separates clauses with spaces, so break at spaces and after "…"/".",
 * keeping the first line extra short so playback starts quickly.
 */
function lines(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  const max = () => (out.length === 0 ? 90 : 200);
  for (const ph of text.replace(/\s+/g, " ").trim().split(" ")) {
    if (cur && (cur + " " + ph).length > max()) {
      out.push(cur);
      cur = ph;
    } else cur = cur ? `${cur} ${ph}` : ph;
    if (cur.length >= 40 && /[…?!.]$/.test(cur)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * Register speech the server itself wrote and return one playable URL per line. Only registered text can be
 * spoken — /api/tts never voices arbitrary input. All lines start generating right away.
 */
export function voiceFor(text: string): VoiceLine[] {
  if (!ttsEnabled() || !text.trim()) return [];
  const conn = tdb();
  const insert = conn.prepare("INSERT OR IGNORE INTO tts_text (name, text, created_at) VALUES (?, ?, ?)");
  const out = lines(text).map((t) => {
    const name = nameFor(t);
    insert.run(name, t, Date.now());
    return { url: `/api/tts/${name}`, text: t };
  });
  // start generating every line now, so they are ready (or nearly) by the time the player asks
  for (const l of out) speak(l.url.split("/").pop()!).catch(() => {});
  return out;
}

const g = globalThis as { __tts?: Map<string, Promise<string>> };
const inflight = (g.__tts ??= new Map());

/** Path of the cached MP3 for a registered line (generated on first use). null = unknown name. */
export function speak(name: string): Promise<string | null> {
  if (!/^[a-f0-9]{32}\.mp3$/.test(name)) return Promise.resolve(null);
  const file = path.join(/*turbopackIgnore: true*/ TTS_DIR, name);
  if (fs.existsSync(file)) return Promise.resolve(file);
  const row = tdb().prepare("SELECT text FROM tts_text WHERE name = ?").get(name) as { text: string } | undefined;
  if (!row) return Promise.resolve(null);
  const running = inflight.get(name);
  if (running) return running;
  const job = generate(row.text)
    .then((mp3) => {
      fs.writeFileSync(file, mp3);
      return file;
    })
    .finally(() => inflight.delete(name));
  inflight.set(name, job);
  return job;
}
