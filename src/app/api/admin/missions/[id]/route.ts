import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { text?: string; active?: boolean };
  const data: { text?: string; active?: boolean } = {};
  if (typeof body.text === "string") {
    const clean = body.text.trim();
    if (clean.length < 3 || clean.length > 280) {
      return NextResponse.json({ error: "Texto entre 3 y 280 caracteres" }, { status: 400 });
    }
    data.text = clean;
  }
  if (typeof body.active === "boolean") data.active = body.active;
  const m = await prisma.mission.update({ where: { id }, data });
  return NextResponse.json(m);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.mission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
