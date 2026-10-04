import "server-only";
import { SUITS, type Drawn, type SuitId } from "@/lib/deck";
import { TOPIC_BY_ID, type Reading, type Spread, type Tone, type TopicId, type WaiteText } from "@/lib/spreads";
import { aiJSON } from "./ai";
import WAITE from "./tarot-waite.json";

type WaiteEntry = {
  waiteTitle?: string;
  kw: string[];
  up: [string, string];
  rev: [string, string];
  addUp?: [string, string];
  addRev?: [string, string];
};
type Recur = Record<"natural" | "reversed", Record<string, Record<string, [string, string]>>>;

const CARDS = WAITE.cards as unknown as Record<string, WaiteEntry>;

/** Waite's meaning for a drawn card; a few cards have no reversed meaning, then the upright one is read. */
export function waiteText(d: Drawn): WaiteText {
  const w = CARDS[d.card.id];
  const upright = [w.up[1], w.addUp?.[1]].filter(Boolean).join(" · ");
  const reversed = w.rev[1] ? [w.rev[1], w.addRev?.[1]].filter(Boolean).join(" · ") : null;
  const noReversed = d.reversed && !reversed;
  return { upright, reversed, used: d.reversed && reversed ? reversed : upright, noReversed };
}

const RANK_TH: Record<number, string> = { 14: "ราชา", 13: "ราชินี", 12: "อัศวิน", 11: "เพจ", 10: "สิบ", 9: "เก้า", 8: "แปด", 7: "เจ็ด", 6: "หก", 5: "ห้า", 4: "สี่", 3: "สาม", 2: "สอง", 1: "เอซ" };

/** Waite Part III §5: meanings when 2–4 cards of the same rank fall in one reading. */
function recurrences(drawn: Drawn[]) {
  const out: string[] = [];
  for (const pos of ["natural", "reversed"] as const) {
    const counts = new Map<number, number>();
    drawn
      .filter((d) => d.card.suit !== "major" && d.reversed === (pos === "reversed"))
      .forEach((d) => counts.set(d.card.number, (counts.get(d.card.number) ?? 0) + 1));
    for (const [rank, n] of counts) {
      if (n < 2) continue;
      const k = Math.min(n, 4);
      const [, th] = (WAITE.recur as unknown as Recur)[pos][String(rank)][String(k)];
      out.push(`${RANK_TH[rank]} ${k} ใบ${pos === "reversed" ? " (กลับหัว)" : ""} = ${th}`);
    }
  }
  return out;
}

/** Whole-spread patterns a reader looks at before reading card by card. */
function patterns(drawn: Drawn[]) {
  if (drawn.length < 3) return [];
  const n = drawn.length;
  const majors = drawn.filter((d) => d.card.suit === "major").length;
  const reversed = drawn.filter((d) => d.reversed).length;
  const courts = drawn.filter((d) => d.card.suit !== "major" && d.card.number >= 11);
  const suitCount = new Map<SuitId, number>();
  drawn.forEach((d) => d.card.suit !== "major" && suitCount.set(d.card.suit, (suitCount.get(d.card.suit) ?? 0) + 1));
  const ranked = [...suitCount].sort((a, b) => b[1] - a[1]);
  const missing = (["wands", "cups", "swords", "pentacles"] as const).filter((s) => !suitCount.has(s));

  const lines = [
    `ไพ่ใหญ่ ${majors}/${n} ใบ${majors / n >= 0.5 ? " — สัดส่วนสูง: เรื่องนี้มีพลังใหญ่หรือโชคชะตาเข้ามาเกี่ยว อยู่เหนือการควบคุมของผู้ถามบางส่วน" : majors === 0 ? " — ไม่มีไพ่ใหญ่: เป็นเรื่องในชีวิตประจำวันที่ผู้ถามควบคุมได้เอง" : ""}`,
    `ไพ่กลับหัว ${reversed}/${n} ใบ${reversed / n >= 0.6 ? " — มาก: พลังติดขัด ล่าช้า หรือถูกเก็บกดไว้ภายใน" : ""}`,
  ];
  if (ranked.length && ranked[0][1] >= Math.max(2, Math.ceil(n * 0.4)))
    lines.push(`ชุดที่เด่น: ${SUITS[ranked[0][0]].th} (ธาตุ${SUITS[ranked[0][0]].element}) ${ranked[0][1]} ใบ — เรื่องราวเน้นไปที่ ${SUITS[ranked[0][0]].domain}`);
  if (n >= 10 && missing.length) lines.push(`ไม่มีชุด: ${missing.map((s) => `${SUITS[s].th} (${SUITS[s].domain})`).join(", ")}`);
  if (courts.length) lines.push(`ไพ่บุคคล (Court cards) ${courts.length} ใบ: ${courts.map((d) => d.card.th).join(", ")} — มีบุคคลอื่นเข้ามาเกี่ยวข้องกับเรื่องนี้`);
  lines.push(...recurrences(drawn).map((r) => `ไพ่ออกซ้ำตามตาราง Waite §5: ${r}`));
  return lines;
}

