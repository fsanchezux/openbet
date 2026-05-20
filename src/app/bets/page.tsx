import Link from "next/link";
import { getGuest } from "@/lib/guest";
import { listBets } from "@/lib/bets";
import { oddsFromProbability, formatOdds } from "@/lib/odds";
import RefillButton from "./RefillButton";
import CloseBetButton from "./CloseBetButton";

export const dynamic = "force-dynamic";

export default async function BetsPage() {
  const guest = await getGuest();
  if (!guest) return null;
  const bets = await listBets();

  const open = bets.filter(b => b.status === "OPEN");
  const pending = bets.filter(b => b.status === "PENDING_VALIDATION");
  const resolved = bets.filter(b => b.status === "RESOLVED");

  const myPendingCount = pending.filter(b => b.wagers.some(w => w.guestId === guest.id)).length;

  return (
    <div className="space-y-8">
      <Section title="Abiertas" empty="Nadie ha creado apuestas todavía." bets={open} guestId={guest.id} />
      <Section
        title="Pendientes de validación"
        empty="Sin apuestas pendientes."
        bets={pending}
        guestId={guest.id}
        badge={myPendingCount}
      />
      <Section title="Resueltas" empty="Aún no hay resueltas." bets={resolved} guestId={guest.id} />
      <div className="pt-4 border-t border-white/5">
        <RefillButton />
      </div>
    </div>
  );
}

function Section({ title, bets, empty, guestId, badge }: {
  title: string;
  bets: Awaited<ReturnType<typeof listBets>>;
  empty: string;
  guestId: string;
  badge?: number;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {badge && badge > 0 ? (
          <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">{badge}</span>
        ) : null}
      </div>
      {bets.length === 0 ? (
        <p className="opacity-60 text-sm">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {bets.map(b => {
            const pot = b.wagers.reduce((s, w) => s + w.amount, 0);
            const isCreator = b.creator.id === guestId;
            const iWagered = b.wagers.some(w => w.guestId === guestId);
            const winnerOpt = b.winnerId ? b.options.find(o => o.id === b.winnerId) : null;
            const winnerOdd = winnerOpt ? oddsFromProbability(winnerOpt.probability) : 0;
            const participantsCount = new Set(b.wagers.map(w => w.guestId)).size;

            return (
              <li key={b.id} className="rounded-lg bg-[var(--card)] hover:bg-white/5 border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/bets/${b.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{b.title}</h3>
                    <p className="text-xs opacity-60 mt-1">
                      Caduca {new Date(b.deadline).toLocaleString()} · {participantsCount} participantes · 🍺 {pot}
                    </p>
                    {b.status === "PENDING_VALIDATION" && winnerOpt && (
                      <p className="text-xs mt-1">
                        Ganadora propuesta: <b>{winnerOpt.label}</b> <span className="opacity-60">×{formatOdds(winnerOdd)}</span>
                        {iWagered && !isCreator && <span className="ml-2 text-amber-400">· revisa esto</span>}
                      </p>
                    )}
                    {b.status === "RESOLVED" && winnerOpt && (
                      <p className="text-xs mt-1 opacity-80">Ganadora: <b>{winnerOpt.label}</b> ×{formatOdds(winnerOdd)}</p>
                    )}
                  </Link>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {b.status === "OPEN" && isCreator && (
                      <CloseBetButton
                        betId={b.id}
                        options={b.options.map(o => ({ id: o.id, label: o.label }))}
                      />
                    )}
                    {b.status === "PENDING_VALIDATION" && (
                      <CountdownBadge closedAt={b.closedAt!.toISOString()} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function CountdownBadge({ closedAt }: { closedAt: string }) {
  // Estático server-side: muestra "termina en X min". Cliente lo renderizaría más bonito.
  const end = new Date(closedAt).getTime() + 30 * 60 * 1000;
  const left = Math.max(0, Math.round((end - Date.now()) / 60000));
  return <span className="text-xs rounded bg-white/10 px-2 py-0.5">~{left} min</span>;
}
