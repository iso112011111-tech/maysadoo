"use client";

import { useEffect } from "react";
import Dust from "./Dust";

/**
 * Page-wide effects that need no markup of their own:
 *  - pointer-following ambient light (--mx/--my on <html>)
 *  - scroll progress bar (--progress)
 *  - scroll reveal for `.reveal`
 *  - magnetic pull on `[data-magnetic]`
 */
export default function Effects() {
  useEffect(() => {
    const root = document.documentElement;
    const fine = matchMedia("(pointer: fine)").matches;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onPointer = (e: PointerEvent) => {
      root.style.setProperty("--mx", `${e.clientX}px`);
      root.style.setProperty("--my", `${e.clientY}px`);
    };
    const onScroll = () => {
      const max = root.scrollHeight - innerHeight;
      root.style.setProperty("--progress", String(max > 0 ? scrollY / max : 0));
    };
    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    const magnets = fine && !reduced ? [...document.querySelectorAll<HTMLElement>("[data-magnetic]")] : [];
    const pull = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const release = (e: PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "");
    magnets.forEach((el) => {
      el.addEventListener("pointermove", pull);
      el.addEventListener("pointerleave", release);
    });

    return () => {
      removeEventListener("pointermove", onPointer);
      removeEventListener("scroll", onScroll);
      io.disconnect();
      magnets.forEach((el) => {
        el.removeEventListener("pointermove", pull);
        el.removeEventListener("pointerleave", release);
      });
    };
  }, []);

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <Dust />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="progress" aria-hidden="true" />
    </>
  );
}
