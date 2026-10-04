import Image from "next/image";
import { cardImage, DECK_ROWS, SUITS } from "@/lib/tarot";

export default function DeckMarquee() {
  return (
    <section className="section deck" id="deck">
      <div className="section-head center reveal">
        <span className="label">04 — สำรับไพ่</span>
        <h2>ภาพต้นฉบับครบ 78 ใบ</h2>
        <p>สำรับไรเดอร์–เวท ปี 1909 วาดโดย Pamela Colman Smith — ชี้ที่ไพ่เพื่อดูภาพสีจริง</p>
      </div>
      <div className="marquee" aria-hidden="true">
        {DECK_ROWS.map((row, r) => (
          <div key={r} className={`marquee-row${r % 2 ? " reverse" : ""}`}>
            {/* doubled for a seamless loop */}
            {[...row, ...row].map((id, i) => (
              <div key={i} className="mc">
                <Image src={cardImage(id)} alt="" width={112} height={192} sizes="112px" draggable={false} />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="suits reveal">
        {SUITS.map((s) => (
          <span key={s.label}>
            {s.label} <b>{s.count}</b>
          </span>
        ))}
      </div>
    </section>
  );
}
