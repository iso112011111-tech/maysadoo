/**
 * The full 78-card Rider–Waite deck (client-safe: names, images, keywords — no long meanings).
 * Long meanings from Waite live in server/tarot-waite.json and are only read on the server.
 */
import { KEYWORDS } from "./keywords";
import { MAJORS, ROMAN } from "./tarot";

export type SuitId = "major" | "wands" | "cups" | "swords" | "pentacles";

export type Card = {
  id: string;
  suit: SuitId;
  /** 0–21 for majors, 1–14 for minors (11 Page, 12 Knight, 13 Queen, 14 King) */
  number: number;
  en: string;
  th: string;
  image: string;
  keywords: string[];
};

export type Drawn = { card: Card; reversed: boolean };

export const SUITS: Record<SuitId, { th: string; en: string; element: string; domain: string }> = {
  major: { th: "ไพ่ใหญ่", en: "Major Arcana", element: "—", domain: "บทเรียนสำคัญและพลังใหญ่ในชีวิต" },
  wands: { th: "ไม้เท้า", en: "Wands", element: "ไฟ", domain: "การงาน ความทะเยอทะยาน พลังงาน การลงมือทำ" },
  cups: { th: "ถ้วย", en: "Cups", element: "น้ำ", domain: "ความรัก อารมณ์ ความสัมพันธ์ จิตใจ" },
  swords: { th: "ดาบ", en: "Swords", element: "ลม", domain: "ความคิด การตัดสินใจ ความขัดแย้ง ความทุกข์ใจ" },
  pentacles: { th: "เหรียญ", en: "Pentacles", element: "ดิน", domain: "เงินทอง ทรัพย์สิน ร่างกาย ความมั่นคง" },
};

const RANK_EN = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const RANK_TH = ["เอซ", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ", "เพจ", "อัศวิน", "ราชินี", "ราชา"];

const make = (id: string, suit: SuitId, number: number, en: string, th: string): Card => ({
  id,
  suit,
  number,
  en,
  th,
  image: `/cards/${id}.jpg`,
  keywords: KEYWORDS[id] ?? [],
});

export const DECK: Card[] = [
  ...MAJORS.map((m) => make(`major-${m.n}`, "major", m.n, m.en, m.th)),
  ...(["wands", "cups", "swords", "pentacles"] as const).flatMap((suit) =>
    RANK_EN.map((r, i) => make(`${suit}-${i + 1}`, suit, i + 1, `${r} of ${SUITS[suit].en}`, `${RANK_TH[i]}${SUITS[suit].th}`)),
  ),
];

export const CARD_BY_ID = new Map(DECK.map((c) => [c.id, c]));

export const cardNumeral = (c: Card) =>
  c.suit === "major" ? ROMAN[c.number] : c.number === 1 ? "A" : c.number <= 10 ? String(c.number) : RANK_EN[c.number - 1][0];

/** Fisher–Yates with crypto randomness; each card lands upright or reversed with equal chance. */
export function shuffle(): Drawn[] {
  const rand = (n: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const cards = [...DECK];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map((card) => ({ card, reversed: rand(2) === 1 }));
}
