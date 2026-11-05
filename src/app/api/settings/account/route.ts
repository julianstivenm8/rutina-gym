import { getAuth } from "@/lib/auth";
import {
  deleteAccountSchema,
  isRecentAccountSession,
} from "@/lib/account-settings";
import { withSettingsAccount } from "@/lib/account-settings-server";
import { routineResponse } from "@/lib/routine-api";

export async function DELETE(request: Request) {
  return withSettingsAccount(async (auth) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return routineResponse(
        { error: "Completa la confirmación para eliminar tu cuenta." },
        400,
      );
    }
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success)
      return routineResponse(
        { error: "Escribe ELIMINAR y el correo de tu cuenta para confirmar." },
        400,
      );
    if (parsed.data.email !== auth.user.email.toLowerCase())
      return routineResponse(
        { error: "El correo no corresponde a tu cuenta actual." },
        403,
      );
    if (!isRecentAccountSession(auth.session.createdAt))
      return routineResponse(
        {
          error: "Confirma tu acceso con Google antes de eliminar tu cuenta.",
          code: "REAUTH_REQUIRED",
        },
        403,
      );
    const response = await getAuth().api.deleteUser({
      headers: request.headers,
      body: {},
      asResponse: true,
    });
    if (!response.ok) {
      if (response.status === 400 || response.status === 401)
        return routineResponse(
          {
            error:
              "Vuelve a confirmar el acceso con Google antes de eliminar tu cuenta.",
            code: "REAUTH_REQUIRED",
          },
          403,
        );
      return routineResponse(
        { error: "No pudimos completar la eliminación. Vuelve a intentarlo." },
        503,
      );
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }, request);
}
