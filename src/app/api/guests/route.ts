import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { GUEST_COOKIE } from "@/lib/guest";

export async function POST(req: Request) {
  const { name } = await req.json().catch(() => ({})) as { name?: string };
  const clean = name?.trim();
  if (!clean || clean.length < 2 || clean.length > 24) {
    return NextResponse.json({ error: "Nick entre 2 y 24 caracteres" }, { status: 400 });
  }

  // Si ya existe, NO devolvemos esa cuenta (sería suplantación). Pedimos otro nick.
  const exists = await prisma.guest.findUnique({ where: { name: clean } });
  if (exists) return NextResponse.json({ error: "Ese nick ya está cogido" }, { status: 409 });

  const guest = await prisma.guest.create({ data: { name: clean } });
  const jar = await cookies();
  jar.set(GUEST_COOKIE, guest.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ id: guest.id, name: guest.name, drinks: guest.drinks });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(GUEST_COOKIE);
  return NextResponse.json({ ok: true });
}
