import { activateRoutine } from "@/lib/routine-repository";
import { routineResponse, withRoutineUser } from "@/lib/routine-api";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withRoutineUser(
    async (userId) =>
      (await activateRoutine(userId, (await params).id))
        ? routineResponse({ active: true })
        : routineResponse({ error: "No encontramos esa rutina." }, 404),
    request,
  );
}
