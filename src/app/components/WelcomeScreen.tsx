"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeScreen() {
  const [step, setStep] = useState<"intro" | "name">("intro");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function begin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await fetch("/api/player", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await r.json();
      if (!r.ok) setErr(data.error ?? "Error");
      else router.refresh();
    });
  }

  if (step === "intro") {
    return (
      <div className="px-panel p-8 mt-6 bounce-in">
        <h1 className="px-title text-center mb-8">
          NON È UN<br />ADDIO AL<br />CELIBATO
        </h1>
        <div className="px-text space-y-4 mb-8">
          <p>
            <span className="text-[color:var(--accent-2)]">&gt;</span> ¡Bienvenido, Sandro!
          </p>
          <p>
            Esto aun no es tu despedida de soltero pero queriamos hacer algo diferente asique te toca pringar.
          </p>
          <ul className="space-y-3 px-text-sm pl-2">
            <li>
              <span className="text-[color:var(--accent)]">[1]</span> Tiras de la palanca del JACKPOT.
            </li>
            <li>
              <span className="text-[color:var(--accent)]">[2]</span> Los rodillos te asignan una MISIÓN.
            </li>
            <li>
              <span className="text-[color:var(--accent)]">[3]</span> Cumple la misión en la vida real.
            </li>
            <li>
              <span className="text-[color:var(--accent)]">[4]</span> Cuando la marques como hecha, se tirará un COINFLIP entre FEDE y CRISTIAN.
            </li>
            <li>
              <span className="text-[color:var(--accent)]">[5]</span> El que salga, le toca pringar la misma misión.
            </li>
          </ul>
          <p className="pt-2 text-[color:var(--muted)] px-text-sm">
            Sólo tienes 1 tiro por día. La misión se queda pendiente hasta que la completes.
          </p>
        </div>
        <div className="text-center">
          <button onClick={() => setStep("name")} className="px-btn">
            START <span className="px-blink">▶</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={begin} className="px-panel p-8 mt-6 bounce-in space-y-5">
      <h2 className="px-h2 text-center">¿CUÁL ES TU NOMBRE?</h2>
      <p className="px-text-sm text-center text-[color:var(--muted)]">
        Insert player name to continue
      </p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="SANDRO"
        minLength={2}
        maxLength={24}
        className="px-input text-center uppercase"
      />
      {err && <p className="px-text-sm text-[color:var(--danger)] text-center">{err}</p>}
      <div className="flex justify-between gap-3">
        <button type="button" onClick={() => setStep("intro")} className="px-btn px-btn-ghost">
          ← Atrás
        </button>
        <button disabled={pending || name.trim().length < 2} className="px-btn">
          {pending ? "..." : "JUGAR ▶"}
        </button>
      </div>
    </form>
  );
}
