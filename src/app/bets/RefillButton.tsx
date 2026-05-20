"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefillButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await fetch("/api/drinks/refill", { method: "POST" });
            const data = await r.json();
            if (!r.ok) setMsg(data.error ?? "Error");
            else { setMsg(`+${data.added} drinks`); router.refresh(); }
          })
        }
        className="rounded-md bg-amber-500 text-black font-medium px-4 py-2 disabled:opacity-50"
      >
        {pending ? "..." : "Pedir 11 drinks"}
      </button>
      {msg && <span className="text-sm opacity-70">{msg}</span>}
      <span className="text-xs opacity-60">Solo si tu saldo es 0</span>
    </div>
  );
}
