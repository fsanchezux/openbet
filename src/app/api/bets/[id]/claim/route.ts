import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";
import { oddsFromProbability } from "@/lib/odds";
import { syncPending } from "@/lib/bets";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Entra como invitado" }, { status: 401 });
  const { id } = await params;

  await syncPending();

  try {
    const payout = await prisma.$transaction(async tx => {
      const bet = await tx.bet.findUnique({ where: { id }, include: { options: true } });
      if (!bet) throw new Error("No existe");
      if (bet.status !== "RESOLVED" || !bet.winnerId) throw new Error("Aún no resuelta");

      const winning = bet.options.find(o => o.id === bet.winnerId);
      if (!winning) throw new Error("Opción ganadora inválida");
      const odd = oddsFromProbability(winning.probability);

      const mine = await tx.wager.findMany({
        where: { betId: id, guestId: guest.id, optionId: bet.winnerId, claimed: false },
      });
      if (mine.length === 0) throw new Error("Nada que reclamar");

      const myAmount = mine.reduce((s, w) => s + w.amount, 0);
      const payout = Math.floor(myAmount * odd);

      await tx.wager.updateMany({ where: { id: { in: mine.map(w => w.id) } }, data: { claimed: true } });
      await tx.guest.update({ where: { id: guest.id }, data: { drinks: { increment: payout } } });
      return payout;
    });
    return NextResponse.json({ payout });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
