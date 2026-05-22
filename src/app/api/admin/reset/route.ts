import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/player";

export async function POST(req: Request) {
  const { playerId, mode } = (await req.json().catch(() => ({}))) as {
    playerId?: string;
    mode?: "spin" | "all";
  };

  const where = playerId ? { playerId } : {};
  const day = todayKey();

  await prisma.spin.deleteMany({ where: { ...where, day } });

  if (mode === "all") {
    await prisma.playerMission.deleteMany({ where: { ...where, confirmedAt: null } });
  }

  return NextResponse.json({ ok: true });
}
