/** Spreads (layouts) and reading topics offered for free. */

export type SpreadId = "1" | "3" | "4" | "10";
export type TopicId = "general" | "love" | "work" | "money" | "health" | "study";

export type Position = { th: string; en: string; meaning: string };

export type Spread = {
  id: SpreadId;
  name: string;
  tagline: string;
  /** a one-card daily pull reads the whole day — no topic is asked */
  asksTopic: boolean;
  positions: Position[];
};

export const SPREADS: Spread[] = [
  {
    id: "1",
    name: "ไพ่ประจำวัน",
    tagline: "หนึ่งใบ บอกภาพรวมพลังงานของวันนี้",
    asksTopic: false,
    positions: [{ th: "พลังงานของวันนี้", en: "Card of the day", meaning: "บรรยากาศ พลังงาน และบทเรียนหลักที่จะเกิดขึ้นตลอดทั้งวันนี้ ในทุกด้านของชีวิต" }],
  },
  {
    id: "3",
    name: "อดีต · ปัจจุบัน · อนาคต",
    tagline: "สามใบ เห็นเส้นทางของเรื่องที่ถาม",
    asksTopic: true,
    positions: [
      { th: "อดีต", en: "Past", meaning: "เหตุและอิทธิพลที่ผ่านมาซึ่งนำมาสู่สถานการณ์ในเรื่องนี้" },
      { th: "ปัจจุบัน", en: "Present", meaning: "สภาพของเรื่องนี้ในตอนนี้ และพลังที่กำลังทำงานอยู่" },
      { th: "อนาคต", en: "Future", meaning: "แนวโน้มที่จะเกิดขึ้นต่อไป หากทุกอย่างดำเนินไปตามทางเดิม" },
    ],
  },
  {
    id: "4",
    name: "สี่ทิศแห่งคำตอบ",
    tagline: "สี่ใบ สถานการณ์ อุปสรรค คำแนะนำ ผลลัพธ์",
    asksTopic: true,
    positions: [
      { th: "สถานการณ์", en: "Situation", meaning: "สภาพที่เป็นอยู่ของเรื่องนี้ในตอนนี้" },
      { th: "อุปสรรค", en: "Challenge", meaning: "สิ่งที่ขวางกั้นหรือทำให้เรื่องนี้ยังไม่ราบรื่น" },
      { th: "คำแนะนำ", en: "Advice", meaning: "ท่าทีหรือการกระทำที่ควรเลือก เพื่อผ่านอุปสรรคนั้นไป" },
      { th: "ผลลัพธ์", en: "Outcome", meaning: "ผลที่น่าจะเกิดขึ้นเมื่อทำตามคำแนะนำ" },
    ],
  },
  {
    id: "10",
    name: "Celtic Cross",
    tagline: "สิบใบ ตามวิธีดั้งเดิมของ A. E. Waite เจาะลึกที่สุด",
    asksTopic: true,
    // Waite, The Pictorial Key to the Tarot, Part III §7
    positions: [
      { th: "สิ่งที่ปกคลุม", en: "This covers", meaning: "อิทธิพลโดยรวมที่ส่งผลต่อผู้ถามหรือเรื่องที่ถาม เป็นบรรยากาศที่กระแสอื่น ๆ ดำเนินอยู่ภายใน" },
      { th: "สิ่งที่ขวางกั้น", en: "This crosses", meaning: "ธรรมชาติของอุปสรรค หากเป็นไพ่ดี แรงต่อต้านจะไม่ร้ายแรง หรือเป็นสิ่งดีที่ยังไม่ก่อผลดีในเรื่องนี้" },
      { th: "สิ่งที่สวมมงกุฎ", en: "This crowns", meaning: "เป้าหมายหรืออุดมคติของผู้ถาม และสิ่งที่ดีที่สุดที่จะบรรลุได้ แต่ยังไม่เกิดขึ้นจริง" },
      { th: "สิ่งที่อยู่เบื้องล่าง", en: "This is beneath", meaning: "รากฐานของเรื่อง สิ่งที่เกิดขึ้นจริงแล้วและผู้ถามรับไว้เป็นของตน" },
      { th: "สิ่งที่อยู่เบื้องหลัง", en: "This is behind", meaning: "อิทธิพลที่เพิ่งผ่านไป หรือกำลังผ่านพ้นไป" },
      { th: "สิ่งที่อยู่เบื้องหน้า", en: "This is before", meaning: "อิทธิพลที่กำลังเข้ามา และจะส่งผลในอนาคตอันใกล้" },
      { th: "ตัวผู้ถาม", en: "Himself", meaning: "ตำแหน่งหรือท่าทีของผู้ถามในสถานการณ์นี้" },
      { th: "สภาพแวดล้อม", en: "His house", meaning: "สภาพแวดล้อมและคนรอบตัวที่มีผลต่อเรื่องนี้" },
      { th: "ความหวังหรือความกลัว", en: "Hopes or fears", meaning: "ความหวังหรือความกลัวของผู้ถามในเรื่องนี้" },
      { th: "สิ่งที่จะมาถึง", en: "What will come", meaning: "ผลลัพธ์สุดท้ายที่เกิดจากอิทธิพลของไพ่ทุกใบ เป็นไพ่ที่สำคัญที่สุดของการเปิด" },
    ],
  },
];

export const SPREAD_BY_ID = new Map(SPREADS.map((s) => [s.id, s]));

export const TOPICS: { id: TopicId; label: string; hint: string }[] = [
  { id: "general", label: "ภาพรวมชีวิต", hint: "ช่วงนี้ชีวิตจะพาไปทางไหน" },
  { id: "love", label: "ความรัก", hint: "คนรัก คนคุย หรือคนที่กำลังจะเข้ามา" },
  { id: "work", label: "การงาน", hint: "งาน หัวหน้า เพื่อนร่วมงาน โปรเจกต์" },
  { id: "money", label: "การเงิน", hint: "รายรับ รายจ่าย โชคลาภ หนี้สิน" },
  { id: "health", label: "สุขภาพ", hint: "ร่างกายและจิตใจ" },
  { id: "study", label: "การเรียน", hint: "สอบ เรียนต่อ ทักษะใหม่" },
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

/** -2 … 2 */
export type Tone = -2 | -1 | 0 | 1 | 2;

export const TONE_LABEL: Record<Tone, string> = {
  2: "ดีมาก",
  1: "ค่อนข้างดี",
  0: "ดีร้ายปะปน",
  "-1": "ควรระวัง",
  "-2": "ต้องระวังมาก",
};

export type CardReading = { about: string; prediction: string; tone: Tone };

export type Reading = {
  cards: CardReading[];
  summary: { tone: Tone; headline: string; overview: string; advice: string[]; caution: string[] };
};

/** Waite's own meaning, sent back with each reading so it can be shown next to the AI's interpretation */
export type WaiteText = { upright: string; reversed: string | null; used: string; noReversed: boolean };

export type ReadingResponse = { reading: Reading; waite: WaiteText[]; model: string };

/** A reading as stored in the database and returned by /api/reading */
export type VoiceLine = { url: string; text: string };

export type SavedReading = ReadingResponse & {
  /** แม่หมอ reading the summary aloud (one URL per line) */
  voice?: VoiceLine[];
  id: string;
  spread: SpreadId;
  topic: TopicId | null;
  cards: { id: string; reversed: boolean }[];
  createdAt: number;
};

export type ReadingSummary = {
  id: string;
  spread: SpreadId;
  topic: TopicId | null;
  cards: { id: string; reversed: boolean }[];
  headline: string;
  tone: Tone;
  createdAt: number;
};
