import { notFound } from "next/navigation";
import { getGuest } from "@/lib/guest";
import { getBet } from "@/lib/bets";
import { oddsFromProbability, formatOdds } from "@/lib/odds";
import BetActions from "./BetActions";

export const dynamic = "force-dynamic";

export default async function BetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guest = await getGuest();
  if (!guest) return null;
  const bet = await getBet(id);
  if (!bet) notFound();

  const totalPot = bet.options.reduce((s, o) => s + o.wagers.reduce((ss, w) => ss + w.amount, 0), 0);
  const myWagers = bet.wagers.filter(w => w.guest.id === guest.id);

  return (
    <article className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs opacity-60 mb-1">
          <span className="uppercase tracking-wider">{bet.status.replace("_", " ")}</span>
          <span>·</span>
          <span>creada por {bet.creator.name}</span>
        </div>
        <h1 className="text-2xl font-semibold">{bet.title}</h1>
        {bet.description && <p className="opacity-80 mt-2">{bet.description}</p>}
        <p className="text-sm opacity-60 mt-2">
          Caduca {new Date(bet.deadline).toLocaleString()} · Volumen apostado 🍺 {totalPot}
        </p>
      </header>

      <section>
        <h2 className="font-semibold mb-2">Opciones</h2>
        <ul className="space-y-2">
          {bet.options.map(o => {
            const pot = o.wagers.reduce((s, w) => s + w.amount, 0);
            const odd = oddsFromProbability(o.probability);
            const isWinner = (bet.status === "RESOLVED" || bet.status === "PENDING_VALIDATION") && bet.winnerId === o.id;
            return (
              <li key={o.id} className={`rounded-lg border p-3 ${isWinner ? "border-amber-400 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
                <div className="flex justify-between items-center gap-3 text-sm">
                  <span>{o.label}{isWinner && " 🏆"}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="opacity-60 text-xs">{o.probability.toFixed(1)}%</span>
                    <span className="rounded-md bg-amber-500/20 text-amber-300 px-2 py-0.5 font-mono">×{formatOdds(odd)}</span>
                    <span className="opacity-70">🍺 {pot}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <BetActions
        bet={JSON.parse(JSON.stringify({
          id: bet.id,
          status: bet.status,
          winnerId: bet.winnerId,
          closedAt: bet.closedAt,
          creatorId: bet.creator.id,
          options: bet.options.map(o => ({ id: o.id, label: o.label, probability: o.probability })),
        }))}
        myWagers={myWagers.map(w => ({ optionId: w.optionId, amount: w.amount, claimed: w.claimed }))}
        myGuestId={guest.id}
        myDrinks={guest.drinks}
      />
    </article>
  );
}
