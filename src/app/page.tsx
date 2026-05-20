import { redirect } from "next/navigation";
import { getGuest } from "@/lib/guest";

export default async function Home() {
  const guest = await getGuest();
  if (guest) redirect("/bets");
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-3">Apuesta drinks con amigos 🍻</h1>
      <p className="opacity-70 mb-8">Empiezas con 11 drinks. Elige un nick para entrar.</p>
    </div>
  );
}
