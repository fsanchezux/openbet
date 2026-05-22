"use client";
import { useState, useTransition } from "react";

const TARGETS = ["Fede", "Cristian"] as const;
type Target = (typeof TARGETS)[number];

export default function Coinflip({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"ready" | "flipping" | "result">("ready");
  const [result, setResult] = useState<Target | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function flip() {
    setPhase("flipping");
    // 50/50 en cliente; el resultado se envía al backend al confirmar.
    const picked: Target = Math.random() < 0.5 ? "Fede" : "Cristian";
    await new Promise((r) => setTimeout(r, 2300));
    setResult(picked);
    setPhase("result");
  }

  function confirm() {
    if (!result) return;
    setErr(null);
    start(async () => {
      const r = await fetch("/api/mission/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target: result }),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error ?? "Error");
        return;
      }
      onDone();
    });
  }

  return (
    <div className="px-panel p-8 bounce-in text-center">
      <h2 className="px-h2 mb-2">COINFLIP</h2>
      <p className="px-text-sm text-[color:var(--muted)] mb-8">
        Misión completada. ¿A quién le toca el siguiente trago?
      </p>

      <div
        className="mx-auto my-8 flex items-center justify-center"
        style={{ width: 180, height: 180 }}
      >
        <div
          className={phase === "flipping" ? "coin-flipping" : ""}
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #ffd23a, #ff6b1a 70%, #aa3300)",
            border: "6px solid #0a0a23",
            boxShadow: "0 0 0 4px #ffd23a, 6px 6px 0 #0a0a23",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: "#1a0a00",
            letterSpacing: 1,
          }}
        >
          {phase === "result" && result ? result.toUpperCase() : "?"}
        </div>
      </div>

      {phase === "ready" && (
        <button onClick={flip} className="px-btn">
          ▶ TIRAR MONEDA
        </button>
      )}

      {phase === "flipping" && (
        <p className="px-text-sm text-[color:var(--accent-2)] px-blink">girando...</p>
      )}

      {phase === "result" && result && (
        <>
          <p className="px-text mt-4 mb-6">
            Le toca a{" "}
            <span className="text-[color:var(--accent-2)]">{result.toUpperCase()}</span>
          </p>
          {err && <p className="px-text-sm text-[color:var(--danger)] mb-3">{err}</p>}
          <button onClick={confirm} disabled={pending} className="px-btn px-btn-ok">
            {pending ? "..." : "✔ CONFIRMAR"}
          </button>
        </>
      )}
    </div>
  );
}
