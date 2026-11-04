import { WeeklyRoutine } from "@/components/weekly-routine";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { getActiveRoutine } from "@/lib/routine-repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  const active = await getActiveRoutine(session.user.id);
  return <WeeklyRoutine routineId={active.id} definition={active.definition} user={{ name: session.user.name, email: session.user.email }} />;
}
