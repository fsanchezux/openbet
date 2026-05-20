import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const GUEST_COOKIE = "guest_id";

export async function getGuest() {
  const jar = await cookies();
  const id = jar.get(GUEST_COOKIE)?.value;
  if (!id) return null;
  return prisma.guest.findUnique({ where: { id } });
}

export async function requireGuest() {
  const g = await getGuest();
  if (!g) throw new Error("UNAUTHENTICATED");
  return g;
}
