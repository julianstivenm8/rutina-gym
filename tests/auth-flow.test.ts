import { test } from "node:test";
import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { readAuthEnvironment } from "../src/lib/auth-environment.ts";

// Opt-in: npm run test:auth loads .env.local and uses the running local app.
const target = process.env.AUTH_TEST_BASE_URL ?? process.env.BETTER_AUTH_URL;
const options = { skip: !target, timeout: 30_000 };

function localOrigin() {
  const url = new URL(target!);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Run integration tests against a local app only");
  return url.origin;
}

function request(path: string, init: RequestInit = {}) {
  return fetch(localOrigin() + path, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
}

test("real app redirects anonymous requests away from the routine", options, async () => {
  const response = await request("/");
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location")!, localOrigin()).pathname, "/iniciar-sesion");
});

test("real auth rejects an invented session cookie", options, async () => {
  const headers = { Cookie: "better-auth.session_token=invalid-session" };
  const session = await request("/api/auth/get-session", { headers });
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);
  const routine = await request("/", { headers });
  assert.equal(routine.status, 307);
  assert.equal(new URL(routine.headers.get("location")!, localOrigin()).pathname, "/iniciar-sesion");
});

test("real auth rejects cookie-bearing sign-in from an untrusted origin", options, async () => {
  const response = await request("/api/auth/sign-in/social", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://untrusted.example", Cookie: "better-auth.session_token=invalid-session" },
    body: JSON.stringify({ provider: "google", callbackURL: "/" }),
  });
  assert.equal(response.status, 403);
});

test("real auth rejects a Google callback URL outside trusted origins", options, async () => {
  const configuration = readAuthEnvironment();
  assert.ok(configuration.ready, "Complete the authentication environment before running this test");
  const response = await request("/api/auth/sign-in/social", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: configuration.values.BETTER_AUTH_URL },
    body: JSON.stringify({ provider: "google", callbackURL: "https://untrusted.example" }),
  });
  assert.equal(response.status, 403);
});

test("real Google sign-in persists OAuth state in Neon before redirecting", options, async () => {
  const configuration = readAuthEnvironment();
  assert.ok(configuration.ready, "Complete the authentication environment before running this test");
  const environment = configuration.values;
  const response = await request("/api/auth/sign-in/social", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: environment.BETTER_AUTH_URL },
    body: JSON.stringify({ provider: "google", callbackURL: "/", errorCallbackURL: "/iniciar-sesion?error=google" }),
  });
  assert.equal(response.status, 200, "Google sign-in must start successfully with the real database");
  const body = await response.json();
  assert.ok(typeof body.url === "string", "Expected a Google authorization URL");
  const authorization = new URL(body.url);
  const state = authorization.searchParams.get("state");
  assert.equal(authorization.origin, "https://accounts.google.com");
  assert.ok(authorization.searchParams.get("client_id") === environment.GOOGLE_CLIENT_ID, "Expected the configured Google client");
  assert.equal(authorization.searchParams.get("redirect_uri"), environment.BETTER_AUTH_URL + "/api/auth/callback/google");
  assert.ok(state && state.length >= 20, "Expected a random OAuth state");

  const sql = neon(environment.DATABASE_URL, { fetchOptions: { signal: AbortSignal.timeout(15_000) } });
  const identifier = "auth-state:" + state;
  try {
    const rows = await sql`select count(*)::int as count from public.auth_verification where identifier = ${identifier} and expires_at > now()`;
    assert.equal(rows[0].count, 1, "OAuth state must be persisted and unexpired");
  } catch {
    // Database errors may contain OAuth parameters; do not include them in test output.
    throw new Error("Could not confirm persisted OAuth state in Neon");
  } finally {
    try {
      await sql`delete from public.auth_verification where identifier = ${identifier}`;
    } catch {
      throw new Error("Could not remove this test's temporary OAuth state");
    }
  }
});
