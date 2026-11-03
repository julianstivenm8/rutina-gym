import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { listRoutines } from "@/lib/routine-repository";
import { RoutineLibrary } from "@/components/routines/routine-library";
export const metadata = { title: "Mis rutinas · Mi rutina" };
export default async function RoutinesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  return <RoutineLibrary routines={await listRoutines(session.user.id)} />;
}
