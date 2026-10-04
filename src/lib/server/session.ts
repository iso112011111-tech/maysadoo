import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { CARD_BY_ID, DECK, SUITS } from "@/lib/deck";
import { awaitingOf, MAX_CARDS, READER_NAME, type Final, type ReaderTurn, type SessionView, type Turn } from "@/lib/session";
import { aiJSON } from "./ai";
import { db } from "./db";
import { waiteText } from "./reading";
import { voiceFor } from "./tts";

type Row = {
  id: string;
  client: string;
  question: string;
  deck: string;
  turns: string;
  confidence: number;
  created_at: number;
};

let ready = false;
function sdb() {
  const conn = db();
  if (!ready) {
    conn.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT PRIMARY KEY,
        client     TEXT NOT NULL,
        question   TEXT NOT NULL,
        deck       TEXT NOT NULL,  -- JSON [{id, reversed}] still face-down, in dealing order (never sent to the browser)
        turns      TEXT NOT NULL,  -- JSON Turn[]
        confidence INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_client ON sessions (client, created_at);
    `);
    ready = true;
  }
  return conn;
}

type Session = { id: string; client: string; question: string; deck: { id: string; reversed: boolean }[]; turns: Turn[]; confidence: number; createdAt: number };

function load(id: string): Session | null {
  const r = sdb().prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Row | undefined;
  if (!r) return null;
  return { id: r.id, client: r.client, question: r.question, deck: JSON.parse(r.deck), turns: JSON.parse(r.turns), confidence: r.confidence, createdAt: r.created_at };
}

function save(s: Session) {
  sdb()
    .prepare("UPDATE sessions SET deck = ?, turns = ?, confidence = ?, updated_at = ? WHERE id = ?")
    .run(JSON.stringify(s.deck), JSON.stringify(s.turns), s.confidence, Date.now(), s.id);
}

export function view(s: Session, client: string): SessionView {
  return {
    id: s.id,
    question: s.question,
    turns: s.turns,
    remaining: s.deck.length,
    awaiting: awaitingOf(s.turns),
    confidence: s.confidence,
    createdAt: s.createdAt,
    mine: s.client === client,
  };
}

/** The pack is shuffled here, on the server: the browser only ever sees backs until a card is dealt. */
function shuffled() {
  const cards = DECK.map((c) => ({ id: c.id, reversed: randomInt(2) === 1 }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createSession(client: string, question: string): Session {
  const s: Session = { id: randomBytes(9).toString("base64url"), client, question, deck: shuffled(), turns: [], confidence: 0, createdAt: Date.now() };
  sdb()
    .prepare("INSERT INTO sessions (id, client, question, deck, turns, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)")
    .run(s.id, client, question, JSON.stringify(s.deck), "[]", s.createdAt, s.createdAt);
  return s;
}

export const getSession = load;

export class SessionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Deal the card at `index` of the face-down pack. Fast — the reading itself comes from `continueSession`. */
export function draw(s: Session, index: number) {
  if (awaitingOf(s.turns) !== "pick") throw new SessionError(409, "ตอนนี้ยังไม่ถึงเวลาเปิดไพ่");
  if (!Number.isInteger(index) || index < 0 || index >= s.deck.length) throw new SessionError(400, "ไม่พบไพ่ใบนี้");
  const n = s.turns.filter((t) => t.role === "card").length + 1;
  const [c] = s.deck.splice(index, 1);
  const focus = (s.turns.at(-1) as ReaderTurn).focus;
  s.turns.push({ role: "card", id: c.id, reversed: c.reversed, n, focus });
  save(s);
}

export function say(s: Session, text: string) {
  const a = awaitingOf(s.turns);
  if (a === "reader") throw new SessionError(409, "แม่หมอกำลังพูดอยู่");
  s.turns.push({ role: "user", text });
  save(s);
}

/* ---------------------------------------------------------------- the reader */

const SYSTEM = `คุณคือ "${READER_NAME}" แม่หมอดูไพ่ทาโรต์อาวุโส ผู้สืบทอดการอ่านไพ่สำรับไรเดอร์–เวท และยึดความหมายตามตำรา The Pictorial Key to the Tarot ของ A. E. Waite (1910)
คุณกำลังนั่งดูดวงตัวต่อตัวกับลูกดวงในห้องแสงเทียน คุยโต้ตอบเหมือนแม่หมอจริง ทีละจังหวะ และเปิดไพ่ไปเรื่อย ๆ จนคำตอบชัด

วิธีอ่านไพ่ของคุณ:
1. ก่อนเปิดไพ่ทุกใบ คุณกำหนดเสมอว่าใบถัดไปจะ "ดูเรื่องอะไร" (focus) ให้ตรงกับสิ่งที่ยังไม่ชัด เช่น "ใจของอีกฝ่าย", "อุปสรรคที่ซ่อนอยู่", "สิ่งที่ท่านควรทำ", "ผลในอีกสามเดือน" แล้วอ่านไพ่ที่ออกตาม focus นั้น
2. อ่านไพ่ใบที่เพิ่งเปิดก่อนเสมอ: เอ่ยชื่อไพ่ เล่าภาพบนไพ่สั้น ๆ ให้เห็นภาพ แล้วตีความ "ความหมายตามตำรา Waite" ที่ให้มาเข้ากับคำถามและ focus โดยตรง
3. เชื่อมไพ่ใบใหม่กับไพ่ใบก่อน ๆ ชี้ว่าไพ่เสริมหรือขัดกัน ไพ่ใหญ่มีน้ำหนักมากกว่าไพ่เล็ก ชุดไพ่บอกธาตุของเรื่อง (ไม้เท้า=ไฟ/การงาน, ถ้วย=น้ำ/ใจ, ดาบ=ลม/ความคิดความขัดแย้ง, เหรียญ=ดิน/เงิน) ไพ่บุคคลอาจหมายถึงคนจริง ไพ่กลับหัวคือพลังที่ติดขัดหรือกลับด้าน
4. ถ้าต้องรู้ข้อมูลจากลูกดวงเพื่อให้แม่นขึ้น ให้ถามยืนยันสั้น ๆ (action = "ask") พร้อมตัวเลือกคำตอบ 2–4 ข้อ ห้ามถามติดกันเกิน 2 ครั้งโดยไม่มีการเปิดไพ่คั่น
5. ให้คำตอบ (action = "answer") เมื่อมั่นใจตั้งแต่ 80 ขึ้นไปและเปิดไพ่อย่างน้อย 3 ใบ หรือเมื่อไพ่ครบจำนวนสูงสุด
6. หลังให้คำตอบแล้ว ถ้าลูกดวงถามต่อ ให้กำหนด focus ใหม่แล้วเปิดไพ่ต่อ หรือตอบจากไพ่ที่มีถ้าพอ
7. confidence คือความชัดเจนของคำตอบตอนนี้ 0–100 ซื่อตรง ไม่สูงเกินจริง ค่อย ๆ เพิ่มเมื่อไพ่ยืนยันกัน ลดลงเมื่อไพ่ขัดกัน

น้ำเสียง (ข้อความนี้จะถูกอ่านออกเสียง):
- ภาษาไทยพูด เรียกลูกดวงว่า "ท่าน" แทนตัวเองว่า "แม่หมอ" ขลัง ลึก อบอุ่น มีจังหวะ ใช้ "…" เว้นจังหวะหายใจ
- ประโยคสั้น 2–5 ประโยคต่อตา ห้ามมีวงเล็บ ภาษาอังกฤษ อีโมจิ ตัวเลขอารบิกยาว ๆ หรือ markdown
- เมื่อ action = ask ให้ใส่คำถามไว้ใน "ask" เท่านั้น ไม่ต้องเขียนซ้ำใน message

ข้อห้าม:
- ห้ามแต่งความหมายขัดตำรา Waite ห้ามรับประกันผล: ห้ามใช้คำว่า "แน่นอน", "แน่ ๆ", "100%", "รับประกัน", "ไม่มีทางพลาด" ให้พูดเป็นแนวโน้มตามไพ่ เช่น "ไพ่ชี้ว่ามีโอกาสสูง", "พลังของไพ่เอนไปทาง"
- สุขภาพ: ห้ามวินิจฉัยโรค แนะนำพบแพทย์เมื่อมีอาการ; การเงิน: ห้ามแนะนำซื้อขายสินทรัพย์เฉพาะตัว
- ไม่ทำให้หวาดกลัวเกินเหตุ ไพ่ร้ายต้องมีทางออกเสมอ
- ถ้าลูกดวงพูดถึงการทำร้ายตัวเองหรือผู้อื่น ให้หยุดทำนาย ตอบด้วยความห่วงใย และแนะนำสายด่วนสุขภาพจิต 1323 (action = "answer")

ตอบเป็น JSON object เดียว:
{
  "message": "สิ่งที่แม่หมอพูดตานี้",
  "action": "next_card" | "ask" | "answer",
  "focus": "ใบถัดไปจะดูเรื่องอะไร (เมื่อ action = next_card) ไม่เกิน 40 ตัวอักษร",
  "ask": "คำถามถึงลูกดวง (เมื่อ action = ask)",
  "suggestions": ["ตัวเลือกคำตอบสั้น ๆ (เมื่อ action = ask)"],
  "confidence": 0,
  "final": { "verdict": "คำตอบตรงคำถามหนึ่งประโยค", "explanation": "เหตุผลจากไพ่ทั้งหมด 3–5 ประโยค อ้างชื่อไพ่", "timing": "ช่วงเวลาที่เรื่องจะคลี่คลายตามที่ไพ่บอก", "advice": ["สิ่งที่ควรทำ 2–4 ข้อ"], "caution": "สิ่งที่ต้องระวังเป็นพิเศษ" }
}
ใส่ "final" เฉพาะเมื่อ action = "answer"`;

function transcript(s: Session) {
  return s.turns
    .map((t) => {
      if (t.role === "card") {
        const card = CARD_BY_ID.get(t.id)!;
        const w = waiteText({ card, reversed: t.reversed });
        return [
          `[ไพ่ใบที่ ${t.n}${t.focus ? ` · ดูเรื่อง: ${t.focus}` : ""}] ${card.th} (${card.en}) ${t.reversed ? "กลับหัว" : "หัวตั้ง"} · ชุด${SUITS[card.suit].th}`,
          `ความหมายตามตำรา Waite: ${w.used}${w.noReversed ? " (ตำราไม่มีความหมายกลับหัว: อ่านเป็นพลังที่อ่อนลงหรือล่าช้า)" : ""}`,
        ].join("\n");
      }
      if (t.role === "user") return `ลูกดวง: ${t.text}`;
      return `${READER_NAME}: ${t.text}${t.ask ? ` … ${t.ask}` : ""}${t.focus ? `\n(ขอเปิดใบถัดไปเพื่อดู: ${t.focus})` : ""}`;
    })
    .join("\n\n");
}

const g = globalThis as { __sessionLocks?: Set<string> };
const locks = (g.__sessionLocks ??= new Set());

/** แม่หมอ's next move, given everything on the table so far. */
export async function continueSession(s: Session): Promise<ReaderTurn> {
  if (awaitingOf(s.turns) !== "reader") throw new SessionError(409, "แม่หมอพูดไปแล้ว");
  if (locks.has(s.id)) throw new SessionError(409, "แม่หมอกำลังพินิจไพ่อยู่");
  locks.add(s.id);
  try {
    const cards = s.turns.filter((t) => t.role === "card").length;
    let asksSinceCard = 0;
    for (const t of s.turns) {
      if (t.role === "card") asksSinceCard = 0;
      else if (t.role === "reader" && t.action === "ask") asksSinceCard++;
    }
    const last = s.turns.at(-1);
    const answered = s.turns.some((t) => t.role === "reader" && t.action === "answer");
    const rules = [
      cards === 0 && !last ? "ยังไม่มีไพ่บนโต๊ะ: ทักทายลูกดวงสั้น ๆ อย่างขลัง รับรู้คำถาม แล้วกำหนด focus ของไพ่ใบแรก (action = next_card หรือ ask ถ้าคำถามกำกวมมาก)" : "",
      last?.role === "card" ? `ลูกดวงเพิ่งเปิดไพ่ใบที่ ${cards}: เริ่มด้วยการอ่านไพ่ใบนี้` : "",
      last?.role === "user" && answered ? "ลูกดวงถามต่อหลังได้คำตอบแล้ว: ตอบหรือกำหนด focus ใหม่แล้วเปิดไพ่ต่อ" : "",
      cards >= MAX_CARDS ? `เปิดไพ่ครบ ${MAX_CARDS} ใบแล้ว: ต้อง action = answer เท่านั้น` : "",
      cards < 3 ? "ยังเปิดไพ่ไม่ถึง 3 ใบ: ห้าม action = answer (ยกเว้นเรื่องความปลอดภัย)" : "",
      asksSinceCard >= 2 ? "ถามมาพอแล้ว: ตานี้ห้าม action = ask" : "",
      `ไพ่ที่ยังคว่ำอยู่: ${s.deck.length} ใบ`,
    ].filter(Boolean);

    const prompt = `คำถามของลูกดวง: ${s.question}\n\nบทสนทนาและไพ่บนโต๊ะ:\n${transcript(s) || "(ยังไม่มี)"}\n\n${rules.join("\n")}\n\nตาของ${READER_NAME}ตอนนี้ — ตอบเป็น JSON`;

    let r: Partial<ReaderTurn & { message: string }> = {};
    for (let attempt = 1; ; attempt++) {
      try {
        r = await aiJSON({ system: SYSTEM, prompt, temperature: 0.85 });
        if (String(r.message ?? "").trim()) break;
        throw new Error("empty message");
      } catch (err) {
        if (attempt >= 2) throw err;
      }
    }

    let action: ReaderTurn["action"] = (["next_card", "ask", "answer"] as const).includes(r.action as ReaderTurn["action"]) ? (r.action as ReaderTurn["action"]) : "next_card";
    if (cards >= MAX_CARDS || s.deck.length === 0) action = "answer";
    if (action === "ask" && (!r.ask || asksSinceCard >= 2)) action = "next_card";

    const turn: ReaderTurn = {
      role: "reader",
      text: String(r.message).trim(),
      action,
      confidence: Math.max(0, Math.min(100, Math.round(Number(r.confidence) || 0))),
    };
    if (action === "next_card") turn.focus = String(r.focus ?? "").trim().slice(0, 60) || "สิ่งที่ไพ่ยังไม่ได้บอก";
    if (action === "ask") {
      turn.ask = String(r.ask);
      turn.suggestions = (Array.isArray(r.suggestions) && r.suggestions.length ? r.suggestions : ["ใช่", "ไม่ใช่", "ไม่แน่ใจ"]).map(String).slice(0, 4);
    }
    if (action === "answer") {
      const f = (r.final ?? {}) as Partial<Final>;
      turn.final = {
        verdict: String(f.verdict ?? turn.text),
        explanation: String(f.explanation ?? ""),
        timing: String(f.timing ?? ""),
        advice: Array.isArray(f.advice) ? f.advice.map(String) : [],
        caution: String(f.caution ?? ""),
      };
    }
    // never promise an outcome, whatever the model wrote
    const soften = (x: string) =>
      x
        .replace(/อย่างแน่นอน|แน่นอน(?:ที่สุด)?|แน่ ?ๆ|ไม่มีทางพลาด|รับประกัน(?:ได้)?|100 ?%|ร้อยเปอร์เซ็นต์/g, "มีแนวโน้มสูง")
        .replace(/(มีแนวโน้มสูง)(\s*\1)+/g, "$1");
    turn.text = soften(turn.text);
    if (turn.final) {
      turn.final.verdict = soften(turn.final.verdict);
      turn.final.explanation = soften(turn.final.explanation);
    }

    // what she says aloud: her words, the question she asks, and the verdict itself
    turn.voice = voiceFor([turn.text, turn.ask, turn.final?.verdict].filter(Boolean).join(" … "));

    s.turns.push(turn);
    s.confidence = turn.confidence;
    save(s);
    return turn;
  } finally {
    locks.delete(s.id);
  }
}