const SYSTEM = `คุณคือผู้ทำนายไพ่ทาโรต์มืออาชีพ เชี่ยวชาญสำรับ Rider–Waite และตำรา "The Pictorial Key to the Tarot" ของ A. E. Waite (1910)
หน้าที่: อ่านไพ่ที่ผู้ถามเปิดได้จริง แล้วเขียนคำทำนายภาษาไทยที่แม่นยำ อิงหลักการอ่านไพ่จริง และอ่านเข้าใจง่าย

หลักการอ่านไพ่ที่ต้องใช้:
1. ความหมายของไพ่ต้องยึดตาม "ความหมายตามตำรา Waite" ที่ให้มาเป็นหลัก ห้ามแต่งความหมายที่ขัดกับตำรา แต่ให้ตีความให้เข้ากับยุคปัจจุบัน
2. ไพ่กลับหัวใช้ความหมายกลับหัวตามตำรา (ถ้าตำราไม่มีความหมายกลับหัว ให้อ่านเป็นพลังของไพ่ที่อ่อนลง ล่าช้า หรือติดขัด)
3. อ่านไพ่ตามความหมายของตำแหน่งเสมอ ไพ่ใบเดียวกันในตำแหน่งต่างกันให้ความหมายต่างกัน
4. ใช้ภาพบนไพ่ของ Pamela Colman Smith (ตัวละคร ท่าทาง สัญลักษณ์ สี) ช่วยอธิบายว่าไพ่ใบนี้คืออะไร
5. ไพ่ใหญ่ (Major Arcana) คือพลังใหญ่หรือบทเรียนสำคัญ มีน้ำหนักมากกว่าไพ่เล็ก; ชุดไพ่เล็กบอกธาตุและเรื่องราว (ไม้เท้า=ไฟ/การงานพลังงาน, ถ้วย=น้ำ/ความรักอารมณ์, ดาบ=ลม/ความคิดความขัดแย้ง, เหรียญ=ดิน/เงินและความมั่นคง); ไพ่บุคคลอาจหมายถึงคนจริงหรือท่าทีของผู้ถาม; ตัวเลขบอกช่วงของเรื่อง (เอซ=เริ่มต้น, สิบ=จบรอบ)
6. ไพ่แต่ละใบต้องอ่านโดยดูความสัมพันธ์กับไพ่ใบอื่นในชุด ไพ่ที่เสริมกันหรือขัดกันให้ชี้ให้เห็น
7. ใช้รูปแบบภาพรวมของชุดไพ่ (สัดส่วนไพ่ใหญ่ ชุดที่เด่น ไพ่กลับหัว ไพ่ออกซ้ำ) ที่ให้มาประกอบการสรุป
8. ตอบให้ตรงกับหัวข้อที่ถาม บอกให้ชัดว่าดีหรือร้าย เพราะไพ่ใบไหน ไม่ตอบกำกวมหรือกว้างเกินไป

ข้อห้าม:
- ภาษายุค 1910 ในตำรา (สีผิว สีผม เพศ ชนชั้น) ให้ตีความเป็นบุคลิกหรือสถานการณ์อย่างเป็นกลาง
- เรื่องสุขภาพ ห้ามวินิจฉัยโรค ถ้าเกี่ยวกับอาการเจ็บป่วยให้แนะนำพบแพทย์; เรื่องการเงิน ห้ามแนะนำให้ซื้อขายสินทรัพย์เฉพาะเจาะจง
- อย่าทำให้ผู้ถามหวาดกลัวเกินจริง แม้ไพ่ร้ายก็ให้ทางออกที่มีเหตุผลเสมอ
- ห้ามใช้อีโมจิ ห้ามใช้ markdown ใช้ภาษาไทยที่เป็นธรรมชาติ เรียกผู้ถามว่า "คุณ"

ตอบเป็น JSON object เดียวเท่านั้น ตามโครงสร้างนี้:
{
  "cards": [
    {
      "about": "ไพ่ใบนี้คืออะไร 2–3 ประโยค: ภาพบนไพ่สื่ออะไร และแก่นความหมายของไพ่ (บอกด้วยว่าหัวตั้งหรือกลับหัวส่งผลอย่างไร)",
      "prediction": "คำทำนาย 3–5 ประโยค: ไพ่นี้ในตำแหน่งนี้ บอกอะไรเกี่ยวกับเรื่องที่ถาม เจาะจงและนำไปใช้ได้",
      "tone": "จำนวนเต็ม 2 ดีมาก, 1 ค่อนข้างดี, 0 กลาง ๆ, -1 ควรระวัง, -2 ต้องระวังมาก"
    }
  ],
  "summary": {
    "tone": "จำนวนเต็ม -2 ถึง 2 สำหรับภาพรวมทั้งหมด",
    "headline": "คำตอบสรุปหนึ่งประโยค ตรงประเด็น",
    "overview": "สรุปคำทำนายเมื่อรวมไพ่ทุกใบ 4–7 ประโยค เล่าเป็นเรื่องเดียวกัน อ้างชื่อไพ่และตำแหน่งที่สำคัญ",
    "advice": ["สิ่งที่ควรทำ 3–4 ข้อ ปฏิบัติได้จริง"],
    "caution": ["สิ่งที่ควรระวัง 1–3 ข้อ"]
  }
}
จำนวนสมาชิกใน "cards" ต้องเท่ากับจำนวนไพ่ที่เปิด และเรียงตามลำดับเดียวกัน`;

