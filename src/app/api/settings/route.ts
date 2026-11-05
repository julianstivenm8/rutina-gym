import {
  getAccountSettings,
  withSettingsAccount,
} from "@/lib/account-settings-server";
import { routineResponse } from "@/lib/routine-api";

export async function GET(request: Request) {
  return withSettingsAccount(async (auth) => {
    if (new URL(request.url).search)
      return routineResponse(
        { error: "Consulta tu cuenta desde Configuración." },
        400,
      );
    return routineResponse({ settings: await getAccountSettings(auth) });
  });
}
