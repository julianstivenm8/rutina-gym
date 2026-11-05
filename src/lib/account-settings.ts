import { z } from "zod";

export const FRESH_ACCOUNT_SESSION_SECONDS = 10 * 60;
export const deleteAccountSchema = z
  .object({
    confirmation: z
      .string()
      .trim()
      .pipe(
        z.literal("ELIMINAR", { error: "Escribe ELIMINAR para confirmar." }),
      ),
    email: z
      .email("Escribe el correo de tu cuenta.")
      .transform((value) => value.toLowerCase()),
  })
  .strict();
export const revokeOtherSessionsSchema = z
  .object({ action: z.literal("revoke-others") })
  .strict();
export function isRecentAccountSession(
  createdAt: string | Date,
  now = Date.now(),
) {
  const age = now - new Date(createdAt).getTime();
  return (
    Number.isFinite(age) &&
    age >= 0 &&
    age < FRESH_ACCOUNT_SESSION_SECONDS * 1000
  );
}
export function sessionDevice(userAgent: string | null) {
  if (!userAgent) return "Dispositivo sin identificar";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /(?:Chrome|CriOS)\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Navegador";
  const system = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Macintosh|Mac OS/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;
  return system ? `${browser} en ${system}` : browser;
}
export type AccountSettings = {
  profile: {
    name: string;
    email: string;
    createdAt: string;
    providers: string[];
  };
  sessions: {
    id: string;
    current: boolean;
    device: string;
    createdAt: string;
    expiresAt: string;
  }[];
  currentSessionCreatedAt: string;
  counts: { routines: number; weights: number; bodyRecords: number };
};
