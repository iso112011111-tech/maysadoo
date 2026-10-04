import { CARD_BY_ID, type Drawn } from "@/lib/deck";
import { aiConfigured, aiModel } from "@/lib/server/ai";
import { clientKey, logAi, saveReading } from "@/lib/server/db";
import { readSpread, summarySpeech } from "@/lib/server/reading";
import { voiceFor } from "@/lib/server/tts";
import { SPREAD_BY_ID, TOPIC_BY_ID, type SpreadId, type TopicId } from "@/lib/spreads";

type Body = { spread?: string; topic?: string; cards?: { id: string; reversed: boolean }[] };

const error = (status: number, message: string) => Response.json({ error: message }, { status });

const ipOf = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";

/** POST a finished spread → AI reading, saved to the database. Card meanings always come from our own data. */
export async function POST(req: Request) {
  if (!aiConfigured()) return error(503, "ระบบทำนายยังไม่พร้อมใช้งาน");

  const body = (await req.json().catch(() => ({}))) as Body;
  const spread = SPREAD_BY_ID.get(String(body.spread) as SpreadId);
  if (!spread) return error(400, "ไม่รู้จักรูปแบบการเปิดไพ่นี้");

  const topic = spread.asksTopic && TOPIC_BY_ID.has(body.topic as TopicId) ? (body.topic as TopicId) : null;
  if (spread.asksTopic && !topic) return error(400, "กรุณาเลือกหัวข้อที่อยากถาม");

  const drawn: Drawn[] = (Array.isArray(body.cards) ? body.cards : [])
    .map((c) => ({ card: CARD_BY_ID.get(String(c?.id))!, reversed: c?.reversed === true }))
    .filter((d) => d.card);
  if (drawn.length !== spread.positions.length || new Set(drawn.map((d) => d.card.id)).size !== drawn.length)
    return error(400, "ข้อมูลไพ่ไม่ถูกต้อง");

  const client = clientKey(ipOf(req));
  const started = Date.now();
  try {
    const { reading, waite } = await readSpread(spread, drawn, topic);
    logAi(client, spread.id, true, Date.now() - started);
    const saved = saveReading(
      { spread: spread.id, topic, cards: drawn.map((d) => ({ id: d.card.id, reversed: d.reversed })), reading, waite, model: aiModel() },
      client,
    );
    return Response.json({ ...saved, voice: voiceFor(summarySpeech(reading)) });
  } catch (err) {
    logAi(client, spread.id, false, Date.now() - started, String(err));
    console.error("[api/reading]", err);
    return error(502, "แม่หมอยังตอบไม่ได้ในตอนนี้ ลองกดอีกครั้ง");
  }
}
