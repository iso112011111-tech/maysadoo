"use client";

import Image from "next/image";
import { cardImage, TOPICS } from "@/lib/tarot";
import { ArrowUpRight } from "./Brand";

function track(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export default function Topics() {
  return (
    <section className="section" id="topics">
      <div className="section-head reveal">
        <span className="label">01 — เลือกหัวข้อ</span>
        <h2>วันนี้อยากถามไพ่เรื่องอะไร</h2>
        <p>เลือกเรื่องที่อยู่ในใจ แล้วไพ่จะตอบตรงกับคำถามนั้น</p>
      </div>
      <div className="bento">
        {TOPICS.map((t, i) => (
          <a
            key={t.id}
            className={`tile tile-${i + 1} reveal`}
            href="#"
            // the reading flow is built later
            onClick={(e) => e.preventDefault()}
            onPointerMove={track}
            style={{ "--tint": t.tint, "--d": `${(i % 3) * 0.06}s` } as React.CSSProperties}
          >
            <div className="tile-top">
              <span className="tile-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="tile-go">
                <ArrowUpRight />
              </span>
            </div>
            <div className="tile-cards" aria-hidden="true">
              {t.cards.map((id) => (
                <div key={id} className="tc">
                  <Image src={cardImage(id)} alt="" fill sizes="140px" />
                </div>
              ))}
            </div>
            <div className="tile-text">
              <h3>{t.label}</h3>
              <p>{t.hint}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
