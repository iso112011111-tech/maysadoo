"use client";

import { useEffect, useRef, useState } from "react";
import { shuffle, type Drawn } from "@/lib/deck";
import { sfxHover, sfxPick, sfxShuffle, sfxTick } from "@/lib/sfx";
import { SPREAD_BY_ID, SPREADS, TOPICS, type SavedReading, type SpreadId, type TopicId } from "@/lib/spreads";
import { ArrowRight } from "../Brand";
import { addHistory } from "./history";
import ReadingView from "./ReadingView";

type Step = "spread" | "topic" | "draw" | "read";

const SHUFFLE_MS = 1600;

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  );
}

function track(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export default function ReadingFlow({ initialSpread, initialTopic }: { initialSpread?: SpreadId; initialTopic?: TopicId }) {
  const [spreadId, setSpreadId] = useState<SpreadId | null>(initialSpread ?? null);
  const [topic, setTopic] = useState<TopicId | null>(initialTopic ?? null);
  const [step, setStep] = useState<Step>(initialSpread ? (SPREAD_BY_ID.get(initialSpread)!.asksTopic ? "topic" : "draw") : "spread");
  const [deck, setDeck] = useState<Drawn[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<SavedReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  /** mirrors `picked` so rapid taps / auto-pick timers always see the latest selection */
  const pickedRef = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const spread = spreadId ? SPREAD_BY_ID.get(spreadId)! : null;
  const need = spread?.positions.length ?? 0;
  const drawn = picked.map((i) => deck[i]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  function goDraw() {
    setDeck([]);
    setPicked((pickedRef.current = []));
    setStep("draw");
  }

  function chooseSpread(id: SpreadId) {
    sfxTick();
    setSpreadId(id);
    if (SPREAD_BY_ID.get(id)!.asksTopic) setStep("topic");
    else goDraw();
  }

  /** the querent shuffles: a fresh deck with random orientations */
  function doShuffle() {
    setPicked((pickedRef.current = []));
    setDeck(shuffle());
    setShuffling(true);
    sfxShuffle();
    later(() => setShuffling(false), SHUFFLE_MS);
  }

  async function ask(cards: Drawn[]) {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread: spreadId, topic, cards: cards.map((d) => ({ id: d.card.id, reversed: d.reversed })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด ลองอีกครั้ง");
      setResult(data as SavedReading);
      addHistory(data.id);
      window.history.replaceState(null, "", `/reading/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ลองอีกครั้ง");
    }
  }

  function pick(i: number) {
    const cur = pickedRef.current;
    if (shuffling || cur.includes(i) || cur.length >= need) return;
    const next = [...cur, i];
    sfxPick();
    setPicked((pickedRef.current = next));
    if (next.length === need) {
      // start the reader straight away; the cards are revealed while it works
      ask(next.map((j) => deck[j]));
      later(() => setStep("read"), 650);
    }
  }

  function autoPick() {
    const taken = pickedRef.current;
    const free = deck.map((_, i) => i).filter((i) => !taken.includes(i));
    const chosen: number[] = [];
    while (chosen.length < need - taken.length) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      const j = free[a[0] % free.length];
      if (!chosen.includes(j)) chosen.push(j);
    }
    chosen.forEach((j, k) => later(() => pick(j), k * 140));
  }

  function restart() {
    window.history.replaceState(null, "", "/reading");
    setResult(null);
    setError(null);
    setPicked((pickedRef.current = []));
    setStep("spread");
  }

  const steps: { id: Step; label: string }[] = [
    { id: "spread", label: "เลือกรูปแบบ" },
    ...(spread?.asksTopic !== false ? [{ id: "topic" as Step, label: "เลือกหัวข้อ" }] : []),
    { id: "draw", label: "จั่วไพ่" },
    { id: "read", label: "อ่านคำทำนาย" },
  ];
  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div ref={topRef} style={{ scrollMarginTop: 100 }}>
      <ol className="stepper" aria-label="ขั้นตอน">
        {steps.map((s, i) => (
          <li key={s.id} className={i === stepIndex ? "on" : i < stepIndex ? "done" : ""}>
            <span>{i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      {/* ---------- 1. spread ---------- */}
      {step === "spread" && (
        <div className="stage-in">
          <div className="spreads">
            {SPREADS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="spread-opt"
                aria-pressed={spreadId === s.id}
                onClick={() => chooseSpread(s.id)}
                onPointerMove={track}
              >
                <span className="spread-free">ฟรี</span>
                <span className="spread-n">{s.id} ใบ</span>
                <span className={`mini mini-${s.id}`} aria-hidden="true">
                  {s.positions.map((_, i) => (
                    <i key={i} />
                  ))}
                </span>
                <b>{s.name}</b>
                <small>{s.tagline}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------- 2. topic ---------- */}
      {step === "topic" && spread && (
        <div className="stage-in">
          <div className="page-head" style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>วันนี้อยากถามเรื่องอะไร</h2>
            <p>ติ๊กเลือกหนึ่งหัวข้อ แล้วตั้งจิตนึกถึงเรื่องนั้นไว้ขณะจั่วไพ่</p>
          </div>
          <div className="topic-grid" role="radiogroup" aria-label="หัวข้อ">
            {TOPICS.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={topic === t.id} className="topic-opt" onClick={() => {
                  sfxTick();
                  setTopic(t.id);
                }}>
                <span className="tick">
                  <Check />
                </span>
                <span>
                  <b>{t.label}</b>
                  <small>{t.hint}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="btn btn-primary btn-lg" disabled={!topic} onClick={goDraw}>
              ไปจั่วไพ่
              <ArrowRight />
            </button>
            <button type="button" className="back-link" onClick={() => setStep("spread")}>
              ← เปลี่ยนรูปแบบ
            </button>
          </div>
        </div>
      )}

      {/* ---------- 3. draw ---------- */}
      {step === "draw" && spread && (
        <div className="stage-in">
          <div className="draw-head">
            <div>
              <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", marginBottom: 6 }}>{!deck.length ? "สับไพ่" : shuffling ? "กำลังสับไพ่…" : `จั่วไพ่ ${need} ใบ`}</h2>
              <p>{spread.asksTopic ? "ตั้งจิตถึงหัวข้อที่เลือก แล้วเลือกไพ่ที่รู้สึกว่าใช่" : "นึกถึงวันนี้ของคุณ แล้วเลือกไพ่หนึ่งใบ"}</p>
            </div>
            <span className="draw-count">
              <b>{picked.length}</b> / {need}
            </span>
          </div>

          {!deck.length ? (
            <div className="shuffle-cta">
              <button type="button" className="deck-btn" onClick={doShuffle} aria-label="สับไพ่">
                {Array.from({ length: 5 }, (_, i) => (
                  <i key={i} className="card-back" style={{ "--i": i } as React.CSSProperties} />
                ))}
              </button>
              <button type="button" className="btn btn-primary btn-lg" onClick={doShuffle} data-magnetic>
                สับไพ่
              </button>
              <p>ตั้งจิตให้นิ่ง แล้วแตะเพื่อสับไพ่ 78 ใบ</p>
            </div>
          ) : shuffling ? (
            <div className="shuffling-deck" aria-live="polite">
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} className="card-back" style={{ "--i": i, transform: "none" } as React.CSSProperties} />
              ))}
            </div>
          ) : (
            <>
              <div className="fan" role="listbox" aria-label="สำรับไพ่ 78 ใบ คว่ำหน้า">
                {deck.map((_, i) => {
                  const t = i / (deck.length - 1) - 0.5;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="option"
                      aria-selected={picked.includes(i)}
                      aria-label={`ไพ่ใบที่ ${i + 1}`}
                      className={`fan-card${picked.includes(i) ? " taken" : ""}`}
                      style={{ "--i": i, "--arc": (t * t * 120).toFixed(1), "--rot": (t * 16).toFixed(1) } as React.CSSProperties}
                      onClick={() => pick(i)}
                      onPointerEnter={sfxHover}
                    >
                      <span className="card-back" />
                    </button>
                  );
                })}
              </div>
              <div className="picked" aria-label="ไพ่ที่เลือกแล้ว">
                {Array.from({ length: need }, (_, i) => (
                  <span key={i} className={`picked-slot${picked[i] !== undefined ? " filled" : ""}`}>
                    {picked[i] !== undefined ? <span className="card-back" /> : i + 1}
                  </span>
                ))}
              </div>
              <div className="actions">
                <button type="button" className="btn btn-ghost" onClick={autoPick} disabled={picked.length >= need}>
                  สุ่มให้ฉัน
                </button>
                <button type="button" className="back-link" onClick={doShuffle}>
                  สับไพ่ใหม่
                </button>
                <button type="button" className="back-link" onClick={() => setStep(spread.asksTopic ? "topic" : "spread")}>
                  ← ย้อนกลับ
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------- 4. read ---------- */}
      {step === "read" && spread && drawn.length === need && (
        <ReadingView
          key={drawn.map((d) => d.card.id).join()}
          spread={spread}
          topic={topic}
          drawn={drawn}
          result={result}
          error={error}
          onRetry={() => ask(drawn)}
          onRestart={restart}
        />
      )}
    </div>
  );
}
