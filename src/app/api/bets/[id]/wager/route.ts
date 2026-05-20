import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Entra como invitado" }, { status: 401 });
  const { id } = await params;
  const { optionId, amount } = await req.json().catch(() => ({})) as { optionId?: string; amount?: number };
  if (!optionId || !amount || amount < 1) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      const bet = await tx.bet.findUnique({ where: { id }, include: { options: true } });
      if (!bet) throw new Error("Apuesta no encontrada");
      if (bet.status !== "OPEN") throw new Error("Apuesta cerrada");
      if (bet.deadline <= new Date()) throw new Error("Apuesta caducada");
      if (!bet.options.some(o => o.id === optionId)) throw new Error("Opción inválida");

      const me = await tx.guest.findUnique({ where: { id: guest.id } });
      if (!me || me.drinks < amount) throw new Error("Drinks insuficientes");

      await tx.guest.update({ where: { id: me.id }, data: { drinks: { decrement: amount } } });
      const w = await tx.wager.create({ data: { betId: id, guestId: me.id, optionId, amount } });
      return w;
    });
    return NextResponse.json({ id: result.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
