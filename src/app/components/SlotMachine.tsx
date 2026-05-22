"use client";
import { useState } from "react";

// Símbolos como emoji/glifo grande con tinte pixel. Coherente con el estilo
// del resto de la app (sin sprites externos).
const SYMBOLS = ["7", "🍒", "🔔", "BAR", "★"];

type Mission = { id: string; text: string; completedAt: string | null };

export default function SlotMachine({
  alreadySpun,
  onSpun,
}: {
  alreadySpun: boolean;
  onSpun: (m: Mission) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "pulling" | "spinning" | "stopping">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [stopped, setStopped] = useState<boolean[]>([false, false, false]);

  async function pull() {
    if (alreadySpun || phase !== "idle") return;
    setErr(null);
    setPhase("pulling");
    await new Promise((r) => setTimeout(r, 450));
    setPhase("spinning");
    setStopped([false, false, false]);

    const reqPromise = fetch("/api/spin", { method: "POST" }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error");
      return data as { id: string; mission: { id: string; text: string } };
    });

    const minSpin = new Promise((r) => setTimeout(r, 1500));

    try {
      const [, data] = await Promise.all([minSpin, reqPromise]);
      setPhase("stopping");
      await new Promise((r) => setTimeout(r, 350));
      setStopped([true, false, false]);
      await new Promise((r) => setTimeout(r, 400));
      setStopped([true, true, false]);
      await new Promise((r) => setTimeout(r, 500));
      setStopped([true, true, true]);
      await new Promise((r) => setTimeout(r, 700));
      onSpun({ id: data.id, text: data.mission.text, completedAt: null });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
      setPhase("idle");
    }
  }

  const reelsSpinning = phase === "spinning" || phase === "stopping";

  return (
    <div className="flex flex-col items-center">
      <h2 className="px-h2 mb-4 text-center">
        {alreadySpun ? "VUELVE MAÑANA" : "TIRA DE LA PALANCA"}
      </h2>

      <div className="slot-stage">
        <div className="slot-cabinet">
          <div className="slot-marquee">
            <span className="slot-marquee-text">JACKPOT</span>
            <span className="slot-bulb" style={{ left: "8%" }} />
            <span className="slot-bulb" style={{ left: "28%" }} />
            <span className="slot-bulb" style={{ left: "48%" }} />
            <span className="slot-bulb" style={{ left: "68%" }} />
            <span className="slot-bulb" style={{ left: "88%" }} />
          </div>

          <div className="slot-window">
            {[0, 1, 2].map((i) => (
              <Reel key={i} spinning={reelsSpinning && !stopped[i]} />
            ))}
          </div>

          <div className="slot-apron">
            <div className="slot-stripes" />
            <div className="slot-coin-slot" />
          </div>
        </div>

        <button
          onClick={pull}
          disabled={alreadySpun || phase !== "idle"}
          aria-label="Tirar palanca"
          className={`slot-lever ${phase === "pulling" ? "lever-pulling" : ""}`}
        >
          <span className="slot-lever-stick" />
          <span className="slot-lever-ball" />
        </button>
      </div>

      {err && (
        <p className="px-text-sm text-[color:var(--danger)] mt-4 text-center max-w-sm">
          {err}
        </p>
      )}

      {!err && alreadySpun && phase === "idle" && (
        <p className="px-text-sm text-[color:var(--muted)] mt-4 text-center">
          Ya has usado tu tiro de hoy.
        </p>
      )}

      {phase === "idle" && !alreadySpun && (
        <p className="px-text-sm text-[color:var(--muted)] mt-4 px-blink text-center">
          ▶ pulsa la palanca
        </p>
      )}
    </div>
  );
}

function Reel({ spinning }: { spinning: boolean }) {
  // Repetimos secuencia para crear bucle vertical.
  const loop = [...SYMBOLS, ...SYMBOLS, ...SYMBOLS];
  return (
    <div className="reel-window">
      <div className={spinning ? "reel-strip reel-spinning" : "reel-strip"}>
        {(spinning ? loop : ["7"]).map((s, i) => (
          <div key={i} className="reel-cell">
            <span className={`reel-glyph reel-glyph-${s === "7" ? "seven" : s === "BAR" ? "bar" : s === "🍒" ? "cherry" : s === "🔔" ? "bell" : "star"}`}>
              {s}
            </span>
          </div>
        ))}
      </div>
      {/* Sombras superior/inferior para efecto "mirilla" */}
      <div className="reel-shade reel-shade-top" />
      <div className="reel-shade reel-shade-bottom" />
    </div>
  );
}
