import { routineResponse, withRoutineUser } from "@/lib/routine-api";
import { weightHistorySchema } from "@/lib/weight-progress";
import { getExerciseHistory } from "@/lib/weight-repository";

export async function GET(request: Request) {
  return withRoutineUser(async (userId) => {
    const parsed = weightHistorySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success)
      return routineResponse({ error: "Elige un historial válido." }, 400);
    const page = await getExerciseHistory(userId, parsed.data);
    return page
      ? routineResponse(page)
      : routineResponse({ error: "No encontramos ese ejercicio en tu rutina." }, 404);
  });
}
