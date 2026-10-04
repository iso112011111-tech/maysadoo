import type { Metadata } from "next";
import Effects from "@/components/Effects";
import MoonPhase from "@/components/MoonPhase";
import Nav from "@/components/Nav";
import ZodiacWheel from "@/components/ZodiacWheel";
import Ambience from "@/components/reading/Ambience";
import RoomEntry from "@/components/room/RoomEntry";
import { READER_NAME } from "@/lib/session";

export const metadata: Metadata = { title: "ห้องแม่หมอ · ตัวต่อตัว" };

const POINTS = [
  { t: "เปิดไพ่จนกว่าจะชัด", d: "ไม่จำกัดแค่ 3 หรือ 10 ใบ แม่หมอเปิดไปเรื่อย ๆ จนคำตอบชัด (สูงสุด 13 ใบ)" },
  { t: "แม่หมอบอกก่อนว่าใบนี้ดูอะไร", d: "ทุกใบมีจุดประสงค์ เช่น ใจของอีกฝ่าย อุปสรรคที่ซ่อนอยู่ ผลในอีกสามเดือน" },
  { t: "คุยโต้ตอบได้ด้วยเสียง", d: "แม่หมอพูดกับคุณด้วยเสียงจริง ถามกลับเมื่อไม่แน่ใจ และคุณพูดตอบผ่านไมค์ได้" },
];

export default function SessionEntryPage() {
  return (
    <>
      <Effects />
      <Nav />
      <Ambience />
      <ZodiacWheel className="wheel-bg" />
      <main className="page">
        <div className="page-head">
          <MoonPhase className="moon-chip" />
          <span className="label">พรีเมียม · ดูดวงตัวต่อตัว</span>
          <h1>
            ห้อง<span className="holo-text">{READER_NAME}</span>
          </h1>
          <p>นั่งลงต่อหน้าแม่หมอ เล่าเรื่องที่ค้างคาใจ แล้วเปิดไพ่ทีละใบไปด้วยกัน จนกว่าไพ่จะให้คำตอบที่ชัดเจน</p>
        </div>
        <div className="entry-grid">
          <RoomEntry />
          <ul className="points">
            {POINTS.map((p, i) => (
              <li key={p.t}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{p.t}</b>
                <small>{p.d}</small>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
