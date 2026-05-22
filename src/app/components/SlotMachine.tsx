"use client";
import { useState } from "react";

const SYMBOLS = [
  "/slot-machine/slot-symbol1.png",
  "/slot-machine/slot-symbol2.png",
  "/slot-machine/slot-symbol3.png",
  "/slot-machine/slot-symbol4.png",
];

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
  const [stopped, setStopped] = useState<number[]>([0, 0, 0]);

  async function pull() {
    if (alreadySpun || phase !== "idle") return;
    setErr(null);
    setPhase("pulling");

    // Pequeño delay para la animación de palanca
    await new Promise((r) => setTimeout(r, 450));
    setPhase("spinning");

    // Llamada al backend para obtener la misión
    const reqPromise = fetch("/api/spin", { method: "POST" }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Error");
      return data as { id: string; mission: { id: string; text: string } };
    });

    // Mostrar rodillos girando un mínimo de tiempo (efecto)
    const minSpin = new Promise((r) => setTimeout(r, 1600));

    try {
      const [, data] = await Promise.all([minSpin, reqPromise]);

      // Detener rodillos uno a uno: tres "7" para el jackpot ganador
      setPhase("stopping");
      const finalSymbols = [0, 0, 0];
      setStopped([0, 0, 0]);
      await new Promise((r) => setTimeout(r, 350));
      setStopped([1, 0, 0]);
      await new Promise((r) => setTimeout(r, 400));
      setStopped([1, 1, 0]);
      await new Promise((r) => setTimeout(r, 500));
      setStopped([1, 1, 1]);
      await new Promise((r) => setTimeout(r, 700));

      onSpun({ id: data.id, text: data.mission.text, completedAt: null });
      void finalSymbols;
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

      <div className="relative" style={{ width: 360, height: 480 }}>
        {/* Cabina del jackpot */}
        <img
          src="/slot-machine/slot-machine4.png"
          alt=""
          aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "auto" }}
        />

        {/* Ventana de los 3 rodillos. Posicionados sobre los huecos del sprite. */}
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 92,
            width: 175,
            height: 130,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Reel key={i} spinning={reelsSpinning && stopped[i] === 0} fixedIndex={0} />
          ))}
        </div>

        {/* Palanca: posicionada a la derecha de la máquina */}
        <button
          onClick={pull}
          disabled={alreadySpun || phase !== "idle"}
          aria-label="Tirar palanca"
          style={{
            position: "absolute",
            top: 80,
            right: -40,
            width: 100,
            height: 220,
            background: "transparent",
            border: 0,
            cursor: alreadySpun || phase !== "idle" ? "not-allowed" : "pointer",
            padding: 0,
          }}
        >
          <img
            src="/slot-machine/slot-machine2.png"
            alt=""
            className={phase === "pulling" ? "lever-pulling" : ""}
            style={{ width: "100%", height: "auto", transformOrigin: "top center" }}
          />
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
        <p className="px-text-sm text-[color:var(--muted)] mt-4 px-blink">
          ▶ pulsa la palanca
        </p>
      )}
    </div>
  );
}

function Reel({ spinning, fixedIndex }: { spinning: boolean; fixedIndex: number }) {
  // Mostramos 3 símbolos apilados; cuando para mostramos el "7" (índice 0).
  return (
    <div
      style={{
        background: "#e8f4ff",
        border: "2px solid #2a2a7a",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className={spinning ? "reel-spinning" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          willChange: "transform",
        }}
      >
        {/* Repetimos símbolos para crear bucle. Cuando para, mostramos sólo el 7. */}
        {(spinning ? [0, 1, 2, 3, 0, 1, 2, 3, 0] : [fixedIndex]).map((idx, k) => (
          <img
            key={k}
            src={SYMBOLS[idx]}
            alt=""
            style={{
              width: "70%",
              height: "auto",
              padding: 6,
              imageRendering: "pixelated",
            }}
          />
        ))}
      </div>
    </div>
  );
}
