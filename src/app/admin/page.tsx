import { prisma } from "@/lib/prisma";
import { todayKey } from "@/lib/player";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [missions, players, activeMissions] = await Promise.all([
    prisma.mission.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.player.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.playerMission.findMany({
      where: { confirmedAt: null },
      include: { player: true, mission: true },
    }),
  ]);

  const day = todayKey();
  const spinsToday = await prisma.spin.findMany({ where: { day } });
  const spunIds = new Set(spinsToday.map((s) => s.playerId));

  return (
    <AdminPanel
      missions={missions.map((m) => ({ id: m.id, text: m.text, active: m.active }))}
      players={players.map((p) => ({
        id: p.id,
        name: p.name,
        spunToday: spunIds.has(p.id),
        activeMission:
          activeMissions
            .filter((am) => am.playerId === p.id)
            .map((am) => ({ text: am.mission.text, completed: !!am.completedAt }))[0] ?? null,
      }))}
      day={day}
    />
  );
}
