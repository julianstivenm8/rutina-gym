import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { getDatabase } from "@/db";
import * as schema from "@/db/schema";
import { requireAuthEnvironment } from "./auth-environment";
import { FRESH_ACCOUNT_SESSION_SECONDS } from "./account-settings";

function createAuth() {
  const environment = requireAuthEnvironment();

  return betterAuth({
    appName: "Mi rutina",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    trustedOrigins: [environment.BETTER_AUTH_URL],
    database: drizzleAdapter(getDatabase(), { provider: "pg", schema }),
    emailAndPassword: { enabled: false },
    user: { deleteUser: { enabled: true } },
    // Account deletion goes through our explicit account confirmation, then Better Auth.
    disabledPaths: ["/delete-user", "/delete-user/callback"],
    socialProviders: {
      google: {
        clientId: environment.GOOGLE_CLIENT_ID,
        clientSecret: environment.GOOGLE_CLIENT_SECRET,
      },
    },
    account: { encryptOAuthTokens: true },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
      freshAge: FRESH_ACCOUNT_SESSION_SECONDS,
    },
    rateLimit: { storage: "database" },
    plugins: [nextCookies()],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  return auth ??= createAuth();
}
