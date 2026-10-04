"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Drawn } from "@/lib/deck";

/**
 * The room goes dark, one card rises into a beam of light and turns over, its name fading in.
 * Steps aside by itself after a moment; a tap or Esc closes it sooner.
 */
export default function Spotlight({ drawn, label, onClose, hint = "แตะเพื่ออ่านคำทำนาย", stayMs = 3800 }: { drawn: Drawn; label: string; onClose: () => void; hint?: string; stayMs?: number }) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const t = setTimeout(() => close.current(), stayMs);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      removeEventListener("keydown", onKey);
    };
  }, [stayMs]);

  return createPortal(
    <div className="spot" role="dialog" aria-modal="true" aria-label={drawn.card.th} onClick={() => close.current()}>
      <div className="spot-beam" aria-hidden="true" />
      <div className="spot-card">
        <div className="spot-inner">
          <span className="side card-back" />
          <span className="side face">
            <Image src={drawn.card.image} alt="" fill sizes="280px" priority className={drawn.reversed ? "rev" : ""} />
          </span>
        </div>
      </div>
      <div className="spot-text">
        <span className="label">{label}</span>
        <h2>{drawn.card.th}</h2>
        <p>
          {drawn.card.en} · {drawn.reversed ? "กลับหัว" : "หัวตั้ง"}
        </p>
      </div>
      <span className="spot-hint">{hint}</span>
    </div>,
    document.body,
  );
}
