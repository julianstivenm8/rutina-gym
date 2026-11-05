import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { makeSignature } from "better-auth/crypto";

const base = process.env.AUTH_TEST_BASE_URL ?? process.env.BETTER_AUTH_URL;
test(
  "account settings: private session metadata, current-session preservation and confirmed fresh account deletion",
  { skip: !base, timeout: 120_000 },
  async (t) => {
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base!).hostname),
    );
    const sql = neon(process.env.DATABASE_URL!);
    const users = [
      "settings-test-" + randomUUID(),
      "settings-test-" + randomUUID(),
      "settings-test-" + randomUUID(),
    ];
    const cookies: string[] = [],
      tokens: string[] = [],
      sessionIds: string[] = [];
    let extraCookie = "",
      extraToken = "";
    async function db<T>(query: PromiseLike<T>) {
      try {
        return await query;
      } catch {
        throw new Error(
          "Account test database operation failed; parameters hidden",
        );
      }
    }
    const signedCookie = async (token: string) =>
      "better-auth.session_token=" +
      encodeURIComponent(
        token +
          "." +
          (await makeSignature(token, process.env.BETTER_AUTH_SECRET!)),
      );
    async function call(
      path: string,
      method = "GET",
      account?: number,
      body?: unknown,
      origin = process.env.BETTER_AUTH_URL!,
      cookie?: string,
    ) {
      return fetch(base + path, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(25_000),
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...(cookie
            ? { Cookie: cookie }
            : account === undefined
              ? {}
              : { Cookie: cookies[account] }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    }
    const read = async (account = 0) => {
      const response = await call("/api/settings", "GET", account);
      assert.equal(response.status, 200);
      return (await response.json()).settings;
    };
    const deletion = (account = 0) => ({
      confirmation: "ELIMINAR",
      email: users[account] + "@example.invalid",
    });
    try {
      for (let index = 0; index < users.length; index++) {
        const id = users[index],
          token = randomUUID(),
          sessionId = randomUUID();
        const createdAt = new Date(
          Date.now() - (index === 2 ? 20 * 60_000 : 0),
        ).toISOString();
        await db(
          sql`insert into auth_user(id,name,email,email_verified) values (${id},'Cuenta temporal de configuración',${id + "@example.invalid"},true)`,
        );
        await db(
          sql`insert into auth_account(id,account_id,provider_id,user_id) values (${randomUUID()},${id},'google',${id})`,
        );
        await db(
          sql`insert into auth_session(id,token,user_id,expires_at,created_at,updated_at,user_agent) values (${sessionId},${token},${id},${new Date(Date.now() + 3600000).toISOString()},${createdAt},${createdAt},'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36')`,
        );
        tokens.push(token);
        sessionIds.push(sessionId);
        cookies.push(await signedCookie(token));
      }
      extraToken = randomUUID();
      extraCookie = await signedCookie(extraToken);
      await db(
        sql`insert into auth_session(id,token,user_id,expires_at,user_agent) values (${randomUUID()},${extraToken},${users[0]},${new Date(Date.now() + 3600000).toISOString()},'Mozilla/5.0 (iPhone) AppleWebKit Safari/604.1')`,
      );
      await t.test(
        "settings routes require real sessions and changes reject untrusted origins",
        async () => {
          assert.equal((await call("/configuracion")).status, 307);
          assert.equal((await call("/api/settings")).status, 401);
          assert.equal(
            (
              await call(
                "/api/settings/account",
                "DELETE",
                undefined,
                deletion(),
              )
            ).status,
            401,
          );
          assert.equal(
            (
              await call("/api/settings/sessions", "POST", undefined, {
                action: "revoke-others",
              })
            ).status,
            401,
          );
          assert.equal(
            (
              await call(
                "/api/settings",
                "GET",
                undefined,
                undefined,
                process.env.BETTER_AUTH_URL!,
                "better-auth.session_token=invented",
              )
            ).status,
            401,
          );
          assert.equal(
            (
              await call(
                "/api/settings/account",
                "DELETE",
                0,
                deletion(),
                "https://untrusted.example",
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await call(
                "/api/settings/sessions",
                "POST",
                0,
                { action: "revoke-others" },
                "https://untrusted.example",
              )
            ).status,
            403,
          );
        },
      );
      await t.test(
        "metadata is private, scoped to the account and excludes every session token",
        async () => {
          const response = await call("/api/settings", "GET", 0);
          assert.match(
            response.headers.get("cache-control")!,
            /private, no-store/,
          );
          const text = await response.text(),
            settings = JSON.parse(text).settings;
          for (const token of [...tokens, extraToken])
            assert.ok(
              !text.includes(token),
              "Session credentials must not be serialized",
            );
          for (const key of [
            "token",
            "accessToken",
            "refreshToken",
            "ipAddress",
            "userAgent",
          ])
            assert.ok(!text.includes('"' + key + '"'));
          assert.equal(settings.profile.email, users[0] + "@example.invalid");
          assert.equal(settings.sessions.length, 2);
          assert.equal(
            settings.sessions.filter((entry: any) => entry.current).length,
            1,
          );
          assert.equal(settings.sessions[0].device, "Chrome en Windows");
          const other = await read(1);
          assert.equal(other.sessions.length, 1);
          assert.equal(other.profile.email, users[1] + "@example.invalid");
          assert.equal(
            (await call("/api/settings?userId=" + users[1], "GET", 0)).status,
            400,
          );
          assert.equal(
            (
              await call("/api/settings/sessions", "POST", 0, {
                action: "revoke-others",
                userId: users[1],
              })
            ).status,
            400,
          );
        },
      );
      await t.test(
        "other-device sign-out keeps this session and other accounts active",
        async () => {
          const response = await call("/api/settings/sessions", "POST", 0, {
            action: "revoke-others",
          });
          assert.equal(response.status, 200);
          assert.equal((await response.json()).settings.sessions.length, 1);
          assert.equal((await read()).sessions[0].id, sessionIds[0]);
          const revoked = await call(
            "/api/auth/get-session",
            "GET",
            undefined,
            undefined,
            process.env.BETTER_AUTH_URL!,
            extraCookie,
          );
          assert.equal(await revoked.json(), null);
          assert.equal((await read(1)).sessions.length, 1);
          assert.equal((await read(2)).sessions.length, 1);
        },
      );
      await t.test(
        "deletion cannot bypass explicit confirmation or choose a different account",
        async () => {
          assert.equal(
            (await call("/api/auth/delete-user", "POST", 0, {})).status,
            404,
          );
          assert.equal(
            (
              await call(
                "/api/auth/delete-user/callback?token=invalid",
                "GET",
                0,
              )
            ).status,
            404,
          );
          assert.equal(
            (
              await call("/api/settings/account", "DELETE", 0, {
                ...deletion(),
                confirmation: "",
              })
            ).status,
            400,
          );
          assert.equal(
            (await call("/api/settings/account", "DELETE", 0, deletion(1)))
              .status,
            403,
          );
          assert.equal(
            (
              await call("/api/settings/account", "DELETE", 0, {
                ...deletion(),
                userId: users[1],
              })
            ).status,
            400,
          );
          assert.equal((await read()).profile.email, deletion().email);
        },
      );
      await t.test(
        "a valid but old session cannot delete and real Google reauthentication can be started",
        async () => {
          const response = await call(
            "/api/settings/account",
            "DELETE",
            2,
            deletion(2),
          );
          assert.equal(response.status, 403);
          assert.equal((await response.json()).code, "REAUTH_REQUIRED");
          assert.equal((await read(2)).profile.email, deletion(2).email);
          const login = await call("/api/auth/sign-in/social", "POST", 2, {
            provider: "google",
            callbackURL: "/configuracion",
            errorCallbackURL: "/configuracion?error=google",
          });
          assert.equal(login.status, 200);
          const authorization = new URL((await login.json()).url);
          assert.equal(authorization.origin, "https://accounts.google.com");
          const identifier =
            "auth-state:" + authorization.searchParams.get("state");
          try {
            const [state] = await db(
              sql`select value from auth_verification where identifier=${identifier}`,
            );
            assert.equal(JSON.parse(state.value).callbackURL, "/configuracion");
          } finally {
            await db(
              sql`delete from auth_verification where identifier=${identifier}`,
            );
          }
        },
      );
      await t.test(
        "the confirmation reports the account's actual private records",
        async () => {
          const routinesResponse = await call("/api/routines", "GET", 0);
          assert.equal(routinesResponse.status, 200);
          const routine = (await routinesResponse.json()).routines[0];
          const exercise = routine.definition.weeks[0].days[0].exercises[0];
          assert.equal(
            (
              await call("/api/weights", "POST", 0, {
                routineId: routine.id,
                exerciseId: exercise.id,
                requestId: randomUUID(),
                expectedVersion: 0,
                amount: "20",
                unit: "kg",
              })
            ).status,
            201,
          );
          assert.equal(
            (
              await call("/api/body", "POST", 0, {
                requestId: randomUUID(),
                expectedVersion: 0,
                gender: "unspecified",
                measuredOn: "2026-01-01",
                measurements: { weightKg: 72, heightCm: 175 },
              })
            ).status,
            201,
          );
          assert.deepEqual((await read()).counts, {
            routines: 1,
            weights: 1,
            bodyRecords: 1,
          });
        },
      );
      await t.test(
        "confirmed deletion uses Better Auth, removes all dependent records and invalidates the cookie",
        async () => {
          const response = await call(
            "/api/settings/account",
            "DELETE",
            0,
            deletion(),
          );
          assert.equal(response.status, 200);
          assert.equal((await response.json()).success, true);
          assert.ok(
            response.headers
              .get("set-cookie")
              ?.includes("better-auth.session_token="),
            "Deletion must clear the session cookie",
          );
          const [counts] = await db(sql`select
        (select count(*)::int from auth_user where id=${users[0]}) as users,
        (select count(*)::int from auth_session where user_id=${users[0]}) as sessions,
        (select count(*)::int from auth_account where user_id=${users[0]}) as accounts,
        (select count(*)::int from routine_plan where user_id=${users[0]}) as routines,
        (select count(*)::int from routine_selection where user_id=${users[0]}) as selection,
        (select count(*)::int from exercise_track where user_id=${users[0]}) as tracks,
        (select count(*)::int from exercise_weight where user_id=${users[0]}) as weights,
        (select count(*)::int from body_profile where user_id=${users[0]}) as profiles,
        (select count(*)::int from body_record where user_id=${users[0]}) as body,
        (select count(*)::int from body_measurement where user_id=${users[0]}) as measurements`);
          assert.ok(Object.values(counts).every((value) => value === 0));
          assert.equal((await call("/api/settings", "GET", 0)).status, 401);
          assert.equal((await call("/configuracion", "GET", 0)).status, 307);
          assert.equal((await read(1)).profile.email, deletion(1).email);
          assert.equal((await read(2)).profile.email, deletion(2).email);
        },
      );
    } finally {
      for (const id of users)
        await db(sql`delete from auth_user where id=${id}`);
    }
  },
);
