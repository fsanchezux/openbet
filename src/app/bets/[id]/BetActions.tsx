"use client";
import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { oddsFromProbability, formatOdds } from "@/lib/odds";

type Option = { id: string; label: string; probability: number };
type Bet = {
  id: string;
  status: "OPEN" | "PENDING_VALIDATION" | "RESOLVED";
  winnerId: string | null;
  closedAt: string | null;
  creatorId: string;
  options: Option[];
};
type MyWager = { optionId: string; amount: number; claimed: boolean };

const WINDOW_MS = 30 * 60 * 1000;

export default function BetActions({ bet, myWagers, myGuestId, myDrinks }: {
  bet: Bet;
  myWagers: MyWager[];
  myGuestId: string;
  myDrinks: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const isCreator = bet.creatorId === myGuestId;
  const iWagered = myWagers.length > 0;

  async function call(url: string, body?: unknown) {
    setErr(null);
    return new Promise<void>(resolve =>
      start(async () => {
        const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          setErr(d.error ?? "Error");
        } else router.refresh();
        resolve();
      })
    );
  }

  if (bet.status === "OPEN") {
    return <OpenView bet={bet} myWagers={myWagers} myDrinks={myDrinks} isCreator={isCreator} call={call} err={err} pending={pending} />;
  }

  if (bet.status === "PENDING_VALIDATION") {
    return <PendingView bet={bet} myWagers={myWagers} isCreator={isCreator} iWagered={iWagered} call={call} err={err} pending={pending} />;
  }

  // RESOLVED
  return <ResolvedView bet={bet} myWagers={myWagers} call={call} err={err} pending={pending} />;
}

