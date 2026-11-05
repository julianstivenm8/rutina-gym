import "server-only";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import { account, session as sessionTable } from "@/db/schema";
import { getCurrentSession } from "./auth-session";
import { requireAuthEnvironment } from "./auth-environment";
import { routineResponse } from "./routine-api";
import { sessionDevice, type AccountSettings } from "./account-settings";

type AuthSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;
export async function getAccountSettings(
  auth: AuthSession,
): Promise<AccountSettings> {
  const db = getDatabase(),
    userId = auth.user.id;
  const [sessions, providers, counts] = await Promise.all([
    db
      .select({
        id: sessionTable.id,
        userAgent: sessionTable.userAgent,
        createdAt: sessionTable.createdAt,
        expiresAt: sessionTable.expiresAt,
      })
      .from(sessionTable)
      .where(
        and(
          eq(sessionTable.userId, userId),
          gt(sessionTable.expiresAt, new Date()),
        ),
      ),
    db
      .select({ id: account.providerId })
      .from(account)
      .where(eq(account.userId, userId)),
    db.execute<AccountSettings["counts"]>(sql`select
      (select count(*)::int from routine_plan where user_id = ${userId}) as routines,
      (select count(*)::int from exercise_weight where user_id = ${userId}) as weights,
      (select count(*)::int from body_record where user_id = ${userId}) as "bodyRecords"`),
  ]);
  return {
    profile: {
      name: auth.user.name,
      email: auth.user.email,
      createdAt: new Date(auth.user.createdAt).toISOString(),
      providers: [...new Set(providers.map((entry) => entry.id))],
    },
    sessions: sessions
      .map((entry) => ({
        id: entry.id,
        current: entry.id === auth.session.id,
        device: sessionDevice(entry.userAgent),
        createdAt: entry.createdAt.toISOString(),
        expiresAt: entry.expiresAt.toISOString(),
      }))
      .sort(
        (a, b) =>
          Number(b.current) - Number(a.current) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    currentSessionCreatedAt: new Date(auth.session.createdAt).toISOString(),
    counts: counts.rows[0],
  };
}
export async function withSettingsAccount(
  action: (auth: AuthSession) => Promise<Response>,
  request?: Request,
) {
  try {
    const auth = await getCurrentSession();
    if (!auth)
      return routineResponse(
        { error: "Inicia sesión para gestionar tu cuenta." },
        401,
      );
    if (
      request &&
      request.headers.get("origin") !== requireAuthEnvironment().BETTER_AUTH_URL
    )
      return routineResponse(
        {
          error:
            "Abre la aplicación desde su dirección habitual para gestionar tu cuenta.",
        },
        403,
      );
    return await action(auth);
  } catch {
    return routineResponse(
      { error: "No pudimos completar el cambio. Vuelve a intentarlo." },
      503,
    );
  }
}
