"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sfxTick } from "@/lib/sfx";
import { ArrowRight } from "../Brand";
import { useDictation } from "./useDictation";

const EXAMPLES = ["แฟนเก่าจะกลับมาคืนดีกับเราไหม", "งานใหม่ที่สมัครไปจะได้ไหม", "ช่วงสามเดือนนี้ควรระวังเรื่องอะไร", "คนที่คุยอยู่จริงใจกับเราแค่ไหน"];

/** Tell แม่หมอ what is on your mind, then step into the room. */
export default function RoomEntry() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mic = useDictation((t) => setQuestion(t));

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    if (busy || question.trim().length < 4) return;
    sfxTick();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "เข้าห้องไม่สำเร็จ ลองอีกครั้ง");
      router.push(`/session/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="entry" onSubmit={enter}>
      <label className="entry-label" htmlFor="q">
        เล่าเรื่องที่อยู่ในใจให้แม่หมอฟัง
      </label>
      <div className="entry-box">
        <textarea
          id="q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="เช่น เขายังคิดถึงเราอยู่ไหม แล้วจะกลับมาไหม"
          disabled={busy}
        />
        {mic.supported && (
          <button type="button" className={`mic${mic.listening ? " on" : ""}`} onClick={mic.listening ? mic.stop : mic.start} aria-label="พูดคำถาม">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
          </button>
        )}
      </div>
      <div className="chips-row">
        {EXAMPLES.map((x) => (
          <button key={x} type="button" className="chip-btn" onClick={() => setQuestion(x)}>
            {x}
          </button>
        ))}
      </div>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      <div className="actions">
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy || question.trim().length < 4} data-magnetic>
          {busy ? "แม่หมอกำลังจุดเทียน…" : "เข้าห้องแม่หมอ"}
          <ArrowRight />
        </button>
        <span className="dock-note">เปิดเสียงไว้ เพื่อฟังแม่หมอพูดกับคุณ</span>
      </div>
    </form>
  );
}
