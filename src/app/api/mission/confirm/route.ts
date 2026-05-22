import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayer } from "@/lib/player";

const TARGETS = ["Fede", "Cristian"] as const;

export async function POST(req: Request) {
  const player = await getPlayer();
  if (!player) return NextResponse.json({ error: "Sin jugador" }, { status: 401 });

  const { target } = (await req.json().catch(() => ({}))) as { target?: string };
  if (!target || !TARGETS.includes(target as (typeof TARGETS)[number])) {
    return NextResponse.json({ error: "Objetivo inválido" }, { status: 400 });
  }

  const pm = await prisma.playerMission.findFirst({
    where: { playerId: player.id, confirmedAt: null },
  });
  if (!pm) return NextResponse.json({ error: "Sin misión activa" }, { status: 404 });
  if (!pm.completedAt) {
    return NextResponse.json({ error: "Marca la misión como hecha primero" }, { status: 400 });
  }

  await prisma.playerMission.update({
    where: { id: pm.id },
    data: { bouncedTo: target, confirmedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
