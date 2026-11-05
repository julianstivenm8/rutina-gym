import { test } from "node:test";
import assert from "node:assert/strict";
import {
  deleteAccountSchema,
  isRecentAccountSession,
  revokeOtherSessionsSchema,
  sessionDevice,
} from "../src/lib/account-settings.ts";

test("account deletion requires explicit confirmation and rejects target-owner injection", () => {
  assert.deepEqual(
    deleteAccountSchema.parse({
      confirmation: " ELIMINAR ",
      email: "User@Example.com",
    }),
    { confirmation: "ELIMINAR", email: "user@example.com" },
  );
  for (const input of [
    { confirmation: "eliminar", email: "user@example.com" },
    { confirmation: "", email: "user@example.com" },
    { confirmation: "ELIMINAR", email: "not-an-email" },
    { confirmation: "ELIMINAR", email: "user@example.com", userId: "other" },
  ])
    assert.equal(deleteAccountSchema.safeParse(input).success, false);
  assert.equal(
    revokeOtherSessionsSchema.safeParse({
      action: "revoke-others",
      userId: "other",
    }).success,
    false,
  );
});
test("recent account access expires exactly at ten minutes and invalid or future dates cannot authorize deletion", () => {
  const now = Date.parse("2026-11-05T17:00:00Z");
  assert.equal(isRecentAccountSession(new Date(now), now), true);
  assert.equal(isRecentAccountSession(new Date(now - 599999), now), true);
  assert.equal(isRecentAccountSession(new Date(now - 600000), now), false);
  assert.equal(isRecentAccountSession(new Date(now + 1), now), false);
  assert.equal(isRecentAccountSession("invalid", now), false);
});
test("session descriptions identify common browsers without exposing raw user agents or addresses", () => {
  assert.equal(
    sessionDevice(
      "Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36 Edg/140.0",
    ),
    "Edge en Windows",
  );
  assert.equal(
    sessionDevice(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Safari/604.1",
    ),
    "Safari en iOS",
  );
  assert.equal(
    sessionDevice(
      "Mozilla/5.0 (Linux; Android 15) Chrome/140.0 Mobile Safari/537.36",
    ),
    "Chrome en Android",
  );
  assert.equal(sessionDevice(null), "Dispositivo sin identificar");
});
