import fs from "node:fs";
import { speak } from "@/lib/server/tts";

/** One line of แม่หมอ's voice as MP3. Generated on first request, then served from the disk cache. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  try {
    const path = await speak(file);
    if (!path) return new Response("not found", { status: 404 });
    const mp3 = fs.readFileSync(path);
    return new Response(mp3, {
      headers: { "Content-Type": "audio/mpeg", "Content-Length": String(mp3.length), "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (err) {
    console.error("[api/tts]", err);
    return new Response("voice unavailable", { status: 503 });
  }
}
