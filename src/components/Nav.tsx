"use client";

import { useEffect, useState } from "react";
import { Brand } from "./Brand";

const LINKS = [
  { href: "#topics", label: "ดูดวง" },
  { href: "#daily", label: "ไพ่ประจำวัน" },
  { href: "#how", label: "วิธีดูดวง" },
  { href: "#deck", label: "ไพ่ 78 ใบ" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 30);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}${open ? " open" : ""}`}>
      <Brand href="#" />
      <nav className="nav-links" aria-label="เมนูหลัก">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
      </nav>
      <a className="btn btn-primary btn-sm" href="#topics">
        เริ่มดูดวง
      </a>
      <button className="burger" type="button" aria-label="เปิดเมนู" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <i />
        <i />
      </button>
    </header>
  );
}
