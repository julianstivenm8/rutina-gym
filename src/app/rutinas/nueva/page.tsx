import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { RoutineEditor } from "@/components/routines/routine-editor";

export const metadata = { title: "Crear rutina · Mi rutina" };
export default async function NewRoutinePage() {
  if (!(await getCurrentSession())) redirect("/iniciar-sesion");
  return <RoutineEditor />;
}
