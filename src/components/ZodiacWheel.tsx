const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Point on a circle; 0° is straight up, clockwise. */
const at = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [+(r * Math.cos(a)).toFixed(2), +(r * Math.sin(a)).toFixed(2)] as const;
};

/**
 * Thin-line astrolabe: twelve houses numbered in Roman numerals (no zodiac glyphs — many phones draw those as emoji),
 * a 5° tick scale and an inner hexagram. Pure SVG, rotated by CSS.
 */
export default function ZodiacWheel({ className }: { className?: string }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const houses = Array.from({ length: 12 }, (_, i) => i * 30);
  const star = (r: number, offset: number) =>
    [0, 120, 240].map((d) => at(r, d + offset).join(",")).join(" ");

  return (
    <svg className={`zodiac ${className ?? ""}`} viewBox="-300 -300 600 600" aria-hidden="true">
      <g className="z-outer" fill="none" stroke="currentColor">
        <circle r="296" strokeOpacity=".5" />
        <circle r="286" strokeOpacity=".25" />
        <circle r="236" strokeOpacity=".4" />
        {ticks.map((d) => {
          const [x1, y1] = at(286, d);
          const [x2, y2] = at(d % 30 === 0 ? 268 : 279, d);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={d % 30 === 0 ? 0.6 : 0.3} />;
        })}
        {houses.map((d) => {
          const [x1, y1] = at(236, d);
          const [x2, y2] = at(268, d);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity=".4" />;
        })}
      </g>
      <g className="z-numerals" fill="currentColor" fillOpacity=".55" fontSize="15" textAnchor="middle" dominantBaseline="middle" letterSpacing="1">
        {houses.map((d, i) => {
          const [x, y] = at(252, d + 15);
          return (
            <text key={d} x={x} y={y} transform={`rotate(${d + 15} ${x} ${y})`}>
              {ROMAN[i]}
            </text>
          );
        })}
      </g>
      <g className="z-inner" fill="none" stroke="currentColor">
        <circle r="200" strokeOpacity=".2" strokeDasharray="2 6" />
        <circle r="150" strokeOpacity=".35" />
        <polygon points={star(150, 0)} strokeOpacity=".35" />
        <polygon points={star(150, 60)} strokeOpacity=".35" />
        <circle r="75" strokeOpacity=".3" />
        {houses.map((d) => {
          const [x, y] = at(200, d);
          return <circle key={d} cx={x} cy={y} r="2.2" fill="currentColor" fillOpacity=".5" stroke="none" />;
        })}
      </g>
    </svg>
  );
}
