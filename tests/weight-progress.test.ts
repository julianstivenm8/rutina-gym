import { test } from "node:test";
import assert from "node:assert/strict";
import {
  exerciseNameKey,
  weightValueSchema,
  weightRecordSchema,
  weightDeleteSchema,
  weightHistorySchema,
  weightChange,
  weightInUnit,
  type ExerciseProgress,
} from "../src/lib/weight-progress.ts";

test("optional weight accepts explicit zero and exact comma/dot decimals without inventing a default", () => {
  for (const [input, expected] of [
    ["0", "0.000"],
    ["12,5", "12.500"],
    ["12.125", "12.125"],
    [" 100 ", "100.000"],
    ["9999.999", "9999.999"],
  ]) {
    assert.equal(weightValueSchema.parse(input), expected);
  }
  for (const input of [
    "",
    " ",
    "-1",
    "Infinity",
    "NaN",
    "1e3",
    "1,234.5",
    "1.2345",
    "10000",
    10,
    null,
  ])
    assert.equal(weightValueSchema.safeParse(input).success, false);
});
test("weight requests cannot choose an owner, timestamp, invalid unit or a negative version", () => {
  const input = {
    routineId: "routine",
    exerciseId: "82cb5a62-fc8e-4b15-bf4a-be5e5d926171",
    requestId: "476044a5-fafe-41ae-a8d1-a79771f269a1",
    amount: "20",
    unit: "kg",
    expectedVersion: 0,
  };
  assert.equal(weightRecordSchema.safeParse(input).success, true);
  for (const changes of [
    { userId: "other" },
    { recordedAt: "2020-01-01" },
    { unit: "stone" },
    { expectedVersion: -1 },
    { exerciseId: "bad" },
  ])
    assert.equal(
      weightRecordSchema.safeParse({ ...input, ...changes }).success,
      false,
    );
});
test("progress compares entered units and treats lower loads neutrally", () => {
  const first = {
    id: "first",
    amount: "10",
    unit: "kg" as const,
    version: 1,
    recordedAt: "2026-11-04T10:00:00Z",
  };
  const latest = {
    ...first,
    id: "latest",
    amount: "22.046",
    unit: "lb" as const,
    version: 2,
  };
  const progress: ExerciseProgress = {
    id: "exercise",
    version: 2,
    count: 2,
    first,
    recent: [latest, first],
  };
  assert.ok(Math.abs(weightInUnit(latest, "kg") - 10) < 0.001);
  assert.equal(weightChange(progress, "kg"), 0);
  assert.equal(
    weightChange({ ...progress, recent: [{ ...first, amount: "8" }] }, "kg"),
    -2,
  );
  assert.equal(weightChange({ ...progress, version: 10, count: 1 }, "kg"), null);
  assert.equal(
    exerciseNameKey(" Pecho  en banco plano "),
    exerciseNameKey("pecho en banco plano"),
  );
  assert.notEqual(
    exerciseNameKey("Pecho Inclinado"),
    exerciseNameKey("Pecho en banco Inclinado"),
  );
});

test("deletion and history validate record identity, cursor boundaries and server-owned fields", () => {
  const input = {
    routineId: "routine",
    exerciseId: "82cb5a62-fc8e-4b15-bf4a-be5e5d926171",
    recordId: "476044a5-fafe-41ae-a8d1-a79771f269a1",
    expectedVersion: 8,
  };
  assert.equal(weightDeleteSchema.safeParse(input).success, true);
  for (const changes of [{ recordId: "bad" }, { userId: "other" }, { expectedVersion: -1 }])
    assert.equal(weightDeleteSchema.safeParse({ ...input, ...changes }).success, false);
  const query = { routineId: input.routineId, exerciseId: input.exerciseId };
  assert.equal(weightHistorySchema.parse({ ...query, beforeVersion: "6" }).beforeVersion, 6);
  for (const beforeVersion of ["", "0", "-1", "1.5", "NaN", "2147483648"])
    assert.equal(weightHistorySchema.safeParse({ ...query, beforeVersion }).success, false);
  assert.equal(weightHistorySchema.safeParse({ ...query, limit: "1000" }).success, false);
});
