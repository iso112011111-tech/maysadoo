/** Renders each word in its own mask so the line rises in word by word (pure CSS). */
export default function SplitWords({ words, start = 0, className }: { words: string[]; start?: number; className?: string }) {
  return (
    <span className="split">
      {words.map((w, i) => (
        <span key={i} className="w">
          <span className={className} style={{ "--i": start + i } as React.CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
