/** 1-on-1 room with แม่หมอ — shared between the room UI and /api/session. */
import type { VoiceLine } from "./spreads";

export const READER_NAME = "แม่หมอเรือนจันทร์";
/** a session keeps drawing until the answer is clear, but never beyond this */
export const MAX_CARDS = 13;

export type Final = {
  verdict: string;
  explanation: string;
  timing: string;
  advice: string[];
  caution: string;
};

export type ReaderTurn = {
  role: "reader";
  text: string;
  action: "next_card" | "ask" | "answer";
  ask?: string;
  suggestions?: string[];
  /** what the next card will be read for, e.g. "ใจของอีกฝ่าย" */
  focus?: string;
  confidence: number;
  final?: Final;
  voice?: VoiceLine[];
};

export type Turn = ReaderTurn | { role: "user"; text: string } | { role: "card"; id: string; reversed: boolean; n: number; focus?: string };

/** What the room is waiting for next. */
export type Awaiting = "reader" | "pick" | "ask" | "done";

export type SessionView = {
  id: string;
  question: string;
  turns: Turn[];
  remaining: number;
  awaiting: Awaiting;
  confidence: number;
  createdAt: number;
  /** the visitor who opened this room (only they can continue it) */
  mine: boolean;
};

export function awaitingOf(turns: Turn[]): Awaiting {
  const last = turns.at(-1);
  if (!last || last.role !== "reader") return "reader";
  return last.action === "next_card" ? "pick" : last.action === "ask" ? "ask" : "done";
}
