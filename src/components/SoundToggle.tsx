"use client";

import { useSyncExternalStore } from "react";
import { setSoundEnabled, soundEnabled, soundServerSnapshot, subscribeSound } from "@/lib/sfx";

export default function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, soundServerSnapshot);
  return (
    <button
      type="button"
      className="sound-btn"
      aria-pressed={on}
      aria-label={on ? "ปิดเสียงเอฟเฟกต์" : "เปิดเสียงเอฟเฟกต์"}
      title={on ? "ปิดเสียง" : "เปิดเสียง"}
      onClick={() => setSoundEnabled(!on)}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" fill="currentColor" fillOpacity=".15" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" />
            <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
          </>
        ) : (
          <path d="m16 9.5 5 5m0-5-5 5" />
        )}
      </svg>
    </button>
  );
}
