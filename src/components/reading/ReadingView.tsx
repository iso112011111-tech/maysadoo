"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { sfxFlip, sfxGong, sfxReveal } from "@/lib/sfx";
import { cardNumeral, SUITS, type Drawn } from "@/lib/deck";
import { TONE_LABEL, TOPIC_BY_ID, type SavedReading, type Spread, type Tone, type TopicId } from "@/lib/spreads";
import { ArrowRight } from "../Brand";
import Spotlight from "./Spotlight";
import VoiceNarrator from "./VoiceNarrator";

type Props = {
  spread: Spread;
  topic: TopicId | null;
  drawn: Drawn[];
  /** null while the reader (AI) is still working */
  result: Pick<SavedReading, "reading" | "waite" | "id" | "voice"> | null;
  error?: string | null;
  onRetry?: () => void;
  onRestart?: () => void;
  /** saved readings open face-up */
  revealed?: boolean;
};

function Thinking({ text = "แม่หมอกำลังอ่านไพ่" }: { text?: string }) {
  return (
    <span className="thinking">
      <span className="orb" />
      {text}…
    </span>
  );
}

function Skeleton() {
  return (
    <div className="skel" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

function ToneMeter({ tone }: { tone: Tone }) {
  return (
    <div className={`meter tone-${tone}`}>
      <span className="meter-bar" aria-hidden="true">
        {[-2, -1, 0, 1, 2].map((t) => (
          <i key={t} className={t <= tone ? "on" : ""} />
        ))}
      </span>
      {TONE_LABEL[tone]}
    </div>
  );
}

/** Spread board + card-by-card reading + overall summary. */
export default function ReadingView({ spread, topic, drawn, result, error, onRetry, onRestart, revealed = false }: Props) {
  const [open, setOpen] = useState<boolean[]>(() => drawn.map(() => revealed));
  const opened = open.filter(Boolean).length;
  const allOpen = opened === drawn.length;
  const topicLabel = topic ? TOPIC_BY_ID.get(topic)?.label : null;

  /** card currently lifted into the spotlight */
  const [spot, setSpot] = useState<number | null>(null);

  function flip(i: number) {
    if (open[i]) return;
    sfxReveal();
    setTimeout(() => sfxFlip(drawn[i].reversed), 520);
    setSpot(i);
    setOpen((o) => o.map((v, j) => (j === i ? true : v)));
  }

  function closeSpot() {
    if (spot === null) return;
    const i = spot;
    setSpot(null);
    setTimeout(() => document.getElementById(`rc-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
  }

  // gong once, the moment the whole reading is on the table (not for saved readings opened later)
  const ready = allOpen && !!result;
  const rang = useRef(revealed);
  useEffect(() => {
    if (!ready || rang.current) return;
    rang.current = true;
    const t = setTimeout(sfxGong, 500);
    return () => clearTimeout(t);
  }, [ready]);
  function flipAll() {
    drawn
      .map((_, i) => i)
      .filter((i) => !open[i])
      .forEach((i, k) =>
        setTimeout(() => {
          sfxFlip(drawn[i].reversed);
          setOpen((o) => o.map((v, j) => (j === i ? true : v)));
        }, k * 180),
      );
  }

  const [copied, setCopied] = useState(false);
  async function share() {
    if (!result) return;
    const url = `${location.origin}/reading/${result.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "คำทำนายไพ่ทาโรต์", url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // share sheet dismissed
    }
  }

  return (
    <div className="stage-in">
      {/* ---------- board ---------- */}
      <div className="board-wrap">
        <div className={`board board-${spread.id}`}>
          {drawn.map((d, i) => (
            <div key={d.card.id} className={`slot slot-${i + 1}`}>
              <button
                type="button"
                className={`rflip${open[i] ? " open" : ""}`}
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => flip(i)}
                aria-label={open[i] ? `${d.card.th}${d.reversed ? " กลับหัว" : ""}` : `เปิดไพ่ใบที่ ${i + 1} ${spread.positions[i].th}`}
              >
                <span className="rflip-inner">
                  <span className="side card-back" />
                  <span className="side face">
                    <Image src={d.card.image} alt="" fill sizes="200px" className={d.reversed ? "rev" : ""} />
                  </span>
                </span>
              </button>
              {spread.id !== "1" && (
                <span className="slot-label">
                  <b>{i + 1}</b>
                  {spread.positions[i].th}
                </span>
              )}
            </div>
          ))}
        </div>
        {!allOpen && (
          <div className="board-hint">
            <span>แตะไพ่ทีละใบเพื่อเปิด</span>
            {drawn.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={flipAll}>
                เปิดทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- card by card ---------- */}
      <div className="readings">
        {drawn.map((d, i) => {
          if (!open[i]) return null;
          const r = result?.reading.cards[i];
          const w = result?.waite[i];
          const pos = spread.positions[i];
          return (
            <article key={d.card.id} id={`rc-${i}`} className="rcard">
              <div className="rcard-img">
                <Image src={d.card.image} alt={`${d.card.en} (${d.card.th})`} fill sizes="150px" className={d.reversed ? "rev" : ""} />
              </div>
              <div className="rcard-body">
                <div className="rcard-pos">
                  <span>
                    {spread.id === "1" ? pos.th : `ใบที่ ${i + 1} · ${pos.th}`}
                  </span>
                  <span className="pill">{d.reversed ? "กลับหัว" : "หัวตั้ง"}</span>
                  {r && (
                    <span className={`pill tone-${r.tone}`}>
                      <i />
                      {TONE_LABEL[r.tone]}
                    </span>
                  )}
                </div>
                <h3>
                  {d.card.th}
                  <small>
                    {cardNumeral(d.card)} · {d.card.en} · {SUITS[d.card.suit].th}
                  </small>
                </h3>
                <div className="rblock">
                  <h4>ไพ่ใบนี้คืออะไร</h4>
                  {r ? <p>{r.about}</p> : <Skeleton />}
                </div>
                <div className="rblock pred">
                  <h4>คำทำนาย{topicLabel ? ` · ${topicLabel}` : ""}</h4>
                  {r ? <p>{r.prediction}</p> : error ? <p className="note">ยังไม่มีคำทำนาย</p> : <Thinking />}
                </div>
                {w && (
                  <details className="waite">
                    <summary>ความหมายตามตำรา A. E. Waite</summary>
                    <p>
                      {w.used}
                      {w.noReversed && " (ตำราไม่ได้ให้ความหมายกลับหัวของไพ่ใบนี้)"}
                    </p>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {error && (
        <div className="alert" role="alert">
          <span>{error}</span>
          {onRetry && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
              ลองอีกครั้ง
            </button>
          )}
        </div>
      )}

      {/* ---------- summary ---------- */}
      {allOpen && result && (
        <section className="summary" aria-labelledby="sum-h">
          <span className="label">สรุปคำทำนาย{topicLabel ? ` · ${topicLabel}` : " · ภาพรวมวันนี้"}</span>
          <h2 id="sum-h">{result.reading.summary.headline}</h2>
          <ToneMeter tone={result.reading.summary.tone} />
          {result.voice && result.voice.length > 0 && <VoiceNarrator lines={result.voice} />}
          <p className="overview" style={{ marginTop: 20 }}>
            {result.reading.summary.overview}
          </p>
          <div className="sum-cols">
            {result.reading.summary.advice.length > 0 && (
              <div className="sum-col">
                <h4>สิ่งที่ควรทำ</h4>
                <ol>
                  {result.reading.summary.advice.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </div>
            )}
            {result.reading.summary.caution.length > 0 && (
              <div className="sum-col">
                <h4>สิ่งที่ควรระวัง</h4>
                <ol>
                  {result.reading.summary.caution.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
          <div className="sum-actions">
            {onRestart ? (
              <button type="button" className="btn btn-primary" onClick={onRestart}>
                เปิดไพ่ใหม่
                <ArrowRight />
              </button>
            ) : (
              <Link className="btn btn-primary" href="/reading">
                เปิดไพ่ของคุณเอง
                <ArrowRight />
              </Link>
            )}
            <button type="button" className="btn btn-ghost" onClick={share}>
              {copied ? "คัดลอกลิงก์แล้ว" : "แชร์คำทำนาย"}
            </button>
            <Link className="btn btn-ghost" href="/history">
              ประวัติการดูดวง
            </Link>
          </div>
          <p className="note">คำทำนายเพื่อความบันเทิงและเป็นแนวทางในการไตร่ตรอง ตีความโดย AI จากความหมายในตำราของ A. E. Waite โปรดใช้วิจารณญาณ</p>
        </section>
      )}
      {allOpen && !result && !error && (
        <div className="board-hint" style={{ marginTop: 40 }}>
          <Thinking text="กำลังสรุปคำทำนายทั้งหมด" />
        </div>
      )}
      {spot !== null && (
        <Spotlight
          drawn={drawn[spot]}
          label={spread.id === "1" ? spread.positions[0].th : `ใบที่ ${spot + 1} · ${spread.positions[spot].th}`}
          onClose={closeSpot}
        />
      )}
    </div>
  );
}
