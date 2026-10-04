"use client";

import Image from "next/image";
import { useState } from "react";
import { cardImage, MAJORS, ROMAN, type MajorCard } from "@/lib/tarot";
import { ArrowRight } from "./Brand";

const SHUFFLE_MS = 900;

function tilt(e: React.PointerEvent<HTMLButtonElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.classList.add("tracking");
  el.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
  el.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
  el.style.setProperty("--px", `${x * 100}%`);
  el.style.setProperty("--py", `${y * 100}%`);
}

function untilt(e: React.PointerEvent<HTMLButtonElement>) {
  const el = e.currentTarget;
  el.classList.remove("tracking");
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
  el.style.setProperty("--px", "50%");
  el.style.setProperty("--py", "50%");
}

/** Daily card — UI preview only: a holographic card that follows the pointer, shakes, then flips. */
export default function DailyCard() {
  const [card, setCard] = useState<MajorCard | null>(null);
  const [open, setOpen] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  function draw() {
    setCard(MAJORS[Math.floor(Math.random() * MAJORS.length)]);
    setShuffling(true);
    setTimeout(() => {
      setShuffling(false);
      setOpen(true);
    }, SHUFFLE_MS);
  }

  function reveal() {
    if (!shuffling && !open) draw();
  }

  function again() {
    setOpen(false); // flip face-down first, then draw once it has turned over
    setTimeout(draw, SHUFFLE_MS);
  }

  const shown = open && card;

  return (
    <section className="section daily" id="daily">
      <div className="holo-wrap reveal">
        <div className="holo-shadow" aria-hidden="true" />
        <button
          className={`holo${open ? " open" : ""}${shuffling ? " shuffling" : ""}`}
          type="button"
          aria-label="แตะเพื่อเปิดไพ่ประจำวัน"
          onClick={reveal}
          onPointerMove={tilt}
          onPointerLeave={untilt}
        >
          <span className="holo-inner">
            <span className="side card-back">
              <span className="glare" />
            </span>
            <span className="side face">
              {card && <Image src={cardImage(`major-${card.n}`)} alt={`${card.en} (${card.th})`} fill sizes="260px" />}
              <span className="foil" />
              <span className="glare" />
            </span>
          </span>
        </button>
      </div>

      <div className="daily-copy reveal">
        <span className="label">02 — ไพ่ประจำวัน</span>
        {shown ? (
          <>
            <h2>
              {card.th}
              <small>
                {ROMAN[card.n]} · {card.en.toUpperCase()}
              </small>
            </h2>
            <p>พลังของไพ่ใบนี้จะอยู่กับคุณตลอดวัน ลองสังเกตว่ามันสะท้อนเรื่องไหนในชีวิตคุณ</p>
            <ul className="tags">
              {card.keywords.map((k, i) => (
                <li key={k} style={{ "--i": i } as React.CSSProperties}>
                  {k}
                </li>
              ))}
            </ul>
            <button className="btn btn-ghost" type="button" onClick={again}>
              สุ่มใบใหม่
              <ArrowRight />
            </button>
          </>
        ) : (
          <>
            <h2>
              เปิดไพ่หนึ่งใบ
              <br />
              สำหรับวันนี้
            </h2>
            <p>ขยับเมาส์บนไพ่เพื่อดูเงาสะท้อน แล้วแตะหนึ่งครั้งเพื่อเปิดดูพลังงานของวันนี้</p>
            <span className="hint">
              <kbd>คลิก</kbd> หรือแตะที่ไพ่
            </span>
          </>
        )}
      </div>
    </section>
  );
}