function OpenView({ bet, myWagers, myDrinks, isCreator, call, err, pending }: {
  bet: Bet; myWagers: MyWager[]; myDrinks: number; isCreator: boolean;
  call: (url: string, body?: unknown) => Promise<void>; err: string | null; pending: boolean;
}) {
  const [optionId, setOptionId] = useState(bet.options[0]?.id ?? "");
  const [amount, setAmount] = useState(1);
  const [closeOpen, setCloseOpen] = useState(false);
  const [winnerId, setWinnerId] = useState(bet.options[0]?.id ?? "");

  const selectedOdd = useMemo(() => {
    const o = bet.options.find(x => x.id === optionId);
    return o ? oddsFromProbability(o.probability) : 0;
  }, [optionId, bet.options]);
  const potentialWin = Math.floor(amount * selectedOdd);

  return (
    <section className="rounded-lg bg-[var(--card)] border border-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Apostar drinks</h2>
        {isCreator && (
          <button onClick={() => setCloseOpen(true)} className="text-xs rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5">
            Cerrar apuesta
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <select value={optionId} onChange={e => setOptionId(e.target.value)} className="input">
          {bet.options.map(o => (
            <option key={o.id} value={o.id}>{o.label} (×{formatOdds(oddsFromProbability(o.probability))})</option>
          ))}
        </select>
        <input type="number" min={1} max={myDrinks} value={amount} onChange={e => setAmount(Number(e.target.value))} className="input w-24" />
        <button disabled={pending || amount < 1 || amount > myDrinks} onClick={() => call(`/api/bets/${bet.id}/wager`, { optionId, amount })}
          className="rounded-md bg-amber-500 text-black font-medium px-4 py-2 disabled:opacity-50">
          Apostar 🍺{amount}
        </button>
      </div>
      <p className="text-sm opacity-80">
        Si ganas: <b>🍺 {potentialWin}</b> <span className="opacity-50">(× {formatOdds(selectedOdd)})</span>
      </p>
      {myWagers.length > 0 && (
        <p className="text-xs opacity-60">
          Tus apuestas: {myWagers.map(w => {
            const o = bet.options.find(opt => opt.id === w.optionId);
            const odd = o ? oddsFromProbability(o.probability) : 0;
            return `🍺${w.amount} en ${o?.label} → 🍺${Math.floor(w.amount * odd)}`;
          }).join(" · ")}
        </p>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}

      {closeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 px-4" onClick={() => setCloseOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-[var(--card)] border border-white/10 rounded-xl p-5 max-w-sm w-full space-y-3">
            <h3 className="font-semibold">Cerrar apuesta · elegir ganador</h3>
            <p className="text-xs opacity-60">Los participantes tendrán 30 min para validarla o quejarse.</p>
            <select value={winnerId} onChange={e => setWinnerId(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none">
              {bet.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCloseOpen(false)} className="px-3 py-1.5 rounded-md bg-white/10">Cancelar</button>
              <button disabled={pending} onClick={() => call(`/api/bets/${bet.id}/close`, { winnerId }).then(() => setCloseOpen(false))}
                className="px-3 py-1.5 rounded-md bg-amber-500 text-black font-medium disabled:opacity-50">
                {pending ? "..." : "Cerrar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`.input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:.5rem;padding:.5rem .75rem;color:inherit;outline:none}`}</style>
    </section>
  );
}

function PendingView({ bet, myWagers, isCreator, iWagered, call, err, pending }: {
  bet: Bet; myWagers: MyWager[]; isCreator: boolean; iWagered: boolean;
  call: (url: string, body?: unknown) => Promise<void>; err: string | null; pending: boolean;
}) {
  const closedAt = bet.closedAt ? new Date(bet.closedAt).getTime() : 0;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = Math.max(0, closedAt + WINDOW_MS - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000).toString().padStart(2, "0");
  const expired = remaining === 0;

  const winnerOpt = bet.options.find(o => o.id === bet.winnerId);
  const winnerOdd = winnerOpt ? oddsFromProbability(winnerOpt.probability) : 0;
  const myWinning = myWagers.find(w => w.optionId === bet.winnerId);
  const myPayoutPreview = myWinning ? Math.floor(myWinning.amount * winnerOdd) : 0;

  return (
    <section className="rounded-lg bg-[var(--card)] border border-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Pendiente de validación</h2>
        <span className="text-xs rounded bg-white/10 px-2 py-0.5">
          {expired ? "validándose..." : `${mins}:${secs}`}
        </span>
      </div>
      <p className="text-sm">
        Ganadora propuesta por el creador: <b>{winnerOpt?.label}</b> ×{formatOdds(winnerOdd)}
      </p>
      {myWinning && (
        <p className="text-sm opacity-80">Si se valida, ganarás 🍺{myPayoutPreview}.</p>
      )}
      {iWagered && !isCreator && !expired ? (
        <button disabled={pending} onClick={() => {
          if (confirm("¿Quejarte y reabrir la apuesta? El creador tendrá que volver a cerrarla.")) {
            call(`/api/bets/${bet.id}/dispute`);
          }
        }}
          className="rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 text-sm">
          Quejarme · reabrir
        </button>
      ) : !iWagered ? (
        <p className="text-xs opacity-60">No has participado, no puedes disputar.</p>
      ) : isCreator ? (
        <p className="text-xs opacity-60">Tú la cerraste, espera al plazo o a que alguien se queje.</p>
      ) : (
        <p className="text-xs opacity-60">Plazo agotado, validándose automáticamente. Recarga.</p>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </section>
  );
}

function ResolvedView({ bet, myWagers, call, err, pending }: {
  bet: Bet; myWagers: MyWager[];
  call: (url: string, body?: unknown) => Promise<void>; err: string | null; pending: boolean;
}) {
  const winnerOpt = bet.options.find(o => o.id === bet.winnerId);
  const winnerOdd = winnerOpt ? oddsFromProbability(winnerOpt.probability) : 0;
  const myWinning = myWagers.find(w => w.optionId === bet.winnerId);
  const myPayout = myWinning ? Math.floor(myWinning.amount * winnerOdd) : 0;

  return (
    <section className="rounded-lg bg-[var(--card)] border border-white/5 p-4 space-y-3">
      <h2 className="font-semibold">Apuesta determinada</h2>
      <p className="text-sm opacity-80">Ganadora: <b>{winnerOpt?.label}</b> · cuota ×{formatOdds(winnerOdd)}</p>
      {myWinning ? (
        myWinning.claimed ? (
          <p className="text-sm opacity-60">Ya reclamaste 🍺{myPayout}.</p>
        ) : (
          <button disabled={pending} onClick={() => call(`/api/bets/${bet.id}/claim`)}
            className="rounded-md bg-amber-500 text-black font-medium px-4 py-2 disabled:opacity-50">
            Reclamar 🍺{myPayout}
          </button>
        )
      ) : (
        <p className="text-sm opacity-60">No tienes drinks que reclamar.</p>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}
    </section>
  );
}
