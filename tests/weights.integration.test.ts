import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { makeSignature } from "better-auth/crypto";

const base = process.env.AUTH_TEST_BASE_URL ?? process.env.BETTER_AUTH_URL;
test(
  "exercise weights: optional records, history, identity, ownership, retries and concurrent changes",
  { skip: !base, timeout: 120_000 },
  async (t) => {
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base!).hostname),
      "Use a local app only",
    );
    const sql = neon(process.env.DATABASE_URL!);
    const users = [
      "weight-test-" + randomUUID(),
      "weight-test-" + randomUUID(),
    ];
    const cookies: string[] = [];
    const routines: { id: string; definition: any }[] = [];
    async function db<T>(query: PromiseLike<T>) {
      try {
        return await query;
      } catch {
        throw new Error(
          "Weight test database operation failed; parameters hidden",
        );
      }
    }
    async function call(
      path: string,
      method = "GET",
      account?: number,
      body?: unknown,
      origin = process.env.BETTER_AUTH_URL!,
    ) {
      return fetch(base + path, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(25_000),
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...(account === undefined ? {} : { Cookie: cookies[account] }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    }
    try {
      for (let index = 0; index < users.length; index++) {
        const id = users[index],
          token = randomUUID();
        await db(
          sql`insert into auth_user(id,name,email,email_verified) values (${id},'Prueba de pesos',${id + "@example.invalid"},true)`,
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
        const response = await call("/api/routines", "GET", index);
        assert.equal(response.status, 200);
        routines.push((await response.json()).routines[0]);
      }
      const exerciseId =
        routines[0].definition.weeks[0].days[0].exercises[0].id;
      const otherId = routines[1].definition.weeks[0].days[0].exercises[0].id;
      const scope =
        "/api/weights?routineId=" + encodeURIComponent(routines[0].id);
      const payload = (
        amount: string,
        expectedVersion: number,
        requestId = randomUUID(),
        unit = "kg",
      ) => ({
        routineId: routines[0].id,
        exerciseId,
        amount,
        unit,
        expectedVersion,
        requestId,
      });
      const read = async () => {
        const response = await call(scope, "GET", 0);
        assert.equal(response.status, 200);
        return (await response.json()).progress.find(
          (entry: { id: string }) => entry.id === exerciseId,
        );
      };
      await t.test(
        "no initial weights are generated and repeated exercises share their identity",
        async () => {
          const response = await call(scope, "GET", 0);
          assert.equal(response.status, 200);
          const progress = (await response.json()).progress;
          assert.ok(
            progress.length > 0 &&
              progress.every(
                (entry: any) =>
                  entry.version === 0 &&
                  entry.first === null &&
                  entry.recent.length === 0,
              ),
          );
          assert.equal(
            exerciseId,
            routines[0].definition.weeks[1].days[2].exercises[0].id,
          );
          assert.notEqual(exerciseId, otherId);
        },
      );
      await t.test(
        "anonymous users, other accounts and untrusted origins cannot read or write weights",
        async () => {
          assert.equal((await call(scope)).status, 401);
          assert.equal(
            (await call("/api/weights", "POST", undefined, payload("10", 0)))
              .status,
            401,
          );
          assert.equal((await call(scope, "GET", 1)).status, 404);
          assert.equal(
            (await call("/api/weights", "POST", 1, payload("10", 0))).status,
            404,
          );
          assert.equal(
            (
              await call("/api/weights", "POST", 0, {
                ...payload("10", 0),
                exerciseId: otherId,
              })
            ).status,
            404,
          );
          assert.equal(
            (
              await call(
                "/api/weights",
                "POST",
                0,
                payload("10", 0),
                "https://untrusted.example",
              )
            ).status,
            403,
          );
        },
      );
      await t.test(
        "blank and invalid inputs cannot become history records",
        async () => {
          for (const amount of ["", "-5", "NaN", "10000", "1.0001"])
            assert.equal(
              (await call("/api/weights", "POST", 0, payload(amount, 0)))
                .status,
              400,
            );
          assert.equal(
            (
              await call("/api/weights", "POST", 0, {
                ...payload("10", 0),
                recordedAt: "2020-01-01",
              })
            ).status,
            400,
          );
          assert.equal((await read()).version, 0);
        },
      );
      const firstRequest = payload("12,5", 0);
      let firstId: string;
      await t.test(
        "decimal weights persist with server timestamps and an immutable initial record",
        async () => {
          const response = await call("/api/weights", "POST", 0, firstRequest);
          assert.equal(response.status, 201);
          const progress = (await response.json()).progress;
          firstId = progress.first.id;
          assert.equal(progress.first.amount, "12.500");
          assert.equal(progress.version, 1);
          assert.ok(
            Number.isFinite(new Date(progress.first.recordedAt).getTime()),
          );
          assert.equal((await read()).recent[0].amount, "12.500");
        },
      );
      const secondRequest = payload("15", 1);
      await t.test(
        "increments append records; duplicate values and retried requests do not inflate history",
        async () => {
          assert.equal(
            (await call("/api/weights", "POST", 0, secondRequest)).status,
            201,
          );
          assert.equal(
            (await call("/api/weights", "POST", 0, secondRequest)).status,
            200,
          );
          assert.equal(
            (await call("/api/weights", "POST", 0, payload("15.0", 2))).status,
            200,
          );
          const progress = await read();
          assert.equal(progress.version, 2);
          assert.equal(progress.first.id, firstId!);
          assert.deepEqual(
            progress.recent.map((entry: any) => entry.amount),
            ["15.000", "12.500"],
          );
          assert.equal(
            (
              await call("/api/weights", "POST", 0, {
                ...secondRequest,
                amount: "99",
              })
            ).status,
            409,
          );
        },
      );
      await t.test(
        "stale and simultaneous writes cannot overwrite a newer weight",
        async () => {
          assert.equal(
            (await call("/api/weights", "POST", 0, payload("20", 1))).status,
            409,
          );
          const responses = await Promise.all([
            call("/api/weights", "POST", 0, payload("20", 2)),
            call("/api/weights", "POST", 0, payload("25", 2)),
          ]);
          assert.deepEqual(
            responses.map((response) => response.status).sort(),
            [201, 409],
          );
          assert.equal((await read()).version, 3);
        },
      );
      await t.test(
        "history retains original units and all records beyond the latest-five preview",
        async () => {
          assert.equal(
            (
              await call(
                "/api/weights",
                "POST",
                0,
                payload("50", 3, randomUUID(), "lb"),
              )
            ).status,
            201,
          );
          assert.equal((await read()).recent[0].unit, "lb");
          for (let version = 4; version < 8; version++)
            assert.equal(
              (
                await call(
                  "/api/weights",
                  "POST",
                  0,
                  payload(String(20 + version), version),
                )
              ).status,
              201,
            );
          const progress = await read();
          assert.equal(progress.version, 8);
          assert.equal(progress.recent.length, 5);
          assert.equal(progress.first.id, firstId!);
          const [row] = await db(
            sql`select count(*)::int as count from exercise_weight where user_id=${users[0]} and exercise_id=${exerciseId}`,
          );
          assert.equal(row.count, 8);
        },
      );
      await t.test(
        "renaming, reordering and sharing an exercise with another owned routine preserve its history",
        async () => {
          const updated = structuredClone(routines[0].definition);
          const exercises = updated.weeks[0].days[0].exercises;
          exercises[0].name = "Nombre corregido";
          exercises.push(exercises.shift());
          assert.equal(
            (
              await call(
                "/api/routines/" + encodeURIComponent(routines[0].id),
                "PUT",
                0,
                { definition: updated, activate: false },
              )
            ).status,
            200,
          );
          assert.equal((await read()).version, 8);
          const cloneResponse = await call("/api/routines", "POST", 0, {
            definition: { ...updated, name: "Otra rutina de prueba" },
            activate: false,
          });
          assert.equal(cloneResponse.status, 201);
          const cloneId = (await cloneResponse.json()).id;
          const entries = (
            await (
              await call(
                "/api/weights?routineId=" + encodeURIComponent(cloneId),
                "GET",
                0,
              )
            ).json()
          ).progress;
          assert.equal(
            entries.find((entry: any) => entry.id === exerciseId).version,
            8,
          );
          updated.weeks[0].days[0].exercises[0].id = otherId;
          assert.equal(
            (
              await call("/api/routines", "POST", 0, {
                definition: updated,
                activate: false,
              })
            ).status,
            400,
          );
        },
      );
      await t.test(
        "zero is a deliberate saved weight and the database enforces ownership itself",
        async () => {
          const ownId = routines[1].definition.weeks[0].days[0].exercises[0].id;
          assert.equal(
            (
              await call("/api/weights", "POST", 1, {
                ...payload("0", 0),
                routineId: routines[1].id,
                exerciseId: ownId,
              })
            ).status,
            201,
          );
          let rejected = false;
          try {
            await sql`insert into exercise_weight(id,user_id,exercise_id,request_id,amount,unit,version,routine_id,routine_name,exercise_name) values (${randomUUID()},${users[0]},${ownId},${randomUUID()},10,'kg',99,${routines[0].id},'Prueba','Prueba')`;
          } catch (error) {
            rejected = (error as { code?: string }).code === "23503";
          }
          assert.ok(rejected);
        },
      );
      const historyScope = "/api/weights/history?" + new URLSearchParams({ routineId: routines[0].id, exerciseId });
      const deletion = (recordId: string, expectedVersion: number) => ({ routineId: routines[0].id, exerciseId, recordId, expectedVersion });
      await t.test("history loads five entries at a time without duplicates and enforces ownership", async () => {
        assert.equal((await call(historyScope)).status, 401);
        assert.equal((await call(historyScope, "GET", 1)).status, 404);
        assert.equal((await call(historyScope + "&beforeVersion=0", "GET", 0)).status, 400);
        const first = await (await call(historyScope, "GET", 0)).json();
        assert.equal(first.progress.count, 8);
        assert.equal(first.entries.length, 5);
        assert.equal(first.nextCursor, 4);
        const second = await (await call(historyScope + "&beforeVersion=" + first.nextCursor, "GET", 0)).json();
        assert.equal(second.entries.length, 3);
        assert.equal(second.nextCursor, null);
        const all = [...first.entries, ...second.entries];
        assert.deepEqual(all.map((entry: any) => entry.version), [8, 7, 6, 5, 4, 3, 2, 1]);
        assert.equal(new Set(all.map((entry: any) => entry.id)).size, 8);
      });
      await t.test("deletion rejects unauthenticated, foreign, malformed and cross-origin requests", async () => {
        const body = deletion(firstId!, 8);
        assert.equal((await call("/api/weights", "DELETE", undefined, body)).status, 401);
        assert.equal((await call("/api/weights", "DELETE", 1, body)).status, 404);
        assert.equal((await call("/api/weights", "DELETE", 0, { ...body, exerciseId: otherId })).status, 404);
        assert.equal((await call("/api/weights", "DELETE", 0, { ...body, userId: users[1] })).status, 400);
        assert.equal((await call("/api/weights", "DELETE", 0, body, "https://untrusted.example")).status, 403);
        const [foreign] = await db(sql`select id from exercise_weight where user_id=${users[1]} limit 1`);
        await call("/api/weights", "DELETE", 0, deletion(foreign.id, 8));
        const [remaining] = await db(sql`select count(*)::int as count from exercise_weight where id=${foreign.id}`);
        assert.equal(remaining.count, 1);
        assert.equal((await read()).count, 8);
      });
      await t.test("deleting middle, first and latest records updates summaries and retries are harmless", async () => {
        const older = await (await call(historyScope + "&beforeVersion=4", "GET", 0)).json();
        const middleId = older.entries[0].id;
        assert.equal((await call("/api/weights", "DELETE", 0, deletion(middleId, 7))).status, 409);
        const middle = await call("/api/weights", "DELETE", 0, deletion(middleId, 8));
        assert.equal(middle.status, 200);
        let progress = (await middle.json()).progress;
        assert.equal(progress.version, 9);
        assert.equal(progress.count, 7);
        assert.equal(progress.first.id, firstId!);
        assert.equal(progress.recent[0].version, 8);
        assert.equal((await call("/api/weights", "DELETE", 0, deletion(middleId, 8))).status, 200);
        assert.equal((await read()).version, 9);
        assert.equal((await call("/api/weights", "DELETE", 0, deletion(firstId!, 9))).status, 200);
        progress = await read();
        assert.equal(progress.first.version, 2);
        assert.equal(progress.count, 6);
        assert.equal((await call("/api/weights", "DELETE", 0, deletion(progress.recent[0].id, 10))).status, 200);
        progress = await read();
        assert.equal(progress.version, 11);
        assert.equal(progress.count, 5);
        assert.equal(progress.recent[0].version, 7);
        const page = await (await call(historyScope, "GET", 0)).json();
        assert.equal(page.nextCursor, null);
        assert.deepEqual(page.entries.map((entry: any) => entry.version), [7, 6, 5, 4, 2]);
      });
      await t.test("simultaneous deletion and save cannot both apply an outdated change", async () => {
        const progress = await read();
        const results = await Promise.all([
          call("/api/weights", "DELETE", 0, deletion(progress.recent[2].id, progress.version)),
          call("/api/weights", "POST", 0, payload("99", progress.version)),
        ]);
        const statuses = results.map((result) => result.status);
        assert.equal(statuses.filter((status) => status === 409).length, 1);
        assert.equal(statuses.filter((status) => status === 200 || status === 201).length, 1);
        assert.equal((await read()).version, 12);
      });
      await t.test("all records can be removed; versions never reset and old save retries cannot resurrect deleted weights", async () => {
        let progress = await read();
        while (progress.count) {
          const response = await call("/api/weights", "DELETE", 0, deletion(progress.recent[0].id, progress.version));
          assert.equal(response.status, 200);
          const updated = (await response.json()).progress;
          assert.equal(updated.count, progress.count - 1);
          assert.equal(updated.version, progress.version + 1);
          progress = updated;
        }
        assert.equal(progress.first, null);
        assert.deepEqual(progress.recent, []);
        assert.equal((await call("/api/weights", "POST", 0, firstRequest)).status, 409);
        assert.equal((await read()).count, 0);
        const empty = await (await call(historyScope, "GET", 0)).json();
        assert.deepEqual(empty.entries, []);
        assert.equal(empty.nextCursor, null);
        assert.equal((await call("/api/weights", "POST", 0, payload("0", progress.version))).status, 201);
        assert.equal((await read()).count, 1);
        assert.equal((await read()).version, progress.version + 1);
      });
    } finally {
      for (const id of users)
        await db(sql`delete from auth_user where id=${id}`);
    }
  },
);
