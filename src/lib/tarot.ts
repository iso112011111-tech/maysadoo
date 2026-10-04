/**
 * Rider–Waite tarot data used by the homepage.
 *  - Card art: Pamela Colman Smith (1909), public domain (public/cards/*.jpg)
 *  - Keywords: A. E. Waite, "The Pictorial Key to the Tarot" (1910)
 */

export type MajorCard = { n: number; en: string; th: string; keywords: string[] };

export const cardImage = (id: string) => `/cards/${id}.jpg`;

export const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export const MAJORS: MajorCard[] = (
  [
    ["The Fool", "คนโง่", ["ความเขลา", "ความบ้าคลั่ง", "ความฟุ่มเฟือย"]],
    ["The Magician", "นักมายากล", ["ทักษะ", "การทูต", "ความมั่นใจในตนเอง"]],
    ["The High Priestess", "นักบวชหญิง", ["ความลับ", "ความลึกลับ", "อนาคตที่ยังไม่เผย"]],
    ["The Empress", "จักรพรรดินี", ["ความอุดมสมบูรณ์", "การริเริ่ม", "อายุยืนยาว"]],
    ["The Emperor", "จักรพรรดิ", ["ความมั่นคง", "อำนาจ", "การคุ้มครอง"]],
    ["The Hierophant", "พระสังฆราช", ["การแต่งงาน", "พันธมิตร", "การพึ่งพิง"]],
    ["The Lovers", "คู่รัก", ["แรงดึงดูด", "ความรัก", "ความงาม"]],
    ["The Chariot", "รถศึก", ["ความช่วยเหลือ", "ชัยชนะ", "สงคราม"]],
    ["Strength", "พลัง", ["พลัง", "ความกล้าหาญ", "ความสำเร็จ"]],
    ["The Hermit", "ฤๅษี", ["ความรอบคอบ", "ความระมัดระวัง", "การปิดบัง"]],
    ["Wheel of Fortune", "กงล้อแห่งโชคชะตา", ["โชคชะตา", "ความสำเร็จ", "โชคลาภ"]],
    ["Justice", "ความยุติธรรม", ["ความเที่ยงธรรม", "ความถูกต้อง", "ชนะคดี"]],
    ["The Hanged Man", "คนแขวน", ["ปัญญา", "การเสียสละ", "การหยั่งรู้"]],
    ["Death", "ความตาย", ["จุดจบ", "การเปลี่ยนผ่าน", "การทำลาย"]],
    ["Temperance", "ความพอประมาณ", ["ความประหยัด", "ความพอประมาณ", "การจัดการ"]],
    ["The Devil", "ปีศาจ", ["ความรุนแรง", "ความพยายามอย่างยิ่ง", "ลิขิต"]],
    ["The Tower", "หอคอย", ["หายนะไม่คาดฝัน", "ความทุกข์ยาก", "ความพินาศ"]],
    ["The Star", "ดวงดาว", ["ความหวัง", "อนาคตสดใส", "แรงบันดาลใจ"]],
    ["The Moon", "พระจันทร์", ["ศัตรูที่ซ่อนอยู่", "อันตราย", "การหลอกลวง"]],
    ["The Sun", "พระอาทิตย์", ["ความสุขทางโลก", "การแต่งงานที่โชคดี", "ความพอใจ"]],
    ["Judgement", "การพิพากษา", ["การเปลี่ยนสถานะ", "การเริ่มใหม่", "ผลลัพธ์"]],
    ["The World", "โลก", ["ความสำเร็จแน่นอน", "รางวัล", "การเดินทาง"]],
  ] as const
).map(([en, th, keywords], n) => ({ n, en, th, keywords: [...keywords] }));

export type Topic = { id: string; label: string; hint: string; cards: string[]; tint: string };

/** Order matches the bento layout: 1 wide, 2 tall, 3–4 small, 5–6 medium */
export const TOPICS: Topic[] = [
  { id: "general", label: "ภาพรวมชีวิต", hint: "ช่วงนี้ชีวิตจะพาไปทางไหน", cards: ["major-17", "major-10", "major-19"], tint: "#a5b4fc" },
  { id: "love", label: "ความรัก", hint: "เขาคิดยังไงกับเรา จะได้เจอคนใหม่ไหม", cards: ["major-6"], tint: "#f0abfc" },
  { id: "work", label: "การงาน", hint: "งานใหม่ หัวหน้า โปรเจกต์", cards: ["major-7"], tint: "#fdba74" },
  { id: "money", label: "การเงิน", hint: "เงินเข้า ลงทุน หนี้สิน", cards: ["pentacles-10"], tint: "#fde68a" },
  { id: "health", label: "สุขภาพ", hint: "ร่างกายและจิตใจช่วงนี้", cards: ["major-14"], tint: "#86efac" },
  { id: "study", label: "การเรียน", hint: "สอบ เรียนต่อ ทักษะใหม่", cards: ["major-1"], tint: "#7dd3fc" },
];

export const SUITS = [
  { label: "ไพ่ใหญ่", count: 22 },
  { label: "ไม้เท้า", count: 14 },
  { label: "ถ้วย", count: 14 },
  { label: "ดาบ", count: 14 },
  { label: "เหรียญ", count: 14 },
];

const range = (suit: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${suit}-${from + i}`);

/** Two marquee rows covering all 78 cards */
export const DECK_ROWS = [
  [...range("major", 0, 21), ...range("wands", 1, 14)],
  [...range("cups", 1, 14), ...range("swords", 1, 14), ...range("pentacles", 1, 14)],
];
