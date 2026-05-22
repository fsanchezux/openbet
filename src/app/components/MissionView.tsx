"use client";
import { useState, useTransition } from "react";

export default function MissionView({
  mission,
  onCompleted,
}: {
  mission: { id: string; text: string; completedAt: string | null };
  onCompleted: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function markDone() {
    setErr(null);
    start(async () => {
      const r = await fetch("/api/mission/complete", { method: "POST" });
      const data = await r.json();
      if (!r.ok) setErr(data.error ?? "Error");
      else onCompleted();
    });
  }

  return (
    <div className="px-panel p-8 bounce-in">
      <div className="text-center mb-4">
        <span className="px-text-sm text-[color:var(--accent)]">
          ⚑ MISIÓN ACTIVA
        </span>
      </div>
      <div
        className="px-text text-center my-8 px-4 py-6"
        style={{
          background: "#0a0a23",
          border: "4px dashed var(--accent-2)",
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ lineHeight: 1.8 }}>{mission.text}</p>
      </div>
      <p className="px-text-sm text-[color:var(--muted)] text-center mb-6">
        Esta misión seguirá aquí hasta que la marques como hecha.
      </p>
      {err && (
        <p className="px-text-sm text-[color:var(--danger)] text-center mb-4">{err}</p>
      )}
      <div className="text-center">
        <button onClick={markDone} disabled={pending} className="px-btn px-btn-ok">
          {pending ? "..." : "✔ MISIÓN COMPLETADA"}
        </button>
      </div>
    </div>
  );
}
