import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PLAYER_COOKIE } from "@/lib/player";

export async function POST(req: Request) {
  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  const clean = name?.trim();
  if (!clean || clean.length < 2 || clean.length > 24) {
    return NextResponse.json({ error: "Nombre entre 2 y 24 caracteres" }, { status: 400 });
  }
  const player = await prisma.player.create({ data: { name: clean } });
  const jar = await cookies();
  jar.set(PLAYER_COOKIE, player.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ id: player.id, name: player.name });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(PLAYER_COOKIE);
  return NextResponse.json({ ok: true });
}
