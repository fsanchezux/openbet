import { getGuest } from "@/lib/guest";
import NewBetForm from "./NewBetForm";

export default async function NewBetPage() {
  const guest = await getGuest();
  if (!guest) return null;
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Nueva apuesta</h1>
      <NewBetForm />
    </div>
  );
}
