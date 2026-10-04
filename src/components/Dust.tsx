"use client";

import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; r: number; vy: number; phase: number; drift: number };

/** Warm motes of light drifting upward, like dust in a candle-lit room or incense smoke. */
export default function Dust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let motes: Mote[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    const spawn = (y?: number): Mote => ({
      x: Math.random() * w,
      y: y ?? Math.random() * h,
      r: Math.random() * 1.4 + 0.4,
      vy: Math.random() * 0.25 + 0.08,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.6 + 0.2,
    });

    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.round(Math.min(70, (w * h) / 22000)) }, () => spawn());
    }

    function frame(t: number) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) {
        m.y -= m.vy;
        const x = m.x + Math.sin(t / 2400 + m.phase) * 14 * m.drift;
        if (m.y < -10) Object.assign(m, spawn(h + 10));
        const a = 0.25 + 0.35 * Math.abs(Math.sin(t / 1800 + m.phase));
        const g = ctx.createRadialGradient(x, m.y, 0, x, m.y, m.r * 4);
        g.addColorStop(0, `rgba(255, 236, 205, ${a})`);
        g.addColorStop(1, "rgba(255, 236, 205, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, m.y, m.r * 4, 0, 7);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    size();
    raf = requestAnimationFrame(frame);
    addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="dust" aria-hidden="true" />;
}
