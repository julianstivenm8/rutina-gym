import { getAuth } from "@/lib/auth";
import { revokeOtherSessionsSchema } from "@/lib/account-settings";
import {
  getAccountSettings,
  withSettingsAccount,
} from "@/lib/account-settings-server";
import { routineResponse } from "@/lib/routine-api";

export async function POST(request: Request) {
  return withSettingsAccount(async (auth) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return routineResponse(
        { error: "Revisa la acción de las sesiones." },
        400,
      );
    }
    if (!revokeOtherSessionsSchema.safeParse(body).success)
      return routineResponse(
        { error: "Revisa la acción de las sesiones." },
        400,
      );
    const result = await getAuth().api.revokeOtherSessions({
      headers: request.headers,
      asResponse: true,
    });
    if (!result.ok)
      return routineResponse(
        { error: "No pudimos cerrar las otras sesiones. Vuelve a intentarlo." },
        result.status === 401 ? 401 : 503,
      );
    return routineResponse({ settings: await getAccountSettings(auth) });
  }, request);
}
