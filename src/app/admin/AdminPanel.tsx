"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Mission = { id: string; text: string; active: boolean };
type Player = {
  id: string;
  name: string;
  spunToday: boolean;
  activeMission: { text: string; completed: boolean } | null;
};

export default function AdminPanel({
  missions,
  players,
  day,
}: {
  missions: Mission[];
  players: Player[];
  day: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function refresh() {
    router.refresh();
  }

  function addMission(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await fetch("/api/admin/missions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await r.json();
      if (!r.ok) setErr(data.error ?? "Error");
      else {
        setText("");
        refresh();
      }
    });
  }

  function toggleActive(m: Mission) {
    start(async () => {
      await fetch(`/api/admin/missions/${m.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !m.active }),
      });
      refresh();
    });
  }

  function removeMission(m: Mission) {
    if (!confirm(`¿Borrar misión "${m.text.slice(0, 40)}..."?`)) return;
    start(async () => {
      await fetch(`/api/admin/missions/${m.id}`, { method: "DELETE" });
      refresh();
    });
  }

  function resetSpin(playerId: string, mode: "spin" | "all") {
    const msg =
      mode === "spin"
        ? "¿Devolver el tiro de hoy a este jugador?"
        : "¿Borrar tiro Y misión pendiente?";
    if (!confirm(msg)) return;
    start(async () => {
      await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId, mode }),
      });
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="px-h2">★ ADMIN PANEL</h1>
        <div className="flex items-center gap-3 px-text-sm">
          <a href="/" className="text-[color:var(--muted)] hover:text-[color:var(--accent)]">
            [juego]
          </a>
        </div>
      </header>

      <section className="px-panel p-6">
        <h2 className="px-h2 mb-4">+ NUEVA MISIÓN</h2>
        <form onSubmit={addMission} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Bebete un chupito de tequila con sal en el ombligo de un desconocido"
            rows={3}
            maxLength={280}
            className="px-input"
          />
          <div className="flex items-center justify-between">
            <span className="px-text-sm text-[color:var(--muted)]">
              {text.length}/280
            </span>
            <button disabled={pending || text.trim().length < 3} className="px-btn">
              AÑADIR
            </button>
          </div>
          {err && <p className="px-text-sm text-[color:var(--danger)]">{err}</p>}
        </form>
      </section>

      <section className="px-panel p-6">
        <h2 className="px-h2 mb-4">⚑ MISIONES ({missions.length})</h2>
        {missions.length === 0 && (
          <p className="px-text-sm text-[color:var(--muted)]">No hay misiones todavía.</p>
        )}
        <ul className="space-y-3">
          {missions.map((m) => (
            <li
              key={m.id}
              className="flex items-start gap-3 p-3"
              style={{
                background: m.active ? "#0a0a23" : "#1a1a2e",
                border: "2px solid var(--panel-2)",
                opacity: m.active ? 1 : 0.55,
              }}
            >
              <div className="flex-1 px-text-sm" style={{ lineHeight: 1.7 }}>
                {m.text}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => toggleActive(m)}
                  disabled={pending}
                  className="px-btn px-btn-ghost"
                  style={{ padding: "6px 10px", fontSize: 9 }}
                >
                  {m.active ? "OFF" : "ON"}
                </button>
                <button
                  onClick={() => removeMission(m)}
                  disabled={pending}
                  className="px-btn px-btn-danger"
                  style={{ padding: "6px 10px", fontSize: 9 }}
                >
                  DEL
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-panel p-6">
        <h2 className="px-h2 mb-1">♟ JUGADORES ({players.length})</h2>
        <p className="px-text-sm text-[color:var(--muted)] mb-4">Día actual: {day}</p>
        {players.length === 0 && (
          <p className="px-text-sm text-[color:var(--muted)]">Aún no ha entrado nadie.</p>
        )}
        <ul className="space-y-3">
          {players.map((p) => (
            <li
              key={p.id}
              className="p-3"
              style={{ background: "#0a0a23", border: "2px solid var(--panel-2)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[color:var(--accent-2)] px-text-sm">
                  ★ {p.name.toUpperCase()}
                </span>
                <span className="px-text-sm text-[color:var(--muted)]">
                  {p.spunToday ? "● tirado hoy" : "○ sin tirar"}
                </span>
              </div>
              {p.activeMission && (
                <div className="px-text-sm mb-2" style={{ color: "var(--muted)" }}>
                  → {p.activeMission.completed ? "(✔) " : ""}{p.activeMission.text}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => resetSpin(p.id, "spin")}
                  disabled={pending || !p.spunToday}
                  className="px-btn px-btn-alt"
                  style={{ padding: "6px 10px", fontSize: 9 }}
                >
                  RESET TIRO
                </button>
                <button
                  onClick={() => resetSpin(p.id, "all")}
                  disabled={pending}
                  className="px-btn px-btn-danger"
                  style={{ padding: "6px 10px", fontSize: 9 }}
                >
                  RESET TODO
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
