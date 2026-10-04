"use client";

import { useEffect, useRef } from "react";
import { voiceLevel } from "@/lib/voice";

type Mode = "idle" | "thinking" | "speaking";

const HUES = ["196,181,253", "240,171,252", "253,230,138", "125,211,252"];

/**
 * แม่หมอ's crystal ball: smoke swirling inside glass, drawn on a canvas.
 * It churns faster while she is thinking and swells with the loudness of her voice while she speaks.
 */
export default function CrystalBall({ mode, confidence }: { mode: Mode; confidence: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let size = 0;
    let level = 0;
    let spin = 0;
    const wisps = Array.from({ length: 70 }, (_, i) => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * 0.75,
      s: (Math.random() * 0.6 + 0.4) * (Math.random() < 0.5 ? -1 : 1),
      z: Math.random() * 0.5 + 0.5,
      hue: HUES[i % HUES.length],
    }));

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      size = el.clientWidth;
      el.width = size * dpr;
      el.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(t: number) {
      const m = modeRef.current;
      const target = m === "speaking" ? voiceLevel() : m === "thinking" ? 0.25 + 0.15 * Math.sin(t / 300) : 0.08;
      level += (target - level) * 0.25;
      spin += m === "thinking" ? 0.012 : 0.004 + level * 0.02;
      wrap.current?.style.setProperty("--lv", level.toFixed(3));

      const R = size / 2;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(R, R, R - 1, 0, Math.PI * 2);
      ctx.clip();

      const bg = ctx.createRadialGradient(R * 0.8, R * 0.7, 0, R, R, R);
      bg.addColorStop(0, "#241c3c");
      bg.addColorStop(0.6, "#0f0c1c");
      bg.addColorStop(1, "#050409");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      ctx.globalCompositeOperation = "lighter";
      for (const w of wisps) {
        const a = w.a + spin * w.s * 3 + Math.sin(t / 2000 + w.r * 6) * 0.4;
        const rr = (w.r + Math.sin(t / 1700 + w.a) * 0.08) * R * (0.85 + level * 0.3);
        const x = R + Math.cos(a) * rr;
        const y = R + Math.sin(a) * rr * 0.8;
        const blob = R * (0.18 + w.z * 0.22) * (1 + level * 0.6);
        const alpha = (0.05 + level * 0.12) * w.z;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, blob);
        gr.addColorStop(0, `rgba(${w.hue},${alpha})`);
        gr.addColorStop(1, `rgba(${w.hue},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(x, y, blob, 0, Math.PI * 2);
        ctx.fill();
      }
      // a heart of light that beats with her voice
      const core = ctx.createRadialGradient(R, R, 0, R, R, R * (0.25 + level * 0.35));
      core.addColorStop(0, `rgba(255,244,225,${0.18 + level * 0.5})`);
      core.addColorStop(1, "rgba(255,244,225,0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // glass highlight + rim
      ctx.globalCompositeOperation = "source-over";
      const hl = ctx.createRadialGradient(R * 0.62, R * 0.45, 0, R * 0.62, R * 0.45, R * 0.5);
      hl.addColorStop(0, "rgba(255,255,255,.22)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.beginPath();
      ctx.arc(R, R, R - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  const C = 2 * Math.PI * 47;
  return (
    <div ref={wrap} className={`ball-wrap ${mode}`}>
      <svg className="conf-ring" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="conf-holo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a5b4fc" />
            <stop offset=".35" stopColor="#f0abfc" />
            <stop offset=".65" stopColor="#fde68a" />
            <stop offset="1" stopColor="#7dd3fc" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="url(#conf-holo)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={`${(C * confidence) / 100} ${C}`}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <canvas ref={canvas} className="ball" aria-hidden="true" />
      <div className="ball-base" aria-hidden="true" />
    </div>
  );
}
