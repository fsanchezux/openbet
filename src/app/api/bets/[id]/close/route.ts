import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Entra como invitado" }, { status: 401 });
  const { id } = await params;
  const { winnerId } = await req.json().catch(() => ({})) as { winnerId?: string };
  if (!winnerId) return NextResponse.json({ error: "Elige una opción ganadora" }, { status: 400 });

  const bet = await prisma.bet.findUnique({ where: { id }, include: { options: true } });
  if (!bet) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (bet.creatorId !== guest.id) return NextResponse.json({ error: "Solo el creador puede cerrar" }, { status: 403 });
  if (bet.status !== "OPEN") return NextResponse.json({ error: "No está abierta" }, { status: 400 });
  if (!bet.options.some(o => o.id === winnerId)) return NextResponse.json({ error: "Opción inválida" }, { status: 400 });

  // Si no hay participantes, se resuelve directamente.
  const wagerCount = await prisma.wager.count({ where: { betId: id } });
  const newStatus = wagerCount === 0 ? "RESOLVED" : "PENDING_VALIDATION";

  await prisma.bet.update({
    where: { id },
    data: { status: newStatus, winnerId, closedAt: new Date() },
  });
  return NextResponse.json({ ok: true, status: newStatus });
}
