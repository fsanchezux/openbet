import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayer } from "@/lib/player";

export async function POST() {
  const player = await getPlayer();
  if (!player) return NextResponse.json({ error: "Sin jugador" }, { status: 401 });

  const pm = await prisma.playerMission.findFirst({
    where: { playerId: player.id, confirmedAt: null },
  });
  if (!pm) return NextResponse.json({ error: "Sin misión activa" }, { status: 404 });
  if (pm.completedAt) {
    return NextResponse.json({ ok: true, completedAt: pm.completedAt });
  }

  const updated = await prisma.playerMission.update({
    where: { id: pm.id },
    data: { completedAt: new Date() },
  });
  return NextResponse.json({ ok: true, completedAt: updated.completedAt });
}
