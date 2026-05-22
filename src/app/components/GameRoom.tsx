"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SlotMachine from "./SlotMachine";
import MissionView from "./MissionView";
import Coinflip from "./Coinflip";

type Mission = { id: string; text: string; completedAt: string | null } | null;

export default function GameRoom({
  player,
  initialMission,
  spunToday,
}: {
  player: { id: string; name: string };
  initialMission: Mission;
  spunToday: boolean;
}) {
  const router = useRouter();
  const [mission, setMission] = useState<Mission>(initialMission);
  const [spinDone, setSpinDone] = useState(spunToday);
  const [phase, setPhase] = useState<"slot" | "mission" | "coinflip">(
    initialMission ? (initialMission.completedAt ? "coinflip" : "mission") : "slot",
  );

  async function logout() {
    await fetch("/api/player", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6 px-text-sm">
        <span className="text-[color:var(--accent-2)]">★ {player.name.toUpperCase()}</span>
        <button onClick={logout} className="text-[color:var(--muted)] hover:text-[color:var(--accent)]">
          [salir]
        </button>
      </header>

      {phase === "slot" && (
        <SlotMachine
          alreadySpun={spinDone}
          onSpun={(m) => {
            setMission(m);
            setSpinDone(true);
            setPhase("mission");
          }}
        />
      )}

      {phase === "mission" && mission && (
        <MissionView
          mission={mission}
          onCompleted={() => {
            setMission((m) => (m ? { ...m, completedAt: new Date().toISOString() } : m));
            setPhase("coinflip");
          }}
        />
      )}

      {phase === "coinflip" && mission && (
        <Coinflip
          onDone={() => {
            setMission(null);
            setPhase("slot");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
