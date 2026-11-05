import "server-only";
import { getCurrentSession } from "./auth-session";
import { requireAuthEnvironment } from "./auth-environment";
import { routineResponse } from "./routine-api";

export async function withBodyUser(
  action: (userId: string) => Promise<Response>,
  request?: Request,
) {
  try {
    const session = await getCurrentSession();
    if (!session)
      return routineResponse(
        { error: "Inicia sesión para acceder a tus medidas." },
        401,
      );
    if (
      request &&
      request.headers.get("origin") !== requireAuthEnvironment().BETTER_AUTH_URL
    )
      return routineResponse(
        {
          error:
            "Abre la aplicación desde su dirección habitual para guardar cambios.",
        },
        403,
      );
    return await action(session.user.id);
  } catch {
    return routineResponse(
      { error: "No pudimos acceder a tus medidas. Vuelve a intentarlo." },
      503,
    );
  }
}
