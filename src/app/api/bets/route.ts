import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";
import { prisma } from "@/lib/prisma";

type IncomingOption = { label?: string; probability?: number };

export async function POST(req: Request) {
  const guest = await getGuest();
  if (!guest) return NextResponse.json({ error: "Entra como invitado" }, { status: 401 });

  const body = await req.json().catch(() => null) as
    | { title?: string; description?: string; deadline?: string; options?: IncomingOption[] } | null;
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const { title, description, deadline, options } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Falta título" }, { status: 400 });
  if (!deadline) return NextResponse.json({ error: "Falta fecha" }, { status: 400 });
  const dl = new Date(deadline);
  if (isNaN(dl.getTime()) || dl <= new Date()) return NextResponse.json({ error: "Fecha debe ser futura" }, { status: 400 });

  const opts = (options ?? [])
    .map(o => ({ label: o.label?.trim() ?? "", probability: Number(o.probability) || 0 }))
    .filter(o => o.label);
  if (opts.length < 2) return NextResponse.json({ error: "Mínimo 2 opciones" }, { status: 400 });
  if (opts.some(o => o.probability <= 0)) return NextResponse.json({ error: "Cada opción necesita probabilidad > 0" }, { status: 400 });
  const sum = opts.reduce((s, o) => s + o.probability, 0);
  if (Math.abs(sum - 100) > 0.01) return NextResponse.json({ error: "Las probabilidades deben sumar 100%" }, { status: 400 });

  const bet = await prisma.bet.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      deadline: dl,
      creatorId: guest.id,
      options: { create: opts.map(o => ({ label: o.label, probability: o.probability })) },
    },
  });
  return NextResponse.json({ id: bet.id });
}
