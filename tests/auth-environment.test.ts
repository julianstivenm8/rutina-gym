import { test } from "node:test";
import assert from "node:assert/strict";
import { readAuthEnvironment } from "../src/lib/auth-environment.ts";

const validEnvironment = {
  BETTER_AUTH_URL: "https://rutina.example.com/",
  BETTER_AUTH_SECRET: "a-test-secret-that-is-longer-than-thirty-two-characters",
  DATABASE_URL: "postgresql://test:test@db.example.com/rutina?sslmode=require",
  GOOGLE_CLIENT_ID: "test-client.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "test-google-secret",
};

test("auth configuration accepts a complete HTTPS origin and normalizes the callback base", () => {
  const result = readAuthEnvironment(validEnvironment);
  assert.equal(result.ready, true);
  if (result.ready) assert.equal(result.values.BETTER_AUTH_URL, "https://rutina.example.com");
});

test("auth configuration identifies missing fields without returning partial secrets", () => {
  const result = readAuthEnvironment({ BETTER_AUTH_SECRET: validEnvironment.BETTER_AUTH_SECRET });
  assert.equal(result.ready, false);
  if (!result.ready) {
    assert.deepEqual(result.invalidVariables.sort(), ["BETTER_AUTH_URL", "DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].sort());
    assert.ok(!JSON.stringify(result).includes(validEnvironment.BETTER_AUTH_SECRET));
  }
});

test("auth configuration allows HTTP only for local development origins", () => {
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
    assert.equal(readAuthEnvironment({ ...validEnvironment, BETTER_AUTH_URL: origin }).ready, true, origin);
  }
  assert.equal(readAuthEnvironment({ ...validEnvironment, BETTER_AUTH_URL: "http://rutina.example.com" }).ready, false);
});

test("auth configuration rejects ambiguous origins and malformed URLs without throwing", () => {
  for (const origin of ["not a URL", "https://user:password@rutina.example.com", "https://rutina.example.com/path", "https://rutina.example.com/?redirect=elsewhere", "https://rutina.example.com/#fragment", "javascript:alert(1)"]) {
    assert.equal(readAuthEnvironment({ ...validEnvironment, BETTER_AUTH_URL: origin }).ready, false, origin);
  }
});

test("auth configuration rejects weak secrets, absent provider credentials and non-Postgres URLs", () => {
  for (const changes of [
    { BETTER_AUTH_SECRET: "short" },
    { GOOGLE_CLIENT_ID: " " },
    { GOOGLE_CLIENT_SECRET: " " },
    { DATABASE_URL: "not a URL" },
    { DATABASE_URL: "https://db.example.com" },
  ]) {
    assert.equal(readAuthEnvironment({ ...validEnvironment, ...changes }).ready, false);
  }
});
