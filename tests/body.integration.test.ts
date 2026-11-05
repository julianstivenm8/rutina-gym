import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { makeSignature } from "better-auth/crypto";

const base = process.env.AUTH_TEST_BASE_URL ?? process.env.BETTER_AUTH_URL;
test(
  "Mi cuerpo: real session protection, dated partial records, isolation, profile, pagination and deletion",
  { skip: !base, timeout: 120_000 },
  async (t) => {
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base!).hostname),
    );
    const sql = neon(process.env.DATABASE_URL!);
    const users = ["body-test-" + randomUUID(), "body-test-" + randomUUID()];
    const cookies: string[] = [];
    async function db<T>(query: PromiseLike<T>) {
      try {
        return await query;
      } catch {
        throw new Error(
          "Body test database operation failed; parameters hidden",
        );
      }
    }
    async function call(
      method = "GET",
      account?: number,
      body?: unknown,
      path = "/api/body",
      origin = process.env.BETTER_AUTH_URL!,
    ) {
      return fetch(base + path, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(25000),
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...(account === undefined ? {} : { Cookie: cookies[account] }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    }
    const read = async (account = 0) => {
      const response = await call("GET", account);
      assert.equal(response.status, 200);
      return (await response.json()).overview;
    };
    const payload = (
      measurements: unknown,
      expectedVersion: number,
      measuredOn = "2026-01-02",
    ) => ({
      requestId: randomUUID(),
      expectedVersion,
      gender: "male",
      measuredOn,
      measurements,
    });
    let firstRequest: ReturnType<typeof payload>;
    try {
      for (const id of users) {
        const token = randomUUID();
        await db(
          sql`insert into auth_user(id,name,email,email_verified) values (${id},'Prueba corporal',${id + "@example.invalid"},true)`,
        );
        await db(
          sql`insert into auth_session(id,token,user_id,expires_at) values (${randomUUID()},${token},${id},${new Date(Date.now() + 3600000).toISOString()})`,
        );
        cookies.push(
          "better-auth.session_token=" +
            encodeURIComponent(
              token +
                "." +
                (await makeSignature(token, process.env.BETTER_AUTH_SECRET!)),
            ),
        );
      }
      await t.test(
        "anonymous and fabricated sessions cannot access body data or the protected page",
        async () => {
          for (const method of ["GET", "POST", "PUT", "DELETE"])
            assert.equal(
              (await call(method, undefined, method === "GET" ? undefined : {}))
                .status,
              401,
            );
          const fake = await fetch(base + "/api/body", {
            headers: { Cookie: "better-auth.session_token=invented" },
          });
          assert.equal(fake.status, 401);
          assert.equal(
            (await call("GET", undefined, undefined, "/mi-cuerpo")).status,
            307,
          );
          assert.equal(
            (
              await call(
                "POST",
                0,
                {},
                "/api/body",
                "https://untrusted.example",
              )
            ).status,
            403,
          );
          assert.equal(
            (
              await call(
                "DELETE",
                0,
                {},
                "/api/body",
                "https://untrusted.example",
              )
            ).status,
            403,
          );
          assert.equal(
            (await call("PUT", 0, {}, "/api/body", "https://untrusted.example"))
              .status,
            403,
          );
        },
      );
      await t.test(
        "new accounts have no assumed gender, weight, height or body measurements",
        async () => {
          const overview = await read();
          assert.equal(overview.version, 0);
          assert.equal(overview.gender, "unspecified");
          assert.equal(overview.count, 0);
          assert.deepEqual(overview.latest, {});
        },
      );
      await t.test(
        "gender can be saved alone without manufacturing measurement history",
        async () => {
          assert.equal(
            (await call("PUT", 0, { gender: "female", expectedVersion: 0 }))
              .status,
            200,
          );
          assert.equal((await read()).gender, "female");
          assert.equal((await read()).count, 0);
          assert.equal((await read()).version, 1);
          assert.equal(
            (await call("PUT", 0, { gender: "female", expectedVersion: 0 }))
              .status,
            200,
          );
          assert.equal((await read()).version, 1);
        },
      );
      await t.test(
        "invalid, future, empty and owner-injected records do not persist",
        async () => {
          for (const measurements of [
            {},
            { weightKg: 0 },
            { heightCm: -1 },
            { chest: "" },
            { chest: 301 },
            { waist: "1.0001" },
          ])
            assert.equal(
              (await call("POST", 0, payload(measurements, 1))).status,
              400,
            );
          assert.equal(
            (
              await call("POST", 0, {
                ...payload({ waist: 90 }, 1),
                userId: users[1],
              })
            ).status,
            400,
          );
          assert.equal(
            (await call("POST", 0, payload({ waist: 90 }, 1, "2999-01-01")))
              .status,
            400,
          );
          assert.equal((await read()).count, 0);
        },
      );
      await t.test(
        "partial records, exact decimals and original measurement dates survive reloads",
        async () => {
          firstRequest = payload(
            {
              weightKg: "72,5",
              heightCm: "175",
              chest: "95,125",
              leftArm: "33",
            },
            1,
          );
          assert.equal((await call("POST", 0, firstRequest)).status, 201);
          assert.equal((await call("POST", 0, firstRequest)).status, 200);
          let overview = await read();
          assert.equal(overview.count, 1);
          assert.equal(overview.version, 2);
          assert.equal(overview.gender, "male");
          assert.equal(overview.latest.weightKg.value, 72.5);
          assert.equal(overview.latest.chest.value, 95.125);
          assert.equal(overview.latest.waist, undefined);
          assert.equal(overview.latest.leftArm.previous, null);
          assert.equal(
            (await call("POST", 0, payload({ waist: 85 }, 2, "2026-01-03")))
              .status,
            201,
          );
          overview = await read();
          assert.equal(overview.latest.weightKg.measuredOn, "2026-01-02");
          assert.equal(overview.latest.waist.measuredOn, "2026-01-03");
          assert.deepEqual(overview.records[0].measurements, { waist: 85 });
          assert.equal((await read(1)).count, 0);
        },
      );
      await t.test(
        "backdated entries and equal-date ties retain chronological latest and previous values",
        async () => {
          assert.equal(
            (await call("POST", 0, payload({ waist: 88 }, 3, "2026-01-01")))
              .status,
            201,
          );
          let overview = await read();
          assert.equal(overview.latest.waist.value, 85);
          assert.equal(overview.latest.waist.previous, 88);
          assert.equal(
            (await call("POST", 0, payload({ waist: 84 }, 4, "2026-01-03")))
              .status,
            201,
          );
          overview = await read();
          assert.equal(overview.latest.waist.value, 84);
          assert.equal(overview.latest.waist.previous, 85);
          assert.equal(
            (await call("POST", 0, payload({ weightKg: 73 }, 5, "2026-01-04")))
              .status,
            201,
          );
          assert.equal(
            (await call("POST", 0, payload({ weightKg: 74 }, 6, "2026-01-05")))
              .status,
            201,
          );
        },
      );
      await t.test(
        "history is paginated five at a time without exposing another account's cursor",
        async () => {
          const overview = await read();
          assert.equal(overview.count, 6);
          assert.equal(overview.records.length, 5);
          assert.ok(overview.nextCursor);
          const second = await (
            await call(
              "GET",
              0,
              undefined,
              "/api/body?before=" + overview.nextCursor,
            )
          ).json();
          assert.equal(second.records.length, 1);
          assert.equal(second.nextCursor, null);
          assert.equal(
            new Set(
              [...overview.records, ...second.records].map(
                (entry: any) => entry.id,
              ),
            ).size,
            6,
          );
          const foreign = await (
            await call(
              "GET",
              1,
              undefined,
              "/api/body?before=" + overview.nextCursor,
            )
          ).json();
          assert.deepEqual(foreign.records, []);
          assert.equal(
            (await call("GET", 0, undefined, "/api/body?userId=other")).status,
            400,
          );
        },
      );
      await t.test(
        "stale writes and concurrent edits cannot silently replace the profile",
        async () => {
          assert.equal(
            (await call("POST", 0, payload({ waist: 90 }, 0))).status,
            409,
          );
          const responses = await Promise.all([
            call("POST", 0, payload({ rightArm: 34 }, 7)),
            call("POST", 0, payload({ leftCalf: 38 }, 7)),
          ]);
          assert.deepEqual(
            responses.map((response) => response.status).sort(),
            [201, 409],
          );
          assert.equal((await read()).version, 8);
          assert.equal(
            (
              await call("POST", 0, {
                ...firstRequest,
                measurements: { waist: 99 },
              })
            ).status,
            409,
          );
        },
      );
      await t.test(
        "database constraints enforce measurement ranges, known metrics and account ownership",
        async () => {
          const overview = await read();
          const recordId = overview.records[0].id;
          for (const [owner, metric, amount, code] of [
            [users[1], "neck", 30, "23503"],
            [users[0], "invalid", 30, "23514"],
            [users[0], "neck", -1, "23514"],
          ] as const) {
            let actual: string | undefined;
            try {
              await sql`insert into body_measurement(record_id,user_id,metric,amount) values (${recordId},${owner},${metric},${amount})`;
            } catch (error) {
              actual = (error as { code?: string }).code;
            }
            assert.equal(actual, code);
          }
        },
      );
      await t.test(
        "deletion is owner-scoped, retries are idempotent and summaries fall back to earlier records",
        async () => {
          let overview = await read();
          const latestId = overview.records[0].id;
          assert.equal(
            (
              await call("DELETE", 1, {
                recordId: latestId,
                expectedVersion: 0,
              })
            ).status,
            200,
          );
          assert.equal((await read()).count, 7);
          assert.equal(
            (
              await call("DELETE", 0, {
                recordId: latestId,
                expectedVersion: 7,
              })
            ).status,
            409,
          );
          assert.equal(
            (
              await call("DELETE", 0, {
                recordId: latestId,
                expectedVersion: 8,
              })
            ).status,
            200,
          );
          overview = await read();
          assert.equal(overview.latest.weightKg.value, 73);
          assert.equal(overview.count, 6);
          assert.equal(overview.version, 9);
          assert.equal(
            (
              await call("DELETE", 0, {
                recordId: latestId,
                expectedVersion: 8,
              })
            ).status,
            200,
          );
          assert.equal((await read()).version, 9);
        },
      );
      await t.test(
        "removing all records leaves measurements empty and old retries cannot recreate deleted data",
        async () => {
          let overview = await read();
          while (overview.count) {
            const response = await call("DELETE", 0, {
              recordId: overview.records[0].id,
              expectedVersion: overview.version,
            });
            assert.equal(response.status, 200);
            overview = (await response.json()).overview;
          }
          assert.deepEqual(overview.latest, {});
          assert.equal(overview.gender, "male");
          assert.equal((await call("POST", 0, firstRequest)).status, 409);
          assert.equal((await read()).count, 0);
        },
      );
    } finally {
      for (const id of users)
        await db(sql`delete from auth_user where id=${id}`);
    }
  },
);
