import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const PLAYER_COOKIE = "player_id";

export async function getPlayer() {
  const jar = await cookies();
  const id = jar.get(PLAYER_COOKIE)?.value;
  if (!id) return null;
  return prisma.player.findUnique({ where: { id } });
}

// Devuelve el "día" en zona Europe/Madrid como YYYY-MM-DD.
export function todayKey(date: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(date);
}
