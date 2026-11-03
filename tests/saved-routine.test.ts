import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDefaultRoutineDefinition,
  getWeekModel,
} from "../src/lib/routine.ts";
import { routineDefinitionSchema } from "../src/lib/routine-definition.ts";

test("the saved default preserves every exercise, note and ISO week for the entire year", () => {
  const definition = routineDefinitionSchema.parse(
    getDefaultRoutineDefinition(),
  );
  for (let day = 0; day < 740; day++) {
    const instant = new Date(Date.UTC(2026, 0, 1 + day, 15));
    const old = getWeekModel(instant);
    const saved = getWeekModel(instant, definition);
    assert.equal(saved.routine, old.routine);
    assert.equal(saved.todayKey, old.todayKey);
    assert.deepEqual(
      saved.days.map((d) => [d.activityId, d.exercises]),
      old.days.map((d) => [d.activityId, d.exercises]),
    );
  }
});

test("three-week cycles continue through New Year and use Bogota Monday midnight", () => {
  const routine = getDefaultRoutineDefinition();
  routine.scheduling = "continuous";
  routine.startDate = "2026-12-21";
  routine.weeks.push(structuredClone(routine.weeks[0]));
  assert.equal(
    getWeekModel(new Date("2026-12-21T15:00:00Z"), routine).routine,
    1,
  );
  assert.equal(
    getWeekModel(new Date("2026-12-28T15:00:00Z"), routine).routine,
    2,
  );
  assert.equal(
    getWeekModel(new Date("2027-01-04T04:59:59Z"), routine).routine,
    2,
  );
  assert.equal(
    getWeekModel(new Date("2027-01-04T05:00:00Z"), routine).routine,
    3,
  );
  assert.equal(
    getWeekModel(new Date("2027-01-11T15:00:00Z"), routine).routine,
    1,
  );
  assert.equal(
    getWeekModel(new Date("2026-12-14T15:00:00Z"), routine).routine,
    3,
  );
});

test("a one-week cycle repeats and custom training details come from saved data", () => {
  const routine = getDefaultRoutineDefinition();
  routine.scheduling = "continuous";
  routine.weeks = [routine.weeks[0]];
  routine.weeks[0].days[0].title = "Mi entrenamiento";
  routine.weeks[0].days[0].exercises[0].note = "Mi anotación";
  const model = getWeekModel(new Date("2027-01-04T15:00:00Z"), routine);
  assert.equal(model.routine, 1);
  assert.equal(model.days[0].activity?.title, "Mi entrenamiento");
  assert.equal(model.days[0].exerciseNotes?.[0], "Mi anotación");
});

test("routine validation rejects incomplete weeks, malformed dates, empty strength sessions and excess input", () => {
  const valid = getDefaultRoutineDefinition();
  const invalid = [
    { ...valid, name: " " },
    { ...valid, startDate: "2026-11-03" },
    { ...valid, startDate: "2026-02-30" },
    { ...valid, weeks: [] },
    { ...valid, weeks: Array(13).fill(valid.weeks[0]) },
    { ...valid, weeks: [valid.weeks[0]] },
    { ...valid, userId: "another-user" },
    {
      ...valid,
      weeks: [
        { ...valid.weeks[0], days: valid.weeks[0].days.slice(0, 6) },
        valid.weeks[1],
      ],
    },
  ];
  for (const input of invalid)
    assert.equal(routineDefinitionSchema.safeParse(input).success, false);
  const emptyStrength = structuredClone(valid);
  emptyStrength.weeks[0].days[0].exercises = [];
  assert.equal(routineDefinitionSchema.safeParse(emptyStrength).success, false);
  const restExercises = structuredClone(valid);
  restExercises.weeks[0].days[6].exercises = [{ name: "Ejercicio", note: "" }];
  assert.equal(routineDefinitionSchema.safeParse(restExercises).success, false);
});
