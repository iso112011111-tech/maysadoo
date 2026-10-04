import Link from "next/link";
import { ArrowRight } from "@/components/Brand";
import CardRing from "@/components/CardRing";
import Effects from "@/components/Effects";
import MoonPhase from "@/components/MoonPhase";
import Nav from "@/components/Nav";
import SplitWords from "@/components/SplitWords";

export default function Home() {
  return (
    <>
      <Effects />
      <Nav />

      <main>
        {/* ============ HERO ============ */}
        <section className="hero">
          <div className="hero-copy">
            <span className="chip reveal">
              <span className="chip-dot" />
              Rider–Waite Tarot<span className="chip-long"> · ตำราต้นฉบับปี 1910</span>
            </span>
            <h1 className="hero-title">
              <SplitWords words={["ถามไพ่"]} />
              <br />
              <SplitWords words={["ฟังคำตอบ"]} start={1} className="holo-text" />
            </h1>
            <p className="hero-sub reveal">
              ดูดวงไพ่ทาโรต์ 78 ใบ ตีความตามตำราของ A. E. Waite ผู้สร้างสำรับ<span className="nowrap">ไรเดอร์–เวท</span> เลือกหัวข้อ สับไพ่ แล้วเปิดดูได้ในไม่กี่นาที
            </p>
            <div className="hero-cta reveal">
              <Link className="btn btn-primary btn-lg" href="/reading" data-magnetic>
                เริ่มดูดวงฟรี
                <ArrowRight />
              </Link>
              <Link className="btn btn-ghost btn-lg" href="/reading?spread=1" data-magnetic>
                ไพ่ประจำวัน
              </Link>
            </div>
          </div>

          <CardRing />

          <ul className="hero-meta reveal">
            <li>
              <b>78</b>ใบในสำรับ
            </li>
            <li>
              <b>22</b>ไพ่ใหญ่
            </li>
            <li>
              <b>56</b>ไพ่เล็ก
            </li>
            <li>
              <MoonPhase />
            </li>
          </ul>
          <p className="scroll-cue" aria-hidden="true">
            ลากวงไพ่เพื่อหมุน
          </p>
        </section>
      </main>
    </>
  );
}
