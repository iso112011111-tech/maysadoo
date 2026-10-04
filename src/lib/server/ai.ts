import "server-only";

/**
 * OpenAI-compatible chat client (server only — the key never reaches the browser).
 * Configure in .env.local: AI_BASE_URL, AI_API_KEY, AI_MODEL.
 */

export const DEFAULT_MODEL = "gemini-3-flash";
export const aiModel = () => process.env.AI_MODEL || DEFAULT_MODEL;
export const aiConfigured = () => !!(process.env.AI_BASE_URL && process.env.AI_API_KEY);

type Opts = { system: string; prompt: string; temperature?: number; timeoutMs?: number };

/** Ask for a single JSON object and parse it (tolerates ```json fences and stray text around the object). */
export async function aiJSON<T>(opts: Opts): Promise<T> {
  const base = process.env.AI_BASE_URL!.replace(/\/+$/, "");
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
    signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
    body: JSON.stringify({
      model: aiModel(),
      temperature: opts.temperature ?? 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error(`AI returned no JSON: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1)) as T;
}
