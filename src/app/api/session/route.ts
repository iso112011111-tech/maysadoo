import { aiConfigured } from "@/lib/server/ai";
import { logAi } from "@/lib/server/db";
import { premiumAccess } from "@/lib/server/premium";
import { continueSession, createSession, view } from "@/lib/server/session";
import { clientOf, error } from "./guard";

/** Open a 1-on-1 room: shuffle a pack on the server and let แม่หมอ greet the visitor. */
export async function POST(req: Request) {
  if (!aiConfigured()) return error(503, "แม่หมอยังไม่พร้อมรับลูกดวง");
  const client = clientOf(req);
  if (!premiumAccess()) return error(402, "ห้องแม่หมอตัวต่อตัวเป็นบริการแบบชำระเงิน");

  const body = (await req.json().catch(() => ({}))) as { question?: string };
  const question = String(body.question ?? "").trim().slice(0, 300);
  if (question.length < 4) return error(400, "เล่าเรื่องที่อยากถามแม่หมอสักหน่อย");

  const s = createSession(client, question);
  const started = Date.now();
  try {
    await continueSession(s);
    logAi(client, "session", true, Date.now() - started);
  } catch (err) {
    logAi(client, "session", false, Date.now() - started, String(err));
    console.error("[api/session]", err);
    // the room exists; the visitor can retry the greeting from inside it
  }
  return Response.json(view(s, client));
}
