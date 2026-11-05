import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bodyBmi,
  bodyBmiValue,
  adultBmiCategory,
  bodyDateSchema,
  bodyMeasurementsSchema,
  bodyRecordSchema,
  bogotaDay,
} from "../src/lib/body.ts";

test("body measurements remain optional and support exact metric decimals without invented defaults", () => {
  assert.deepEqual(bodyMeasurementsSchema.parse({ chest: "95,125" }), {
    chest: 95.125,
  });
  assert.deepEqual(
    bodyMeasurementsSchema.parse({ weightKg: 72.5, heightCm: "175" }),
    { weightKg: 72.5, heightCm: 175 },
  );
  for (const input of [
    {},
    { waist: "" },
    { weightKg: 0 },
    { chest: -2 },
    { weightKg: 601 },
    { heightCm: 301 },
    { chest: "1e2" },
    { chest: "3.0001" },
    { chest: Infinity },
    { bodyFat: 10 },
  ])
    assert.equal(bodyMeasurementsSchema.safeParse(input).success, false);
});
test("body records accept dated partial entries but reject ownership and server timestamp injection", () => {
  const input = {
    requestId: "476044a5-fafe-41ae-a8d1-a79771f269a1",
    expectedVersion: 0,
    gender: "unspecified",
    measuredOn: "2026-01-01",
    measurements: { leftArm: "33,5" },
  };
  assert.equal(bodyRecordSchema.safeParse(input).success, true);
  for (const changes of [
    { userId: "other" },
    { createdAt: "2020-01-01" },
    { expectedVersion: -1 },
    { gender: "invalid" },
    { measuredOn: "2026-02-29" },
    { measuredOn: "2999-01-01" },
  ])
    assert.equal(
      bodyRecordSchema.safeParse({ ...input, ...changes }).success,
      false,
    );
});
test("body dates use Bogota boundaries and reject impossible calendar dates", () => {
  assert.equal(bogotaDay(new Date("2026-11-05T04:59:59Z")), "2026-11-04");
  assert.equal(bogotaDay(new Date("2026-11-05T05:00:00Z")), "2026-11-05");
  assert.equal(bodyDateSchema.safeParse("2024-02-29").success, true);
  assert.equal(bodyDateSchema.safeParse("2025-02-29").success, false);
  assert.equal(bodyDateSchema.safeParse("2026-04-31").success, false);
});
test("BMI uses kilograms and centimeters without assumptions about missing values", () => {
  assert.equal(bodyBmi(72, 180), 22.2);
  assert.equal(bodyBmi(80, 160), 31.3);
  assert.equal(bodyBmi(undefined, 175), null);
  assert.equal(bodyBmi(70, undefined), null);
  assert.equal(bodyBmi(70, 0), null);
  assert.equal(bodyBmi(NaN, 175), null);
});

test("adult BMI categories respect exact cutoffs and use the unrounded value", () => {
  for (const [value, category] of [
    [18.499999, "underweight"],
    [18.5, "normal"],
    [24.999999, "normal"],
    [25, "overweight"],
    [29.999999, "overweight"],
    [30, "obesity"],
    [40, "obesity"],
  ] as const)
    assert.equal(adultBmiCategory(value)?.id, category);
  for (const value of [null, 0, -1, NaN, Infinity])
    assert.equal(adultBmiCategory(value), null);
  assert.equal(bodyBmi(24.96, 100), 25);
  assert.equal(adultBmiCategory(bodyBmiValue(24.96, 100))?.id, "normal");
  assert.equal(bodyBmi(87, 183), 26);
  assert.equal(adultBmiCategory(bodyBmiValue(87, 183))?.label, "Sobrepeso");
  assert.equal(adultBmiCategory(bodyBmiValue(undefined, 183)), null);
});
