import { prisma } from "@/lib/prisma";
import { BetStatus } from "@prisma/client";

export const VALIDATION_WINDOW_MS = 30 * 60 * 1000;

/** Auto-promueve PENDING_VALIDATION → RESOLVED si pasaron 30 min sin disputa. */
export async function syncPending() {
  const cutoff = new Date(Date.now() - VALIDATION_WINDOW_MS);
  await prisma.bet.updateMany({
    where: { status: BetStatus.PENDING_VALIDATION, closedAt: { lte: cutoff } },
    data: { status: BetStatus.RESOLVED },
  });
}

export async function listBets() {
  await syncPending();
  return prisma.bet.findMany({
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
    include: {
      creator: { select: { id: true, name: true } },
      options: true,
      wagers: { select: { amount: true, guestId: true, optionId: true } },
    },
  });
}

export async function getBet(id: string) {
  await syncPending();
  return prisma.bet.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true } },
      options: { include: { wagers: true } },
      wagers: { include: { guest: { select: { id: true, name: true } } } },
    },
  });
}

export type BetWithRelations = NonNullable<Awaited<ReturnType<typeof getBet>>>;
