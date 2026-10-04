"use client";

import { useEffect, useRef, useState } from "react";
import type { VoiceLine } from "@/lib/spreads";
import { speak, stopVoice } from "@/lib/voice";

/**
 * แม่หมอ reads the summary aloud on her own, with a live subtitle. If the browser hasn't allowed sound yet
 * (e.g. a shared link opened fresh), she starts at the visitor's first tap. The button stops or replays.
 */
export default function VoiceNarrator({ lines, label = "แม่หมอกำลังสรุปคำทำนาย" }: { lines: VoiceLine[]; label?: string }) {
  const [line, setLine] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const started = useRef(false);

  function play() {
    setPlayed(true);
    speak(lines, {
      onLine: (i) => {
        setPlaying(true);
        setLine(i);
      },
      onEnd: () => {
        setPlaying(false);
        setLine(-1);
      },
    });
  }
  function stop() {
    stopVoice();
    setPlaying(false);
    setLine(-1);
  }

  useEffect(() => {
    if (started.current || !lines.length) return;
    // mark as started only when it really fires (dev StrictMode mounts effects twice and clears the first timer)
    const t = setTimeout(() => {
      started.current = true;
      play();
    }, 1400); // let the gong ring first
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  useEffect(() => () => stopVoice(), []);

  if (!lines.length) return null;
  return (
    <div className={`narrator${playing ? " on" : ""}`}>
      <button type="button" className="narrator-btn" onClick={playing ? stop : play} aria-label={playing ? "หยุดเสียง" : label}>
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className="narrator-wave" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </span>
      <span className="narrator-text" aria-live="polite">
        {playing && line >= 0 ? lines[line].text : played ? "ฟังแม่หมอสรุปอีกครั้ง" : `${label}…`}
      </span>
    </div>
  );
}
