"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CloseBetButton({ betId, options }: { betId: string; options: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [winnerId, setWinnerId] = useState(options[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function close() {
    setErr(null);
    start(async () => {
      const r = await fetch(`/api/bets/${betId}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      const data = await r.json();
      if (!r.ok) setErr(data.error ?? "Error");
      else { setOpen(false); router.refresh(); }
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs">
        Cerrar
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 px-4" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-[var(--card)] border border-white/10 rounded-xl p-5 max-w-sm w-full space-y-3">
            <h3 className="font-semibold">Cerrar apuesta · elegir ganador</h3>
            <p className="text-xs opacity-60">Los participantes tendrán 30 min para validarla o quejarse.</p>
            <select value={winnerId} onChange={e => setWinnerId(e.target.value)} className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none">
              {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {err && <p className="text-red-400 text-sm">{err}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-md bg-white/10">Cancelar</button>
              <button disabled={pending} onClick={close} className="px-3 py-1.5 rounded-md bg-amber-500 text-black font-medium disabled:opacity-50">
                {pending ? "..." : "Cerrar apuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
