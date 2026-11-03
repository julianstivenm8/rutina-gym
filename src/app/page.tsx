import { WeeklyRoutine } from "@/components/weekly-routine";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  return <WeeklyRoutine user={{ name: session.user.name, email: session.user.email }} />;
}
