"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CARD_BY_ID, type Drawn } from "@/lib/deck";
import { MAX_CARDS, READER_NAME, type ReaderTurn, type SessionView, type Turn } from "@/lib/session";
import { sfxGong, sfxHover, sfxPick, sfxFlip, sfxReveal } from "@/lib/sfx";
import { speak, stopVoice } from "@/lib/voice";
import { ArrowRight } from "../Brand";
import Spotlight from "../reading/Spotlight";
import CrystalBall from "./CrystalBall";
import { useDictation } from "./useDictation";
import VoiceToggle from "./VoiceToggle";

type CardTurn = Extract<Turn, { role: "card" }>;

async function post(id: string, body: object): Promise<SessionView> {
  const res = await fetch(`/api/session/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "แม่หมอติดธุระชั่วครู่ ลองอีกครั้ง");
  return data as SessionView;
}

const drawnOf = (t: CardTurn): Drawn => ({ card: CARD_BY_ID.get(t.id)!, reversed: t.reversed });
const lastReader = (v: SessionView) => [...v.turns].reverse().find((t): t is ReaderTurn => t.role === "reader");

function Mic({ onText }: { onText: (t: string, final: boolean) => void }) {
  const d = useDictation(onText);
  if (!d.supported) return null;
  return (
    <button type="button" className={`mic${d.listening ? " on" : ""}`} onClick={d.listening ? d.stop : d.start} aria-label={d.listening ? "หยุดฟัง" : "พูดกับแม่หมอ"}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      </svg>
    </button>
  );
}

function Composer({ placeholder, onSend, disabled }: { placeholder: string; onSend: (t: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
      }}
    >
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={400} placeholder={placeholder} disabled={disabled} />
      <Mic
        onText={(t, final) => {
          setText(t);
          if (final && t.trim()) {
            onSend(t.trim());
            setText("");
          }
        }}
      />
      <button type="submit" className="send" disabled={disabled || !text.trim()} aria-label="ส่ง">
        <ArrowRight />
      </button>
    </form>
  );
}

/** The 1-on-1 room: แม่หมอ reads card after card, asks when unsure, and answers once the cards are clear. */
export default function Room({ initial }: { initial: SessionView }) {
  const [view, setView] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spot, setSpot] = useState<{ turn: CardTurn; live: boolean } | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const pending = useRef<SessionView | null>(null);
  const spotOpen = useRef(false);
  const feedEnd = useRef<HTMLDivElement>(null);

  const cards = view.turns.filter((t): t is CardTurn => t.role === "card");
  const reader = lastReader(view);
  const awaiting = view.awaiting;
  const thinking = busy || awaiting === "reader";

  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [view.turns.length, thinking]);
  useEffect(() => () => stopVoice(), []);

  /** Show แม่หมอ's newest turn and let her speak it. */
  function present(v: SessionView) {
    setView(v);
    const r = v.turns.at(-1);
    if (r?.role !== "reader") return;
    if (r.action === "answer") setTimeout(sfxGong, 200);
    if (!r.voice?.length) return;
    setSpeaking(true);
    speak(r.voice, {
      onLine: (i) => setSubtitle(r.voice![i].text),
      onEnd: () => {
        setSpeaking(false);
        setSubtitle(null);
      },
    });
  }

  async function letHerSpeak(id = view.id) {
    setBusy(true);
    setError(null);
    try {
      const v = await post(id, { action: "continue" });
      if (spotOpen.current) pending.current = v;
      else present(v);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // a fresh room speaks its greeting; a room left mid-turn (reload, network) resumes
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !initial.mine) return;
    started.current = true;
    // deferred a tick: these update state, which shouldn't happen synchronously inside an effect
    Promise.resolve().then(() => {
      if (initial.awaiting === "reader") letHerSpeak();
      else present(initial); // she repeats her last words when you come back to the room
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pick(index: number) {
    if (busy || awaiting !== "pick") return;
    stopVoice();
    setSpeaking(false);
    setSubtitle(null);
    sfxPick();
    setBusy(true);
    setError(null);
    try {
      const v = await post(view.id, { action: "draw", index });
      setView(v);
      const card = v.turns.at(-1) as CardTurn;
      spotOpen.current = true;
      setSpot({ turn: card, live: true });
      sfxReveal();
      setTimeout(() => sfxFlip(card.reversed), 520);
      letHerSpeak(v.id); // she starts reading while the card is still in the light
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function closeSpot() {
    spotOpen.current = false;
    setSpot(null);
    if (pending.current) {
      const v = pending.current;
      pending.current = null;
      present(v);
    }
  }

  async function send(text: string) {
    if (busy) return;
    stopVoice();
    setSpeaking(false);
    setSubtitle(null);
    setBusy(true);
    setError(null);
    try {
      const v = await post(view.id, { action: "say", text });
      setView(v);
      await letHerSpeak(v.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function replay(t: ReaderTurn) {
    if (!t.voice?.length) return;
    setSpeaking(true);
    speak(t.voice, {
      onLine: (i) => setSubtitle(t.voice![i].text),
      onEnd: () => {
        setSpeaking(false);
        setSubtitle(null);
      },
    });
  }

  const mode = thinking && !speaking ? "thinking" : speaking ? "speaking" : "idle";

  return (
    <div className="room">
      {/* ---------- the altar: crystal ball, clarity, cards on the table ---------- */}
      <aside className="altar">
        <CrystalBall mode={mode} confidence={view.confidence} />
        <div className="altar-name">
          <b>{READER_NAME}</b>
          <span>
            {mode === "thinking" ? "กำลังพินิจไพ่…" : mode === "speaking" ? "กำลังพูดกับท่าน" : awaiting === "done" ? "ไพ่ให้คำตอบแล้ว" : "รอท่านอยู่"}
          </span>
        </div>
        <div className="clarity">
          <span>ความชัดเจนของคำตอบ</span>
          <b>{view.confidence}%</b>
        </div>
        <p className={`subtitle${subtitle ? " on" : ""}`} aria-live="polite">
          {subtitle ?? " "}
        </p>
        <div className="altar-tools">
          <VoiceToggle />
          {speaking && (
            <button
              type="button"
              className="chip-btn"
              onClick={() => {
                stopVoice();
                setSpeaking(false);
                setSubtitle(null);
              }}
            >
              ข้ามเสียง
            </button>
          )}
        </div>
        {cards.length > 0 && (
          <div className="table" aria-label="ไพ่บนโต๊ะ">
            {cards.map((c) => (
              <span key={c.id} className="table-card" title={`${c.n}. ${CARD_BY_ID.get(c.id)!.th}`}>
                <Image src={CARD_BY_ID.get(c.id)!.image} alt="" fill sizes="44px" className={c.reversed ? "rev" : ""} />
              </span>
            ))}
            <span className="table-count">
              {cards.length}/{MAX_CARDS}
            </span>
          </div>
        )}
      </aside>

      {/* ---------- the conversation ---------- */}
      <section className="feed">
        <div className="msg user">
          <p>{view.question}</p>
        </div>
        {view.turns.map((t, i) => {
          if (t.role === "user")
            return (
              <div key={i} className="msg user">
                <p>{t.text}</p>
              </div>
            );
          if (t.role === "card") {
            const card = CARD_BY_ID.get(t.id)!;
            return (
              <button key={i} type="button" className="msg card" onClick={() => setSpot({ turn: t, live: false })}>
                <span className="msg-card-img">
                  <Image src={card.image} alt="" fill sizes="56px" className={t.reversed ? "rev" : ""} />
                </span>
                <span>
                  <small>
                    ใบที่ {t.n}
                    {t.focus ? ` · ${t.focus}` : ""}
                  </small>
                  <b>{card.th}</b>
                  <em>
                    {card.en} · {t.reversed ? "กลับหัว" : "หัวตั้ง"}
                  </em>
                </span>
              </button>
            );
          }
          return (
            <div key={i} className="msg reader">
              <span className="msg-name">
                {READER_NAME}
                {t.voice?.length ? (
                  <button type="button" className="replay" onClick={() => replay(t)} aria-label="ฟังอีกครั้ง">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                    </svg>
                  </button>
                ) : null}
              </span>
              <p>{t.text}</p>
              {t.ask && <p className="msg-ask">{t.ask}</p>}
              {t.final && (
                <div className="verdict">
                  <span className="label">คำตอบจากไพ่ · ความชัดเจน {t.confidence}%</span>
                  <h3>{t.final.verdict}</h3>
                  {t.final.explanation && <p>{t.final.explanation}</p>}
                  {t.final.timing && (
                    <p className="verdict-time">
                      <b>ช่วงเวลา</b> {t.final.timing}
                    </p>
                  )}
                  <div className="sum-cols">
                    {t.final.advice.length > 0 && (
                      <div className="sum-col">
                        <h4>สิ่งที่ควรทำ</h4>
                        <ol>
                          {t.final.advice.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {t.final.caution && (
                      <div className="sum-col">
                        <h4>สิ่งที่ต้องระวัง</h4>
                        <p className="caution">{t.final.caution}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {thinking && (
          <div className="msg reader thinking-msg">
            <span className="msg-name">{READER_NAME}</span>
            <span className="dots" aria-label="กำลังพินิจไพ่">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
            {awaiting === "reader" && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => letHerSpeak()}>
                ลองอีกครั้ง
              </button>
            )}
          </div>
        )}
        <div ref={feedEnd} />
      </section>

      {/* ---------- what the visitor can do now ---------- */}
      <div className="dock">
        {!view.mine ? (
          <div className="dock-row">
            <span className="dock-note">นี่คือห้องดูดวงของลูกดวงท่านอื่น</span>
            <Link className="btn btn-primary btn-sm" href="/session">
              เปิดห้องของคุณเอง
            </Link>
          </div>
        ) : awaiting === "pick" && !thinking ? (
          <div className="dock-pick">
            <p>
              <b>เลือกไพ่ใบที่ {cards.length + 1}</b>
              {reader?.focus ? ` · แม่หมอขอดู: ${reader.focus}` : ""}
            </p>
            <div className="fan" role="listbox" aria-label="สำรับไพ่คว่ำหน้า">
              {Array.from({ length: view.remaining }, (_, i) => {
                const t = i / Math.max(1, view.remaining - 1) - 0.5;
                return (
                  <button
                    key={`${cards.length}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    aria-label={`ไพ่ใบที่ ${i + 1}`}
                    className="fan-card"
                    style={{ "--i": i, "--arc": (t * t * 90).toFixed(1), "--rot": (t * 14).toFixed(1) } as React.CSSProperties}
                    onClick={() => pick(i)}
                    onPointerEnter={sfxHover}
                  >
                    <span className="card-back" />
                  </button>
                );
              })}
            </div>
            <Composer placeholder="หรือเล่าเพิ่มให้แม่หมอฟัง…" onSend={send} />
          </div>
        ) : awaiting === "ask" && !thinking && reader ? (
          <div className="dock-ask">
            <p className="dock-q">{reader.ask}</p>
            <div className="chips-row">
              {reader.suggestions?.map((s) => (
                <button key={s} type="button" className="chip-btn" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
            <Composer placeholder="พิมพ์หรือพูดตอบแม่หมอ…" onSend={send} />
          </div>
        ) : awaiting === "done" && !thinking ? (
          <div className="dock-ask">
            <Composer placeholder="ถามแม่หมอต่อในเรื่องนี้ เช่น แล้วควรเริ่มยังไง" onSend={send} />
            <div className="dock-row">
              <Link className="btn btn-ghost btn-sm" href="/session">
                เปิดห้องใหม่ เรื่องใหม่
              </Link>
            </div>
          </div>
        ) : (
          <div className="dock-row">
            <span className="dock-note">แม่หมอกำลังพินิจไพ่ ตั้งจิตรอสักครู่…</span>
          </div>
        )}
      </div>

      {spot && (
        <Spotlight
          drawn={drawnOf(spot.turn)}
          label={`ใบที่ ${spot.turn.n}${spot.turn.focus ? ` · ${spot.turn.focus}` : ""}`}
          hint={spot.live ? "แตะเพื่อฟังแม่หมออ่านไพ่" : "แตะเพื่อปิด"}
          onClose={closeSpot}
        />
      )}
    </div>
  );
}
