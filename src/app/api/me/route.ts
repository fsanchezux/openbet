import { NextResponse } from "next/server";
import { getGuest } from "@/lib/guest";

export async function GET() {
  const g = await getGuest();
  if (!g) return NextResponse.json({ guest: null });
  return NextResponse.json({ guest: { id: g.id, name: g.name, drinks: g.drinks } });
}
