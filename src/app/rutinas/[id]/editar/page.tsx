import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth-session";
import { findRoutine } from "@/lib/routine-repository";
import { RoutineEditor } from "@/components/routines/routine-editor";
export const metadata = { title: "Editar rutina · Mi rutina" };
export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/iniciar-sesion");
  // Page params remain URL-encoded in this Next.js version (unlike route handlers).
  // Default routine IDs contain a colon, so decode before looking up the owned row.
  let id: string;
  try {
    id = decodeURIComponent((await params).id);
  } catch {
    notFound();
  }
  const routine = await findRoutine(session.user.id, id);
  if (!routine) notFound();
  return <RoutineEditor initial={routine.definition} routineId={routine.id} />;
}
