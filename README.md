# ดูดวงออนไลน์ — ไพ่ทาโรต์

Next.js 16 (App Router) + TypeScript · ตอนนี้มีเฉพาะหน้าแรก (UX/UI) ยังไม่มีระบบดูดวง

```bash
npm install
npm run dev     # http://localhost:5178
npm run build && npm start
```

## โครงสร้าง

- `src/app/` — `layout.tsx` (ฟอนต์ + metadata), `page.tsx` (หน้าแรก), `globals.css` (ธีมทั้งหมด — ฟอนต์ Anuphan ตัวเดียว, ไม่ใช้อิโมจิ)
- `src/components/` — `CardRing` (วงไพ่ 3 มิติ), `Effects` (แสงตามเมาส์, progress bar, scroll reveal, ปุ่มแม่เหล็ก), `Nav`, `SplitWords`, `Topics` (bento), `DailyCard` (ไพ่ holographic), `Steps` (sticky stack), `DeckMarquee`, `Brand` (โลโก้ + ไอคอน SVG)
- `src/lib/tarot.ts` — ข้อมูลไพ่ใหญ่ หัวข้อ และรายการไพ่ 78 ใบ
- `public/cards/` — ภาพไพ่ Rider–Waite 78 ใบ (Pamela Colman Smith, 1909 — สาธารณสมบัติ)
