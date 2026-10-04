import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Effects from "@/components/Effects";
import MoonPhase from "@/components/MoonPhase";
import Nav from "@/components/Nav";
import ZodiacWheel from "@/components/ZodiacWheel";
import Ambience from "@/components/reading/Ambience";
import ReadingView from "@/components/reading/ReadingView";
import SaveToHistory from "@/components/reading/SaveToHistory";
import { CARD_BY_ID } from "@/lib/deck";
import { getReading } from "@/lib/server/db";
import { summarySpeech } from "@/lib/server/reading";
import { voiceFor } from "@/lib/server/tts";
import { SPREAD_BY_ID, TOPIC_BY_ID } from "@/lib/spreads";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = getReading((await params).id);
  return r ? { title: r.reading.summary.headline, description: r.reading.summary.overview.slice(0, 160) } : { title: "ไม่พบคำทำนาย" };
}

/** A saved reading (shareable link), shown face-up. */
export default async function SavedReadingPage({ params }: Props) {
  const r = getReading((await params).id);
  if (!r) notFound();
  const spread = SPREAD_BY_ID.get(r.spread)!;
  const drawn = r.cards.map((c) => ({ card: CARD_BY_ID.get(c.id)!, reversed: c.reversed }));
  const date = new Date(r.createdAt).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Bangkok" });

  return (
    <>
      <Effects />
      <Nav />
      <Ambience />
      <ZodiacWheel className="wheel-bg" />
      <main className="page">
        <div className="page-head">
          <MoonPhase className="moon-chip" />
          <span className="label">
            {spread.name} · {r.topic ? TOPIC_BY_ID.get(r.topic)?.label : "ภาพรวมของวัน"}
          </span>
          <h1>คำทำนายไพ่ทาโรต์</h1>
          <p>เปิดเมื่อ {date}</p>
        </div>
        <ReadingView spread={spread} topic={r.topic} drawn={drawn} result={{ ...r, voice: voiceFor(summarySpeech(r.reading)) }} revealed />
        <SaveToHistory id={r.id} />
      </main>
    </>
  );
}
