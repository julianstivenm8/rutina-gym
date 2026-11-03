import { readAuthEnvironment } from "../src/lib/auth-environment.ts";

const configuration = readAuthEnvironment();

if (!configuration.ready) {
  console.error("Faltan variables de autenticación válidas:", configuration.invalidVariables.join(", "));
  process.exitCode = 1;
} else {
  console.log("La configuración de autenticación está completa.");
  console.log("Callback de Google:", configuration.values.BETTER_AUTH_URL + "/api/auth/callback/google");
}
