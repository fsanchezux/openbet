import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  const clean = text?.trim();
  if (!clean || clean.length < 3 || clean.length > 280) {
    return NextResponse.json({ error: "Texto entre 3 y 280 caracteres" }, { status: 400 });
  }
  const m = await prisma.mission.create({ data: { text: clean } });
  return NextResponse.json(m);
}
