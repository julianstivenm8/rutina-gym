import { z } from "zod";

const authEnvironmentSchema = z.object({
  BETTER_AUTH_URL: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      return (url.protocol === "https:" || (url.protocol === "http:" && local))
        && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/";
    } catch {
      return false;
    }
  }).transform((value) => new URL(value).origin),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url().refine((value) => /^postgres(?:ql)?:\/\//.test(value)),
  GOOGLE_CLIENT_ID: z.string().trim().min(1),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1),
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

export function readAuthEnvironment(source: Record<string, string | undefined> = process.env) {
  const result = authEnvironmentSchema.safeParse(source);
  if (result.success) return { ready: true as const, values: result.data };
  return {
    ready: false as const,
    invalidVariables: [...new Set(result.error.issues.map((issue) => String(issue.path[0])))],
  };
}

export class AuthConfigurationError extends Error {
  constructor() {
    super("La autenticación no está configurada.");
    this.name = "AuthConfigurationError";
  }
}

export function requireAuthEnvironment(): AuthEnvironment {
  const configuration = readAuthEnvironment();
  if (!configuration.ready) throw new AuthConfigurationError();
  return configuration.values;
}
