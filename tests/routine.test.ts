import { test } from "node:test";
import assert from "node:assert/strict";
import { getWeekModel, getRoutineForWeek, getBogotaCalendarDate } from "../src/lib/routine.ts";

test("ISO even week 44 selects routine 1 and its seven activities", () => {
  const week = getWeekModel(new Date("2026-10-29T15:00:00Z"));
  assert.equal(week.isoWeek, 44);
  assert.equal(week.isoYear, 2026);
  assert.equal(week.routine, 1);
  assert.deepEqual(week.days.map(day => day.activityId), ["upper", "zone2", "lower", "zone2", "upper", "hiit", "rest"]);
  assert.equal(week.days[0].dateKey, "2026-10-26");
  assert.equal(week.days[6].dateKey, "2026-11-01");
  assert.equal(week.todayIndex, 3);
});

test("ISO odd week 45 selects routine 2 with lower-body Monday and Friday", () => {
  const week = getWeekModel(new Date("2026-11-02T15:00:00Z"));
  assert.equal(week.isoWeek, 45);
  assert.equal(week.routine, 2);
  assert.deepEqual(week.days.map(day => day.activityId), ["lower", "zone2", "upper", "zone2", "lower", "hiit", "rest"]);
});

test("routine 1 keeps the spreadsheet's distinct Monday and Friday upper-body sessions", () => {
  const { days } = getWeekModel(new Date("2026-10-29T15:00:00Z"));
  assert.equal(days[0].exercises[1], "Pecho  en banco Inclinado");
  assert.equal(days[0].exercises.at(-1), "Hombro press militar");
  assert.equal(days[4].exercises[1], "Pecho con polea");
  assert.equal(days[4].exercises[3], "Espalda con polea");
  assert.equal(days[4].exercises.at(-1), "Hombro laterales");
  assert.notDeepEqual(days[0].exercises, days[4].exercises);
});

test("routine 2 assigns lower-body lists to Monday and Friday and its own upper-body list to Wednesday", () => {
  const { days } = getWeekModel(new Date("2026-11-02T15:00:00Z"));
  assert.equal(days[0].exercises[0], "Abductores");
  assert.equal(days[0].exercises.at(-1), "Abdominales");
  assert.deepEqual(days[0].exercises, days[4].exercises);
  assert.equal(days[2].exercises[1], "Pecho Inclinado");
  assert.equal(days[2].exercises[7], "Bicep en mancuerna en banco inclinado");
  assert.notDeepEqual(days[0].exercises, days[2].exercises);
});

test("both routines provide nine names only on strength days", () => {
  for (const instant of ["2026-10-29T15:00:00Z", "2026-11-02T15:00:00Z"]) {
    const { days } = getWeekModel(new Date(instant));
    for (const day of days) {
      const isStrength = day.activityId === "upper" || day.activityId === "lower";
      assert.equal(day.exercises.length, isStrength ? 9 : 0, day.fullDate);
    }
  }
});

test("the calendar remains on Colombia's Sunday after UTC has crossed into Monday", () => {
  const week = getWeekModel(new Date("2026-11-02T04:59:59.999Z"));
  assert.equal(week.todayKey, "2026-11-01");
  assert.equal(week.todayIndex, 6);
  assert.equal(week.isoWeek, 44);
  assert.equal(week.routine, 1);
});

test("the routine changes at Monday midnight in Colombia", () => {
  const week = getWeekModel(new Date("2026-11-02T05:00:00Z"));
  assert.equal(week.todayKey, "2026-11-02");
  assert.equal(week.todayIndex, 0);
  assert.equal(week.isoWeek, 45);
  assert.equal(week.routine, 2);
});

test("ISO week 53 followed by ISO week 1 repeats routine 2", () => {
  const end = getWeekModel(new Date("2021-01-03T15:00:00Z"));
  const start = getWeekModel(new Date("2021-01-04T15:00:00Z"));
  assert.equal(end.isoWeek, 53);
  assert.equal(end.isoYear, 2020);
  assert.equal(start.isoWeek, 1);
  assert.equal(start.isoYear, 2021);
  assert.equal(end.routine, 2);
  assert.equal(start.routine, 2);
});

test("late December can belong to ISO week 1 of the following year", () => {
  const week = getWeekModel(new Date("2025-12-29T15:00:00Z"));
  assert.equal(week.isoWeek, 1);
  assert.equal(week.isoYear, 2026);
  assert.equal(week.routine, 2);
  assert.equal(week.days[0].dateKey, "2025-12-29");
  assert.equal(week.days[6].dateKey, "2026-01-04");
  assert.match(week.rangeLabel, /2025/);
  assert.match(week.rangeLabel, /2026/);
});

test("month boundaries do not reset the alternation", () => {
  const sunday = getWeekModel(new Date("2026-10-31T15:00:00Z"));
  const nextDay = getWeekModel(new Date("2026-11-01T15:00:00Z"));
  assert.equal(sunday.isoWeek, nextDay.isoWeek);
  assert.equal(sunday.routine, nextDay.routine);
  assert.equal(nextDay.days[0].dateKey, "2026-10-26");
});

test("the October 5 date is not an anchor: ISO week 41 uses routine 2", () => {
  const week = getWeekModel(new Date("2026-10-05T15:00:00Z"));
  assert.equal(week.isoWeek, 41);
  assert.equal(week.routine, 2);
});

test("all ISO week numbers use their own parity", () => {
  for (let week = 1; week <= 53; week++) assert.equal(getRoutineForWeek(week), week % 2 === 0 ? 1 : 2);
});

test("Bogota calendar date is independent of the input timestamp's offset", () => {
  assert.equal(getBogotaCalendarDate(new Date("2026-10-29T00:30:00+09:00")).toISOString(), "2026-10-28T00:00:00.000Z");
  assert.equal(getBogotaCalendarDate(new Date("2026-10-29T00:30:00-05:00")).toISOString(), "2026-10-29T00:00:00.000Z");
});
