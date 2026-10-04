import { getReadingSummaries } from "@/lib/server/db";

/** History: summaries for the reading ids this browser remembers (?ids=a,b,c). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[\w-]{6,20}$/.test(s))
    .slice(0, 50);
  return Response.json({ readings: getReadingSummaries(ids) });
}
