import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayer, todayKey } from "@/lib/player";

export async function POST() {
  const player = await getPlayer();
  if (!player) return NextResponse.json({ error: "Sin jugador" }, { status: 401 });

  // ¿Misión activa pendiente?
  const active = await prisma.playerMission.findFirst({
    where: { playerId: player.id, confirmedAt: null },
    include: { mission: true },
  });
  if (active) {
    return NextResponse.json({ error: "Ya tienes una misión pendiente", missionId: active.id }, { status: 409 });
  }

  const day = todayKey();
  const existing = await prisma.spin.findUnique({
    where: { playerId_day: { playerId: player.id, day } },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya has tirado hoy. Vuelve mañana." }, { status: 429 });
  }

  // Elegir misión aleatoria entre las activas
  const missions = await prisma.mission.findMany({ where: { active: true } });
  if (missions.length === 0) {
    return NextResponse.json({ error: "El admin no ha añadido misiones aún" }, { status: 500 });
  }
  const picked = missions[Math.floor(Math.random() * missions.length)];

  await prisma.spin.create({ data: { playerId: player.id, day } });
  const pm = await prisma.playerMission.create({
    data: { playerId: player.id, missionId: picked.id },
    include: { mission: true },
  });

  return NextResponse.json({
    id: pm.id,
    mission: { id: picked.id, text: picked.text },
  });
}
