import type { Metadata, Viewport } from "next";
import { Anuphan } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";
import "./reading.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: { default: "ดูดวงออนไลน์ · ไพ่ทาโรต์", template: "%s · ดูดวงออนไลน์" },
  description: "ดูดวงไพ่ทาโรต์ออนไลน์ สำรับ Rider–Waite 78 ใบ ตามตำราต้นฉบับของ A. E. Waite",
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={anuphan.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
