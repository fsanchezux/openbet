"use client";
import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { oddsFromProbability, formatOdds } from "@/lib/odds";

function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  // formato YYYY-MM-DDTHH:mm sin segundos
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Opt = { label: string; probability: number };

export default function NewBetForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [options, setOptions] = useState<Opt[]>([
    { label: "", probability: 50 },
    { label: "", probability: 50 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const sum = useMemo(() => options.reduce((s, o) => s + (Number(o.probability) || 0), 0), [options]);
  const sumOk = Math.abs(sum - 100) < 0.01;

  function setOpt(i: number, patch: Partial<Opt>) {
    setOptions(o => o.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function addOption() {
    setOptions(o => [...o, { label: "", probability: 0 }]);
  }
  function removeOption(i: number) {
    setOptions(o => o.filter((_, idx) => idx !== i));
  }
  function distributeEvenly() {
    const each = Math.round((100 / options.length) * 100) / 100;
    const rest = Math.round((100 - each * (options.length - 1)) * 100) / 100;
    setOptions(o => o.map((x, idx) => ({ ...x, probability: idx === o.length - 1 ? rest : each })));
  }

  function submit() {
    setError(null);
    start(async () => {
      const r = await fetch("/api/bets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          options: options.map(o => ({ label: o.label.trim(), probability: Number(o.probability) })).filter(o => o.label),
        }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error ?? "Error");
      else router.push(`/bets/${data.id}`);
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Título">
        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full input" placeholder="¿Gana el Madrid el sábado?" />
      </Field>
      <Field label="Descripción (opcional)">
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full input min-h-20" />
      </Field>
      <Field label="Fecha de caducidad">
        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full input" />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm opacity-70">Opciones y probabilidades</label>
          <button onClick={distributeEvenly} type="button" className="text-xs opacity-70 hover:opacity-100 underline">repartir igual</button>
        </div>
        <div className="space-y-2">
          {options.map((o, i) => {
            const odd = oddsFromProbability(Number(o.probability));
            return (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={o.label}
                  onChange={e => setOpt(i, { label: e.target.value })}
                  className="flex-1 input"
                  placeholder={`Opción ${i + 1}`}
                />
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={o.probability}
                    onChange={e => setOpt(i, { probability: Number(e.target.value) })}
                    className="input w-20 pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50">%</span>
                </div>
                <span className="text-sm opacity-80 w-16 text-right">{odd > 0 ? `×${formatOdds(odd)}` : "—"}</span>
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="px-2 rounded-md bg-white/10">−</button>
                )}
              </div>
            );
          })}
          <button type="button" onClick={addOption} className="text-sm opacity-70 hover:opacity-100">+ añadir opción</button>
        </div>
        <p className={`text-xs mt-2 ${sumOk ? "opacity-60" : "text-red-400"}`}>
          Suma de probabilidades: {sum.toFixed(2)}% {sumOk ? "✓" : "(debe ser 100%)"}
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button disabled={pending || !sumOk} onClick={submit} className="rounded-md bg-amber-500 text-black font-medium px-4 py-2 disabled:opacity-50">
        {pending ? "Creando..." : "Crear apuesta"}
      </button>
      <style>{`.input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:.5rem;padding:.5rem .75rem;color:inherit;outline:none}.input:focus{border-color:#f59e0b}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm opacity-70 mb-1">{label}</label>
      {children}
    </div>
  );
}
