import { logAi } from "@/lib/server/db";
import { continueSession, draw, getSession, say, SessionError, view } from "@/lib/server/session";
import { clientOf, error } from "../guard";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const s = getSession((await params).id);
  if (!s) return error(404, "ไม่พบห้องนี้");
  return Response.json(view(s, clientOf(req)));
}

/**
 * Act in a room you opened:
 *  { action: "draw", index }  deal a face-down card (fast, no AI)
 *  { action: "say", text }    answer แม่หมอ or ask a follow-up
 *  { action: "continue" }     let แม่หมอ take her turn (AI)
 */
export async function POST(req: Request, { params }: Ctx) {
  const s = getSession((await params).id);
  if (!s) return error(404, "ไม่พบห้องนี้");
  const client = clientOf(req);
  if (s.client !== client) return error(403, "ห้องนี้เป็นของลูกดวงคนอื่น");

  const body = (await req.json().catch(() => ({}))) as { action?: string; index?: number; text?: string };
  try {
    if (body.action === "draw") draw(s, Number(body.index));
    else if (body.action === "say") {
      const text = String(body.text ?? "").trim().slice(0, 400);
      if (!text) return error(400, "พิมพ์ข้อความก่อน");
      say(s, text);
    } else if (body.action === "continue") {
      const started = Date.now();
      try {
        await continueSession(s);
        logAi(client, "session", true, Date.now() - started);
      } catch (err) {
        if (!(err instanceof SessionError)) logAi(client, "session", false, Date.now() - started, String(err));
        throw err;
      }
    } else return error(400, "ไม่รู้จักคำสั่งนี้");
    return Response.json(view(s, client));
  } catch (err) {
    if (err instanceof SessionError) return error(err.status, err.message);
    console.error("[api/session/:id]", err);
    return error(502, "แม่หมอติดธุระชั่วครู่ ลองอีกครั้ง");
  }
}
