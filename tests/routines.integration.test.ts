import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { makeSignature } from "better-auth/crypto";
import { getDefaultRoutineDefinition } from "../src/lib/routine.ts";

// Actual local HTTP requests, real Better Auth sessions and disposable database users.
// No authentication bypass or test endpoint is added to the application.
const base = process.env.AUTH_TEST_BASE_URL ?? process.env.BETTER_AUTH_URL;
test(
  "saved routines: persistence, account isolation, validation and concurrent activation",
  { skip: !base, timeout: 90_000 },
  async (t) => {
    assert.ok(
      ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base!).hostname),
      "Use a local application for integration tests",
    );
    assert.ok(
      process.env.DATABASE_URL &&
        process.env.BETTER_AUTH_SECRET &&
        process.env.BETTER_AUTH_URL,
    );
    const sql = neon(process.env.DATABASE_URL!);
    async function db<T>(query: PromiseLike<T>): Promise<T> {
      try {
        return await query;
      } catch {
        throw new Error(
          "Integration database operation failed; parameters are hidden",
        );
      }
    }
    const users = [
      "routine-test-" + randomUUID(),
      "routine-test-" + randomUUID(),
    ];
    const cookies: string[] = [];
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
        signal: AbortSignal.timeout(20_000),
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          ...(account === undefined ? {} : { Cookie: cookies[account] }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    }
    try {
      for (const userId of users) {
        await db(
          sql`insert into auth_user (id, name, email, email_verified) values (${userId}, 'Prueba de rutinas', ${userId + "@example.invalid"}, true)`,
        );
        const token = randomUUID();
        await db(
          sql`insert into auth_session (id, token, user_id, expires_at) values (${randomUUID()}, ${token}, ${userId}, ${new Date(Date.now() + 3600000).toISOString()})`,
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
      const definition = getDefaultRoutineDefinition();
      const initial: string[] = [];
      await t.test(
        "anonymous routes and mutations stay protected",
        async () => {
          for (const [path, method] of [
            ["/api/routines", "GET"],
            ["/api/routines", "POST"],
            ["/api/routines/missing", "PUT"],
            ["/api/routines/missing/activate", "POST"],
          ]) {
            assert.equal((await call(path, method)).status, 401);
          }
          assert.equal((await call("/rutinas")).status, 307);
          assert.equal((await call("/rutinas/nueva")).status, 307);
        },
      );
      await t.test(
        "every account receives its own unchanged default routine",
        async () => {
          for (let index = 0; index < users.length; index++) {
            const response = await call("/api/routines", "GET", index);
            assert.equal(response.status, 200);
            const body = await response.json();
            assert.equal(body.routines.length, 1);
            assert.equal(body.routines[0].active, true);
            const savedDefinition = structuredClone(
              body.routines[0].definition,
            );
            for (const week of savedDefinition.weeks)
              for (const day of week.days)
                for (const exercise of day.exercises) {
                  assert.equal(typeof exercise.id, "string");
                  delete exercise.id;
                }
            assert.deepEqual(savedDefinition, definition);
            initial.push(body.routines[0].id);
          }
          assert.notEqual(initial[0], initial[1]);
        },
      );
      assert.equal(
        initial.length,
        2,
        "Both default routines must be initialized before proceeding",
      );
      let createdId: string;
      await t.test(
        "the default routine opens in the editor with its encoded identifier",
        async () => {
          const path = "/rutinas/" + encodeURIComponent(initial[0]) + "/editar";
          const response = await call(path, "GET", 0);
          assert.equal(
            response.status,
            200,
            "The default routine's edit link must open its editor",
          );
          assert.ok(
            (await response.text()).includes("Dale forma a tu rutina."),
          );
          assert.equal(
            (
              await call(
                "/api/routines/" + encodeURIComponent(initial[0]),
                "GET",
                0,
              )
            ).status,
            200,
          );
          assert.equal(
            (await call("/rutinas/" + initial[0] + "/editar", "GET", 0)).status,
            200,
          );
          const edited = structuredClone(definition);
          edited.weeks[0].days[0].exercises[0].note =
            "Nota de prueba predeterminada";
          const apiPath = "/api/routines/" + encodeURIComponent(initial[0]);
          assert.equal(
            (
              await call(apiPath, "PUT", 0, {
                definition: edited,
                activate: false,
              })
            ).status,
            200,
          );
          assert.equal(
            (await (await call(apiPath, "GET", 0)).json()).definition.weeks[0]
              .days[0].exercises[0].note,
            "Nota de prueba predeterminada",
          );
          assert.ok(
            (await (await call(path, "GET", 0)).text()).includes(
              "Nota de prueba predeterminada",
            ),
          );
          assert.equal((await call(path, "GET", 1)).status, 404);
        },
      );
      await t.test(
        "create and read a saved routine without replacing the active one",
        async () => {
          const response = await call("/api/routines", "POST", 0, {
            definition: { ...definition, name: "Ciclo de prueba" },
            activate: false,
          });
          assert.equal(response.status, 201);
          createdId = (await response.json()).id;
          const saved = await call("/api/routines/" + createdId, "GET", 0);
          assert.equal((await saved.json()).definition.name, "Ciclo de prueba");
          const editor = await call(
            "/rutinas/" + encodeURIComponent(createdId) + "/editar",
            "GET",
            0,
          );
          assert.equal(
            editor.status,
            200,
            "The custom routine's editor must keep working",
          );
          assert.ok((await editor.text()).includes("Dale forma a tu rutina."));
          const list = await (await call("/api/routines", "GET", 0)).json();
          assert.equal(
            list.routines.find((routine: { active: boolean }) => routine.active)
              .id,
            initial[0],
          );
        },
      );
      assert.ok(createdId!, "Creation must succeed before testing isolation");
      await t.test(
        "another account cannot read, edit or activate a routine",
        async () => {
          const path = "/api/routines/" + createdId!;
          assert.equal((await call(path, "GET", 1)).status, 404);
          assert.equal(
            (await call(path, "PUT", 1, { definition, activate: true })).status,
            404,
          );
          assert.equal((await call(path + "/activate", "POST", 1)).status, 404);
          assert.equal(
            (
              await call(
                "/api/routines",
                "POST",
                0,
                { definition, activate: true },
                "https://untrusted.example",
              )
            ).status,
            403,
          );
        },
      );
      await t.test("invalid routines cannot be persisted", async () => {
        for (const invalid of [
          { ...definition, name: " " },
          { ...definition, startDate: "2026-11-03" },
          { ...definition, weeks: [] },
        ]) {
          assert.equal(
            (
              await call("/api/routines", "POST", 0, {
                definition: invalid,
                activate: true,
              })
            ).status,
            400,
          );
        }
      });
      await t.test(
        "editing and saving with activation persists the requested content",
        async () => {
          const updated = structuredClone(definition);
          updated.weeks[0].days[0].exercises[0].note = "Nota de prueba";
          assert.equal(
            (
              await call("/api/routines/" + createdId!, "PUT", 0, {
                definition: updated,
                activate: true,
              })
            ).status,
            200,
          );
          const list = await (await call("/api/routines", "GET", 0)).json();
          assert.equal(
            list.routines.find((routine: { active: boolean }) => routine.active)
              .id,
            createdId!,
          );
          assert.equal(
            list.routines.find(
              (routine: { id: string }) => routine.id === createdId!,
            ).definition.weeks[0].days[0].exercises[0].note,
            "Nota de prueba",
          );
        },
      );
      await t.test(
        "concurrent activations leave exactly one active routine",
        async () => {
          const responses = await Promise.all([
            call("/api/routines/" + initial[0] + "/activate", "POST", 0),
            call("/api/routines/" + createdId! + "/activate", "POST", 0),
          ]);
          assert.ok(responses.every((response) => response.status === 200));
          const list = await (await call("/api/routines", "GET", 0)).json();
          assert.equal(
            list.routines.filter(
              (routine: { active: boolean }) => routine.active,
            ).length,
            1,
          );
          const selections = await db(
            sql`select count(*)::int as count from routine_selection where user_id = ${users[0]}`,
          );
          assert.equal(selections[0].count, 1);
        },
      );
      await t.test(
        "the database itself rejects cross-account active selections",
        async () => {
          let rejected = false;
          try {
            await sql`update routine_selection set routine_id = ${initial[1]} where user_id = ${users[0]}`;
          } catch (error) {
            rejected = (error as { code?: string }).code === "23503";
          }
          assert.ok(
            rejected,
            "The composite ownership foreign key must reject the update",
          );
        },
      );
    } finally {
      for (const userId of users)
        await db(sql`delete from auth_user where id = ${userId}`);
    }
  },
);
