import { routineResponse, withRoutineUser } from "@/lib/routine-api";
import {
  getRoutineProgress,
  saveExerciseWeight,
  deleteExerciseWeight,
} from "@/lib/weight-repository";
import { weightRecordSchema, weightDeleteSchema } from "@/lib/weight-progress";

export async function GET(request: Request) {
  return withRoutineUser(async (userId) => {
    const routineId = new URL(request.url).searchParams.get("routineId");
    if (!routineId || routineId.length > 200)
      return routineResponse({ error: "Elige una rutina válida." }, 400);
    const progress = await getRoutineProgress(userId, routineId);
    return progress
      ? routineResponse({ progress })
      : routineResponse({ error: "No encontramos esa rutina." }, 404);
  });
}
export async function POST(request: Request) {
  return withRoutineUser(async (userId) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return routineResponse(
        { error: "Revisa el peso antes de guardar." },
        400,
      );
    }
    const parsed = weightRecordSchema.safeParse(body);
    if (!parsed.success)
      return routineResponse(
        { error: "Escribe un peso válido y su unidad." },
        400,
      );
    const result = await saveExerciseWeight(userId, parsed.data);
    return routineResponse(
      result.error
        ? { error: result.error, progress: result.progress }
        : { progress: result.progress },
      result.status,
    );
  }, request);
}

export async function DELETE(request: Request) {
  return withRoutineUser(async (userId) => {
    let body: unknown;
    try { body = await request.json(); }
    catch { return routineResponse({ error: "Elige un registro válido." }, 400); }
    const parsed = weightDeleteSchema.safeParse(body);
    if (!parsed.success)
      return routineResponse({ error: "Elige un registro válido." }, 400);
    const result = await deleteExerciseWeight(userId, parsed.data);
    return routineResponse(
      result.error ? { error: result.error, progress: result.progress } : { progress: result.progress },
      result.status,
    );
  }, request);
}
