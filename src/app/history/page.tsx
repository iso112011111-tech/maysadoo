import type { Metadata } from "next";
import Effects from "@/components/Effects";
import Nav from "@/components/Nav";
import ZodiacWheel from "@/components/ZodiacWheel";
import HistoryList from "@/components/reading/HistoryList";

export const metadata: Metadata = { title: "ประวัติการดูดวง" };

export default function HistoryPage() {
  return (
    <>
      <Effects />
      <Nav />
      <ZodiacWheel className="wheel-bg" />
      <main className="page">
        <div className="page-head">
          <span className="label">ประวัติ</span>
          <h1>ไพ่ที่คุณเคยเปิด</h1>
          <p>ประวัติจะจำไว้ในเบราว์เซอร์นี้ เปิดดูคำทำนายย้อนหลังได้ทุกครั้ง</p>
        </div>
        <HistoryList />
      </main>
    </>
  );
}
