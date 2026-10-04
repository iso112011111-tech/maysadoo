import Image from "next/image";
import { cardImage } from "@/lib/tarot";

const STEPS = [
  { title: "ตั้งจิต", text: "เลือกหัวข้อ แล้วนึกถึงคำถามในใจให้ชัด ไพ่จะตอบตรงกับสิ่งที่คุณถาม", art: "focus" },
  { title: "สับและตัดไพ่", text: "สับสำรับแล้วตัดไพ่สามครั้ง ตามวิธีดั้งเดิมของสำรับไรเดอร์–เวท", art: "cut" },
  { title: "เปิดไพ่ ฟังคำทำนาย", text: "พลิกไพ่ทีละใบ พร้อมความหมายทั้งไพ่ตั้งและไพ่กลับหัว จากตำราของ A. E. Waite", art: "flip" },
];

function Art({ kind }: { kind: string }) {
  if (kind === "focus")
    return (
      <div className="stack-art art-focus" aria-hidden="true">
        <i className="mini-back" />
      </div>
    );
  if (kind === "cut")
    return (
      <div className="stack-art art-cut" aria-hidden="true">
        <i className="mini-back" />
        <i className="mini-back" />
        <i className="mini-back" />
      </div>
    );
  return (
    <div className="stack-art art-flip" aria-hidden="true">
      <div className="flipper">
        <i className="mini-back" />
        <i className="mini-face">
          <Image src={cardImage("major-17")} alt="" fill sizes="100px" />
        </i>
      </div>
    </div>
  );
}

/** "How it works" as a stack of sticky cards that pile up while scrolling. */
export default function Steps() {
  return (
    <section className="section" id="how">
      <div className="section-head reveal">
        <span className="label">03 — วิธีดูดวง</span>
        <h2>สามขั้นตอน ตามตำราต้นฉบับ</h2>
      </div>
      <div className="stack">
        {STEPS.map((s, i) => (
          <article key={s.title} className="stack-card" style={{ "--i": i } as React.CSSProperties}>
            <div>
              <span className="stack-n">
                {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
            <Art kind={s.art} />
          </article>
        ))}
      </div>
    </section>
  );
}
