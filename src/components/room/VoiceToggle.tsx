"use client";

import { useSyncExternalStore } from "react";
import { setVoiceEnabled, subscribeVoice, voiceEnabled, voiceServerSnapshot } from "@/lib/voice";

export function useVoiceOn() {
  return useSyncExternalStore(subscribeVoice, voiceEnabled, voiceServerSnapshot);
}

export default function VoiceToggle() {
  const on = useVoiceOn();
  return (
    <button type="button" className="chip-btn" aria-pressed={on} onClick={() => setVoiceEnabled(!on)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" fill={on ? "currentColor" : "none"} fillOpacity=".2" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        {!on && <path d="M4 4l16 16" />}
      </svg>
      {on ? "เสียงแม่หมอ เปิด" : "เสียงแม่หมอ ปิด"}
    </button>
  );
}
