"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import SoundToggle from "./SoundToggle";

const LINKS = [
  { href: "/reading", label: "เปิดไพ่" },
  { href: "/session", label: "ห้องแม่หมอ" },
  { href: "/history", label: "ประวัติ" },
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
      <Brand href="/" />
      <nav className="nav-links" aria-label="เมนูหลัก">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
      </nav>
      <SoundToggle />
      <Link className="btn btn-primary btn-sm" href="/reading">
        เริ่มดูดวง
      </Link>
      <button className="burger" type="button" aria-label="เปิดเมนู" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <i />
        <i />
      </button>
    </header>
  );
}
