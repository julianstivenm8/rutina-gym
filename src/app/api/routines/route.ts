import { listRoutines, saveRoutine } from "@/lib/routine-repository";
import {
  readRoutineBody,
  routineResponse,
  withRoutineUser,
} from "@/lib/routine-api";
export async function GET() {
  return withRoutineUser(async (userId) =>
    routineResponse({ routines: await listRoutines(userId) }),
  );
}
export async function POST(request: Request) {
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
    );
    return routineResponse({ id }, 201);
  }, request);
}
