import { Fragment } from "react";
import { ArrowRight, Brand, Spark } from "@/components/Brand";
import CardRing from "@/components/CardRing";
import DailyCard from "@/components/DailyCard";
import DeckMarquee from "@/components/DeckMarquee";
import Effects from "@/components/Effects";
import Nav from "@/components/Nav";
import SplitWords from "@/components/SplitWords";
import Steps from "@/components/Steps";
import Topics from "@/components/Topics";
import { MAJORS } from "@/lib/tarot";

export default function Home() {
  const names = MAJORS.map((c) => c.en);

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
              <a className="btn btn-primary btn-lg" href="#topics" data-magnetic>
                เริ่มดูดวง
                <ArrowRight />
              </a>
              <a className="btn btn-ghost btn-lg" href="#daily" data-magnetic>
                ไพ่ประจำวัน
              </a>
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
          </ul>
          <div className="scroll-cue" aria-hidden="true">
            ลากวงไพ่เพื่อหมุน · เลื่อนลงเพื่อดูต่อ
            <i />
          </div>
        </section>

        {/* ============ TICKER ============ */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[...names, ...names].map((n, i) => (
              <Fragment key={i}>
                <span>{n}</span>
                <Spark />
              </Fragment>
            ))}
          </div>
        </div>

        <Topics />
        <DailyCard />
        <Steps />
        <DeckMarquee />

        {/* ============ FINAL CTA ============ */}
        <section className="section">
          <div className="final reveal">
            <span className="label">พร้อมแล้วหรือยัง</span>
            <h2>
              คำตอบอยู่ใน<span className="holo-text">ไพ่ใบถัดไป</span>
            </h2>
            <p>ใช้เวลาไม่ถึง 3 นาที ไม่ต้องสมัครสมาชิก</p>
            <a className="btn btn-primary btn-lg" href="#topics" data-magnetic>
              เริ่มดูดวงเลย
              <ArrowRight />
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <Brand />
        <div className="footer-text">
          <p>ภาพไพ่: Pamela Colman Smith (1909) สาธารณสมบัติ · ความหมายไพ่: A. E. Waite, The Pictorial Key to the Tarot (1910)</p>
          <p>คำทำนายเพื่อความบันเทิงและเป็นแนวทางในการไตร่ตรอง โปรดใช้วิจารณญาณ</p>
        </div>
      </footer>
    </>
  );
}
