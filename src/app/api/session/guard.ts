import { clientKey } from "@/lib/server/db";

export const error = (status: number, message: string) => Response.json({ error: message }, { status });

/** Visitor identity (salted IP hash): who owns a room, and whose calls the AI log records. */
export const clientOf = (req: Request) =>
  clientKey(req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local");
