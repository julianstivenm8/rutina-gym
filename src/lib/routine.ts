export const TIME_ZONE = "America/Bogota";
const DAY_MS = 86_400_000;

export type ActivityId = "upper" | "lower" | "zone2" | "hiit" | "rest";

export type Activity = {
  id: ActivityId;
  title: string;
  calendarTitle: string;
  category: string;
  calendarMeta: string;
  description: string;
  color: "sage" | "lavender" | "coral";
};

export const ACTIVITIES: Record<ActivityId, Activity> = {
  upper: {
    id: "upper",
    title: "Fuerza de tren superior",
    calendarTitle: "Tren superior",
    category: "Fuerza",
    calendarMeta: "Tren superior",
    description: "Hoy corresponde la sesión de fuerza de tren superior.",
    color: "sage",
  },
  lower: {
    id: "lower",
    title: "Fuerza de tren inferior",
    calendarTitle: "Tren inferior",
    category: "Fuerza",
    calendarMeta: "Tren inferior",
    description: "Hoy corresponde la sesión de fuerza de tren inferior.",
    color: "sage",
  },
  zone2: {
    id: "zone2",
    title: "Cardio en zona 2",
    calendarTitle: "Cardio zona\u00a02",
    category: "Cardio",
    calendarMeta: "45–60 min",
    description: "Una sesión de cardio continuo en zona 2, de 45 a 60 minutos.",
    color: "sage",
  },
  hiit: {
    id: "hiit",
    title: "HIIT 4×4",
    calendarTitle: "HIIT 4×4",
    category: "Intervalos",
    calendarMeta: "4 intervalos",
    description: "Cuatro intervalos de 4 minutos intensos, con 3–4 minutos de recuperación entre intervalos.",
    color: "coral",
  },
  rest: {
    id: "rest",
    title: "Día de descanso",
    calendarTitle: "Descanso",
    category: "Recuperación",
    calendarMeta: "Recuperación",
    description: "Hoy no hay una sesión programada. Un espacio para descansar y recuperar.",
    color: "lavender",
  },
};

const SCHEDULES: Record<1 | 2, readonly ActivityId[]> = {
  1: ["upper", "zone2", "lower", "zone2", "upper", "hiit", "rest"],
  2: ["lower", "zone2", "upper", "zone2", "lower", "hiit", "rest"],
};
export const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export type WeekDay = {
  dateKey: string;
  dayNumber: number;
  name: string;
  fullDate: string;
  activityId: ActivityId;
};
export type WeekModel = {
  todayKey: string;
  todayIndex: number;
  isoWeek: number;
  isoYear: number;
  routine: 1 | 2;
  rangeLabel: string;
  days: WeekDay[];
};

function calendarKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** A UTC calendar date representing today's date in Colombia, not the host's date. */
export function getBogotaCalendarDate(instant: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => Number(parts.find((part) => part.type === type)!.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
}

/** ISO 8601: Monday first; week 1 contains the year's first Thursday. */
export function getISOWeek(calendarDate: Date): { week: number; year: number } {
  const thursday = new Date(calendarDate);
  thursday.setUTCHours(0, 0, 0, 0);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const year = thursday.getUTCFullYear();
  const firstDay = Date.UTC(year, 0, 1);
  return { week: Math.ceil(((thursday.getTime() - firstDay) / DAY_MS + 1) / 7), year };
}

export function getRoutineForWeek(isoWeek: number): 1 | 2 {
  return isoWeek % 2 === 0 ? 1 : 2;
}

export function getWeekModel(instant: Date = new Date()): WeekModel {
  const today = getBogotaCalendarDate(instant);
  const todayIndex = (today.getUTCDay() + 6) % 7;
  const monday = new Date(today.getTime() - todayIndex * DAY_MS);
  const iso = getISOWeek(today);
  const routine = getRoutineForWeek(iso.week);
  const fullDate = new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long",
  });
  const shortMonth = (date: Date) => new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC", month: "short",
  }).format(date).replace(".", "");
  const days: WeekDay[] = DAY_NAMES.map((name, index) => {
    const date = new Date(monday.getTime() + index * DAY_MS);
    return {
      dateKey: calendarKey(date),
      dayNumber: date.getUTCDate(),
      name,
      fullDate: fullDate.format(date),
      activityId: SCHEDULES[routine][index],
    };
  });
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth()
    && monday.getUTCFullYear() === sunday.getUTCFullYear();
  const startLabel = sameMonth ? String(monday.getUTCDate())
    : monday.getUTCDate() + " " + shortMonth(monday)
      + (monday.getUTCFullYear() !== sunday.getUTCFullYear() ? " " + monday.getUTCFullYear() : "");
  const rangeLabel = startLabel + " — " + sunday.getUTCDate() + " " + shortMonth(sunday)
    + ", " + sunday.getUTCFullYear();
  return {
    todayKey: calendarKey(today), todayIndex, isoWeek: iso.week, isoYear: iso.year,
    routine, rangeLabel, days,
  };
}
