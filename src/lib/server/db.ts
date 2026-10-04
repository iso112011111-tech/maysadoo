import "server-only";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Reading, ReadingSummary, SavedReading, SpreadId, TopicId, WaiteText } from "@/lib/spreads";

/**
 * SQLite file built into Node (node:sqlite) — no separate database server.
 * Everything the app stores lives in DATA_DIR; back that folder up on the VPS.
 */
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? "data");

/** Bump when the schema below changes — an already-open connection (dev hot reload) then re-applies it. */
const SCHEMA_VERSION = 1;

const g = globalThis as { __tarotDb?: DatabaseSync; __tarotSchema?: number };

export function db() {
  if (!g.__tarotDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    g.__tarotDb = new DatabaseSync(path.join(/*turbopackIgnore: true*/ DATA_DIR, "tarot.db"));
  }
  const conn = g.__tarotDb;
  if (g.__tarotSchema !== SCHEMA_VERSION) {
    // every statement is idempotent, so this is safe on an existing database
    conn.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS readings (
        id         TEXT PRIMARY KEY,
        spread     TEXT NOT NULL,
        topic      TEXT,
        cards      TEXT NOT NULL,  -- JSON [{id, reversed}]
        reading    TEXT NOT NULL,  -- JSON Reading
        waite      TEXT NOT NULL,  -- JSON WaiteText[]
        model      TEXT NOT NULL,
        client     TEXT NOT NULL,  -- salted hash of the IP, never the IP itself
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS readings_time ON readings (created_at);
      CREATE TABLE IF NOT EXISTS ai_log (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        client     TEXT NOT NULL,
        spread     TEXT NOT NULL,
        ok         INTEGER NOT NULL,
        ms         INTEGER NOT NULL,
        error      TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ai_log_client_time ON ai_log (client, created_at);
    `);
    g.__tarotSchema = SCHEMA_VERSION;
  }
  return conn;
}

/** Salted hash so rate limits work without keeping visitors' IP addresses. */
export function clientKey(ip: string) {
  const salt = process.env.HASH_SALT || "duduang-online";
  return createHash("sha256").update(`${salt}:${ip}`).digest("base64url").slice(0, 22);
}

/* ---------------------------------------------------------------- AI log + rate limit */

export function logAi(client: string, spread: string, ok: boolean, ms: number, error?: string) {
  db()
    .prepare("INSERT INTO ai_log (client, spread, ok, ms, error, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(client, spread, ok ? 1 : 0, ms, error?.slice(0, 500) ?? null, Date.now());
}


/* ---------------------------------------------------------------- Readings */

export type StoredReading = SavedReading;

export function saveReading(r: Omit<StoredReading, "id" | "createdAt">, client: string): StoredReading {
  const id = randomBytes(9).toString("base64url");
  const createdAt = Date.now();
  db()
    .prepare("INSERT INTO readings (id, spread, topic, cards, reading, waite, model, client, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(id, r.spread, r.topic, JSON.stringify(r.cards), JSON.stringify(r.reading), JSON.stringify(r.waite), r.model, client, createdAt);
  return { ...r, id, createdAt };
}

type Row = { id: string; spread: string; topic: string | null; cards: string; reading: string; waite: string; model: string; created_at: number };

export function getReading(id: string): StoredReading | null {
  const row = db().prepare("SELECT * FROM readings WHERE id = ?").get(id) as Row | undefined;
  if (!row) return null;
  return {
    id: row.id,
    spread: row.spread as SpreadId,
    topic: row.topic as TopicId | null,
    cards: JSON.parse(row.cards),
    reading: JSON.parse(row.reading) as Reading,
    waite: JSON.parse(row.waite) as WaiteText[],
    model: row.model,
    createdAt: row.created_at,
  };
}

/** Light list for the history page: only the ids the visitor's own browser remembers. */
export function getReadingSummaries(ids: string[]): ReadingSummary[] {
  if (!ids.length) return [];
  const rows = db()
    .prepare(`SELECT id, spread, topic, cards, reading, created_at FROM readings WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY created_at DESC`)
    .all(...ids) as Pick<Row, "id" | "spread" | "topic" | "cards" | "reading" | "created_at">[];
  return rows.map((r) => {
    const reading = JSON.parse(r.reading) as Reading;
    return {
      id: r.id,
      spread: r.spread as SpreadId,
      topic: r.topic as TopicId | null,
      cards: JSON.parse(r.cards) as { id: string; reversed: boolean }[],
      headline: reading.summary.headline,
      tone: reading.summary.tone,
      createdAt: r.created_at,
    };
  });
}
