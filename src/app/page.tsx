import { WeeklyRoutine } from "@/components/weekly-routine";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { getActiveRoutine } from "@/lib/routine-repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  const definition = await getActiveRoutine(session.user.id);
  return <WeeklyRoutine definition={definition} user={{ name: session.user.name, email: session.user.email }} />;
}