export async function readSpread(spread: Spread, drawn: Drawn[], topic: TopicId | null): Promise<{ reading: Reading; waite: WaiteText[] }> {
  const waite = drawn.map(waiteText);
  const today = new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });
  const t = topic ? TOPIC_BY_ID.get(topic)! : null;

  const lines = drawn.map((d, i) => {
    const p = spread.positions[i];
    const w = waite[i];
    return [
      `${i + 1}. ตำแหน่ง "${p.th}" (${p.en}) — ${p.meaning}`,
      `   ไพ่: ${d.card.th} (${d.card.en}) ${d.reversed ? "กลับหัว" : "หัวตั้ง"} · ชุด${SUITS[d.card.suit].th}`,
      `   ความหมายตามตำรา Waite (${d.reversed && !w.noReversed ? "กลับหัว" : "หัวตั้ง"}): ${w.used}`,
      w.noReversed ? "   หมายเหตุ: ตำรา Waite ไม่ได้ให้ความหมายกลับหัวของไพ่ใบนี้" : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  const pat = patterns(drawn);

  const prompt = [
    `วันที่: ${today}`,
    `รูปแบบการเปิดไพ่: ${spread.name} (${drawn.length} ใบ)`,
    t ? `หัวข้อที่ผู้ถามอยากรู้วันนี้: ${t.label} (${t.hint})` : "ผู้ถามไม่ได้ระบุหัวข้อ — นี่คือไพ่ประจำวัน ให้ทำนายภาพรวมของวันนี้ทั้งวัน ครอบคลุมอารมณ์ ความสัมพันธ์ การงาน และการเงินเท่าที่ไพ่บอกได้",
    "",
    "ไพ่ที่เปิดได้:",
    ...lines,
    pat.length ? `\nรูปแบบภาพรวมของชุดไพ่:\n${pat.map((l) => `- ${l}`).join("\n")}` : "",
    "",
    spread.id === "10" ? "ให้น้ำหนักไพ่ใบที่ 10 (สิ่งที่จะมาถึง) มากที่สุดในการสรุป และดูว่าไพ่ใบที่ 1–6 นำไปสู่ผลนั้นอย่างไร" : "",
    spread.id === "4" ? "ไพ่ใบที่ 3 (คำแนะนำ) คือสิ่งที่ผู้ถามควรทำ ให้สรุปคำแนะนำโดยอิงไพ่ใบนี้เป็นหลัก" : "",
    "จงอ่านไพ่ทีละใบตามหลักการ แล้วสรุปผลคำทำนายทั้งหมดเมื่อรวมกัน",
  ]
    .filter((l) => l !== "")
    .join("\n");

  // one retry: the model occasionally returns malformed JSON or the wrong number of cards
  for (let attempt = 1; ; attempt++) {
    try {
      const ai = await aiJSON<Partial<Reading>>({ system: SYSTEM, prompt, temperature: 0.7 });
      return { reading: normalize(ai, drawn.length), waite };
    } catch (err) {
      if (attempt >= 2) throw err;
    }
  }
}

const tone = (x: unknown): Tone => Math.max(-2, Math.min(2, Math.round(Number(x) || 0))) as Tone;
const list = (x: unknown) => (Array.isArray(x) ? x.map(String).filter(Boolean) : []);

/** Never trust the model's shape: coerce types and make sure there is one entry per card. */
function normalize(ai: Partial<Reading>, n: number): Reading {
  const cards = Array.isArray(ai.cards) ? ai.cards : [];
  if (cards.length !== n) throw new Error(`AI returned ${cards.length} cards, expected ${n}`);
  const s = (ai.summary ?? {}) as Partial<Reading["summary"]>;
  return {
    cards: cards.map((c) => ({ about: String(c?.about ?? ""), prediction: String(c?.prediction ?? ""), tone: tone(c?.tone) })),
    summary: {
      tone: tone(s.tone),
      headline: String(s.headline ?? ""),
      overview: String(s.overview ?? ""),
      advice: list(s.advice),
      caution: list(s.caution),
    },
  };
}

/** What แม่หมอ says aloud for a finished spread: only the overall result, however many cards were drawn. */
export const summarySpeech = (r: Reading) => `${r.summary.headline} … ${r.summary.overview}`;
