import type { Metadata } from "next";
import Effects from "@/components/Effects";
import MoonPhase from "@/components/MoonPhase";
import Nav from "@/components/Nav";
import ZodiacWheel from "@/components/ZodiacWheel";
import Ambience from "@/components/reading/Ambience";
import ReadingFlow from "@/components/reading/ReadingFlow";
import { SPREAD_BY_ID, TOPIC_BY_ID, type SpreadId, type TopicId } from "@/lib/spreads";

export const metadata: Metadata = { title: "เปิดไพ่ทาโรต์" };

export default async function ReadingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const spread = SPREAD_BY_ID.has(q.spread as SpreadId) ? (q.spread as SpreadId) : undefined;
  const topic = TOPIC_BY_ID.has(q.topic as TopicId) ? (q.topic as TopicId) : undefined;

  return (
    <>
      <Effects />
      <Nav />
      <Ambience />
      <ZodiacWheel className="wheel-bg" />
      <main className="page">
        <div className="page-head">
          <MoonPhase className="moon-chip" />
          <span className="label">ดูดวงฟรี · Rider–Waite Tarot</span>
          <h1>เปิดไพ่ทาโรต์</h1>
          <p>เลือกจำนวนไพ่ 1, 3, 4 หรือ 10 ใบ แม่หมอ AI จะอธิบายไพ่ทุกใบ ทำนายตามตำแหน่ง แล้วสรุปคำทำนายทั้งหมดให้</p>
        </div>
        <ReadingFlow key={`${spread}-${topic}`} initialSpread={spread} initialTopic={topic} />
      </main>
    </>
  );
}
