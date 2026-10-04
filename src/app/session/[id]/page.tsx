import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Effects from "@/components/Effects";
import Nav from "@/components/Nav";
import ZodiacWheel from "@/components/ZodiacWheel";
import Ambience from "@/components/reading/Ambience";
import Room from "@/components/room/Room";
import { clientKey } from "@/lib/server/db";
import { getSession, view } from "@/lib/server/session";

export const metadata: Metadata = { title: "ห้องแม่หมอ" };

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const s = getSession((await params).id);
  if (!s) notFound();
  const h = await headers();
  const client = clientKey(h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local");

  return (
    <>
      <Effects />
      <Nav />
      <Ambience />
      <ZodiacWheel className="wheel-bg" />
      <main className="page room-page">
        <Room initial={view(s, client)} />
      </main>
    </>
  );
}
