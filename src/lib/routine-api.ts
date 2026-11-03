import "server-only";
import { z } from "zod";
import { getCurrentSession } from "./auth-session";
import { routineDefinitionSchema } from "./routine-definition";
import { requireAuthEnvironment } from "./auth-environment";

export const saveRoutineSchema = z
  .object({ definition: routineDefinitionSchema, activate: z.boolean() })
  .strict();
export function routineResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function withRoutineUser(
  action: (userId: string) => Promise<Response>,
  request?: Request,
) {
  try {
    const session = await getCurrentSession();
    if (!session)
      return routineResponse(
        { error: "Inicia sesión para gestionar tus rutinas." },
        401,
      );
    if (
      request &&
      request.headers.get("origin") !== requireAuthEnvironment().BETTER_AUTH_URL
    ) {
      return routineResponse(
        {
          error:
            "Abre la aplicación desde su dirección habitual para guardar cambios.",
        },
        403,
      );
    }
    return await action(session.user.id);
  } catch {
    // Do not log database parameters or session information.
    return routineResponse(
      { error: "No pudimos acceder a tus rutinas. Vuelve a intentarlo." },
      503,
    );
  }
}

export async function readRoutineBody(request: Request) {
  try {
    return saveRoutineSchema.safeParse(await request.json());
  } catch {
    return null;
  }
}
