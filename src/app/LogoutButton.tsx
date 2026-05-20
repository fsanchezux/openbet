"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await fetch("/api/guests", { method: "DELETE" }); router.refresh(); })}
      className="opacity-70 hover:opacity-100"
    >
      Salir
    </button>
  );
}
