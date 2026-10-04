"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cardImage, MAJORS } from "@/lib/tarot";

const RING = [0, 1, 2, 6, 7, 10, 13, 16, 17, 18, 19, 21];
const STEP = 360 / RING.length;
const IDLE = -0.12; // deg per frame
const BASE_TILT = -8;

/** Hero: a ring of Major Arcana spinning in 3D. Drag to spin (with inertia); tilts toward the pointer. */
export default function CardRing() {
  const stageRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const stage = stageRef.current!;
    const ring = ringRef.current!;
    const cards = cardRefs.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let angle = 0;
    let vel = IDLE;
    let tilt = { x: BASE_TILT, y: 0 };
    let target = { x: BASE_TILT, y: 0 };
    let dragX: number | null = null;
    let visible = true;
    let raf = 0;

    const onDown = (e: PointerEvent) => {
      dragX = e.clientX;
      stage.classList.add("dragging");
      stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      target = {
        x: BASE_TILT + ((e.clientY - r.top) / r.height - 0.5) * -10,
        y: ((e.clientX - r.left) / r.width - 0.5) * 8,
      };
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      angle += dx * 0.28;
      vel = dx * 0.28;
      dragX = e.clientX;
    };
    const onUp = () => {
      dragX = null;
      stage.classList.remove("dragging");
    };
    const onLeave = () => (target = { x: BASE_TILT, y: 0 });

    function update() {
      if (dragX === null) {
        vel += (IDLE - vel) * 0.02; // ease back to idle spin
        angle += vel;
      }
      tilt = { x: tilt.x + (target.x - tilt.x) * 0.06, y: tilt.y + (target.y - tilt.y) * 0.06 };
      ring.style.transform = `rotateX(${tilt.x}deg) rotateY(${angle}deg) rotateZ(${tilt.y * 0.3}deg)`;
      cards.forEach((el, i) => {
        // this card's angle in the world, 0 = facing the viewer
        const a = ((((i * STEP + angle) % 360) + 540) % 360) - 180;
        el.style.setProperty("--lo", Math.max(0, 1 - Math.abs(a) / (STEP * 0.5)).toFixed(2));
        el.style.setProperty("--glint", `${50 + a * 1.4}%`);
      });
    }
    function loop() {
      if (visible) update();
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(stage);
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.addEventListener("pointerleave", onLeave);
    if (reduced) update();
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="stage" ref={stageRef} aria-label="วงไพ่ทาโรต์หมุนได้ ลากเพื่อหมุน">
      <div className="beam" aria-hidden="true" />
      <div className="grid-floor" aria-hidden="true" />
      <div className="ring" ref={ringRef}>
        {RING.map((n, i) => {
          const card = MAJORS[n];
          return (
            <div
              key={n}
              className="rc"
              ref={(el) => {
                if (el) cardRefs.current[i] = el;
              }}
              style={{ transform: `rotateY(${i * STEP}deg) translateZ(var(--r))` }}
            >
              <div className="rc-in" style={{ "--bd": `${(-i * 0.42).toFixed(2)}s` } as React.CSSProperties}>
                <div className="face">
                  <Image src={cardImage(`major-${n}`)} alt={`${card.en} (${card.th})`} fill sizes="160px" priority draggable={false} />
                </div>
                <div className="back" />
                <span className="name">{card.en.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
