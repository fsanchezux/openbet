import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getGuest } from "@/lib/guest";
import GuestGate from "./GuestGate";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "OpenBet — apuesta drinks",
  description: "Apuestas entre amigos pagadas en drinks",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const guest = await getGuest();
  return (
    <html lang="es">
      <body>
        <header className="border-b border-white/5 bg-[var(--card)]">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">🍻 OpenBet</Link>
            <div className="flex items-center gap-3 text-sm">
              {guest && (
                <>
                  <Link href="/bets/new" className="rounded-md bg-amber-500 px-3 py-1.5 text-black font-medium hover:bg-amber-400">+ Apuesta</Link>
                  <span className="rounded-md bg-white/10 px-2.5 py-1">🍺 {guest.drinks}</span>
                  <span className="hidden sm:inline opacity-70">{guest.name}</span>
                  <LogoutButton />
                </>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        {!guest && <GuestGate />}
      </body>
    </html>
  );
}
