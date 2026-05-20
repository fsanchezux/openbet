import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Entra como invitado" }, { status: 401 });
  if (guest.drinks > 0) return NextResponse.json({ error: "Aún tienes drinks" }, { status: 400 });

  await prisma.guest.update({ where: { id: guest.id }, data: { drinks: 11 } });
  return NextResponse.json({ added: 11 });
}
