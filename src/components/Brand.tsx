export function Logo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="logo-holo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5b4fc" />
          <stop offset=".35" stopColor="#f0abfc" />
          <stop offset=".65" stopColor="#fde68a" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <rect x="8" y="3" width="16" height="26" rx="3" fill="none" stroke="url(#logo-holo)" strokeWidth="1.5" />
      <path d="M18.5 12.2a4.2 4.2 0 1 0 0 7.6a5 5 0 1 1 0-7.6z" fill="#f4f4f5" />
    </svg>
  );
}

export function Brand({ href }: { href?: string }) {
  const inner = (
    <>
      <Logo />
      <span>ดูดวงออนไลน์</span>
    </>
  );
  return href ? (
    <a className="brand" href={href}>
      {inner}
    </a>
  ) : (
    <div className="brand">{inner}</div>
  );
}

export function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/** Four-point star used as a separator */
export function Spark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c.4 5.3 4.7 9.6 10 10-5.3.4-9.6 4.7-10 10-.4-5.3-4.7-9.6-10-10 5.3-.4 9.6-4.7 10-10z" />
    </svg>
  );
}
