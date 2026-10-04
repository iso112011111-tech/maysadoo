"use client";

import { useSyncExternalStore } from "react";
import { moonOn } from "@/lib/moon";

// Pages may be prerendered at build time, so the date is read on the client only (server snapshot = null).
const today = () => new Date().toISOString().slice(0, 10);
const noop = () => () => {};

/** Tonight's moon: a small rendered disc + ข้างขึ้น/ข้างแรม. */
export default function MoonPhase({ className }: { className?: string }) {
  const day = useSyncExternalStore(noop, today, () => null);
  if (!day) return <span className={className} aria-hidden="true" />;

  const m = moonOn(new Date());
  // shadow disc slides off the moon as it waxes, back over it as it wanes
  const dx = 2 * 10 * m.illumination;
  const shadowX = m.waxing ? 12 - dx : 12 + dx;

  return (
    <span className={`moon ${className ?? ""}`} title={`แสงจันทร์ ${Math.round(m.illumination * 100)}%`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <mask id="moon-mask">
            <rect width="24" height="24" fill="#fff" />
            <circle cx={shadowX} cy="12" r="10.4" fill="#000" />
          </mask>
        </defs>
        <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" strokeWidth=".6" />
        <circle cx="12" cy="12" r="10" fill="#f4efe2" mask="url(#moon-mask)" />
      </svg>
      {m.thai}
    </span>
  );
}
