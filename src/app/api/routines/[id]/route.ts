import { findRoutine, saveRoutine } from "@/lib/routine-repository";
import {
  readRoutineBody,
  routineResponse,
  withRoutineUser,
} from "@/lib/routine-api";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, { params }: Context) {
  return withRoutineUser(async (userId) => {
    const routine = await findRoutine(userId, (await params).id);
    return routine
      ? routineResponse(routine)
      : routineResponse({ error: "No encontramos esa rutina." }, 404);
  });
}
export async function PUT(request: Request, { params }: Context) {
  return withRoutineUser(async (userId) => {
    const parsed = await readRoutineBody(request);
    if (!parsed?.success)
      return routineResponse(
        { error: "Revisa los días, ejercicios y la fecha de inicio." },
        400,
      );
    const id = await saveRoutine(
      userId,
      parsed.data.definition,
      parsed.data.activate,
      (await params).id,
    );
    return id
      ? routineResponse({ id })
      : routineResponse({ error: "No encontramos esa rutina." }, 404);
  }, request);
}
