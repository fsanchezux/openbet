import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
import { VALIDATION_WINDOW_MS } from "@/lib/bets";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Entra como invitado" }, { status: 401 });
  const { id } = await params;

  const bet = await prisma.bet.findUnique({ where: { id }, include: { wagers: true } });
  if (!bet) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (bet.status !== "PENDING_VALIDATION" || !bet.closedAt) {
    return NextResponse.json({ error: "No está pendiente de validar" }, { status: 400 });
  }
  if (Date.now() - bet.closedAt.getTime() >= VALIDATION_WINDOW_MS) {
    return NextResponse.json({ error: "El plazo de 30 min ya pasó" }, { status: 400 });
  }
  if (!bet.wagers.some(w => w.guestId === guest.id)) {
    return NextResponse.json({ error: "Solo los participantes pueden quejarse" }, { status: 403 });
  }
  if (bet.creatorId === guest.id) {
    return NextResponse.json({ error: "El creador no puede disputarse a sí mismo" }, { status: 400 });
  }

  await prisma.bet.update({
    where: { id },
    data: { status: "OPEN", winnerId: null, closedAt: null },
  });
  return NextResponse.json({ ok: true });
}
