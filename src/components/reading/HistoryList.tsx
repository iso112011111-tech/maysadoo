"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CARD_BY_ID } from "@/lib/deck";
import { SPREAD_BY_ID, TONE_LABEL, TOPIC_BY_ID, type ReadingSummary } from "@/lib/spreads";
import { ArrowRight } from "../Brand";
import { loadHistory } from "./history";

export default function HistoryList() {
  const [items, setItems] = useState<ReadingSummary[] | null>(null);

  useEffect(() => {
    const ids = loadHistory();
    fetch(`/api/readings?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setItems(d.readings ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <p className="thinking">กำลังโหลด…</p>;

  if (!items.length)
    return (
      <div className="empty">
        <p>ยังไม่มีประวัติการเปิดไพ่ในเบราว์เซอร์นี้</p>
        <Link className="btn btn-primary" href="/reading">
          เปิดไพ่ใบแรก
          <ArrowRight />
        </Link>
      </div>
    );

  return (
    <div className="history">
      {items.map((r) => (
        <Link key={r.id} href={`/reading/${r.id}`} className="hitem">
          <span className="hthumbs" aria-hidden="true">
            {r.cards.slice(0, 5).map((c) => (
              <span key={c.id}>
                <Image src={CARD_BY_ID.get(c.id)!.image} alt="" fill sizes="34px" style={c.reversed ? { transform: "rotate(180deg)" } : undefined} />
              </span>
            ))}
          </span>
          <span className="hmeta">
            <b>{r.headline}</b>
            <small>
              {SPREAD_BY_ID.get(r.spread)?.name} · {r.topic ? TOPIC_BY_ID.get(r.topic)?.label : "ภาพรวมของวัน"} · {TONE_LABEL[r.tone]} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </small>
          </span>
          <ArrowRight />
        </Link>
      ))}
    </div>
  );
}
