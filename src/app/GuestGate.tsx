"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function GuestGate() {
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await fetch("/api/guests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await r.json();
      if (!r.ok) setErr(data.error ?? "Error");
      else router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 px-4">
      <form onSubmit={submit} className="bg-[var(--card)] border border-white/10 rounded-xl p-6 max-w-sm w-full space-y-3">
        <h2 className="text-xl font-semibold">Entra como invitado 👋</h2>
        <p className="text-sm opacity-70">Elige un nick para usar en las apuestas. Sin contraseña, solo prueba.</p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="tu nick"
          minLength={2}
          maxLength={24}
          className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-amber-500"
        />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button disabled={pending || name.trim().length < 2}
          className="w-full rounded-lg bg-amber-500 text-black font-medium px-4 py-2 disabled:opacity-50">
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
