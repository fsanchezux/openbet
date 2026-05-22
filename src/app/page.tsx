import { prisma } from "@/lib/prisma";
import { getPlayer, todayKey } from "@/lib/player";
import WelcomeScreen from "./components/WelcomeScreen";
import GameRoom from "./components/GameRoom";

export const dynamic = "force-dynamic";

export default async function Home() {
  const player = await getPlayer();
  if (!player) return <WelcomeScreen />;

  const activeMission = await prisma.playerMission.findFirst({
    where: { playerId: player.id, confirmedAt: null },
    include: { mission: true },
    orderBy: { assignedAt: "desc" },
  });

  const day = todayKey();
  const spunToday = await prisma.spin.findUnique({
    where: { playerId_day: { playerId: player.id, day } },
  });

  return (
    <GameRoom
      player={{ id: player.id, name: player.name }}
      initialMission={
        activeMission
          ? {
              id: activeMission.id,
              text: activeMission.mission.text,
              completedAt: activeMission.completedAt?.toISOString() ?? null,
            }
          : null
      }
      spunToday={!!spunToday}
    />
  );
}
