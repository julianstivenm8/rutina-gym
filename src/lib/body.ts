import { z } from "zod";

export const bodyGenders = ["unspecified", "male", "female"] as const;
export type BodyGender = (typeof bodyGenders)[number];
export const bodyMetrics = {
  weightKg: { label: "Peso", unit: "kg", group: "general", max: 600 },
  heightCm: { label: "Altura", unit: "cm", group: "general", max: 300 },
  neck: { label: "Cuello", unit: "cm", group: "torso", max: 300 },
  shoulders: { label: "Hombros", unit: "cm", group: "torso", max: 300 },
  chest: { label: "Pecho", unit: "cm", group: "torso", max: 300 },
  waist: { label: "Cintura", unit: "cm", group: "torso", max: 300 },
  hips: { label: "Cadera", unit: "cm", group: "torso", max: 300 },
  leftArm: { label: "Brazo izquierdo", unit: "cm", group: "arms", max: 300 },
  rightArm: { label: "Brazo derecho", unit: "cm", group: "arms", max: 300 },
  leftForearm: {
    label: "Antebrazo izquierdo",
    unit: "cm",
    group: "arms",
    max: 300,
  },
  rightForearm: {
    label: "Antebrazo derecho",
    unit: "cm",
    group: "arms",
    max: 300,
  },
  leftThigh: { label: "Muslo izquierdo", unit: "cm", group: "legs", max: 300 },
  rightThigh: { label: "Muslo derecho", unit: "cm", group: "legs", max: 300 },
  leftCalf: {
    label: "Pantorrilla izquierda",
    unit: "cm",
    group: "legs",
    max: 300,
  },
  rightCalf: {
    label: "Pantorrilla derecha",
    unit: "cm",
    group: "legs",
    max: 300,
  },
} as const;
export type BodyMetric = keyof typeof bodyMetrics;
export type BodyGroup = (typeof bodyMetrics)[BodyMetric]["group"];
export const metricKeys = Object.keys(bodyMetrics) as BodyMetric[];
export const bodyGroups: { id: BodyGroup; label: string; hint: string }[] = [
  { id: "general", label: "General", hint: "Peso y altura" },
  {
    id: "torso",
    label: "Tronco",
    hint: "Cuello, hombros, pecho, cintura y cadera",
  },
  { id: "arms", label: "Brazos", hint: "Brazo y antebrazo, por cada lado" },
  { id: "legs", label: "Piernas", hint: "Muslo y pantorrilla, por cada lado" },
];

function valueSchema(max: number) {
  return z
    .union([
      z.number(),
      z
        .string()
        .trim()
        .regex(
          /^\d{1,3}(?:[.,]\d{1,3})?$/,
          "Usa un número con hasta tres decimales.",
        )
        .transform((value) => Number(value.replace(",", "."))),
    ])
    .pipe(
      z
        .number()
        .positive("Debe ser mayor que cero.")
        .max(max, `El máximo es ${max}.`)
        .refine(
          (value) =>
            Math.abs(value * 1000 - Math.round(value * 1000)) < 0.000001,
          "Usa hasta tres decimales.",
        ),
    );
}
const perimeter = valueSchema(300);
export const bodyMeasurementsSchema = z
  .object({
    weightKg: valueSchema(600),
    heightCm: valueSchema(300),
    neck: perimeter,
    shoulders: perimeter,
    chest: perimeter,
    waist: perimeter,
    hips: perimeter,
    leftArm: perimeter,
    rightArm: perimeter,
    leftForearm: perimeter,
    rightForearm: perimeter,
    leftThigh: perimeter,
    rightThigh: perimeter,
    leftCalf: perimeter,
    rightCalf: perimeter,
  })
  .partial()
  .strict()
  .refine(
    (value) => Object.values(value).some((entry) => entry !== undefined),
    "Escribe al menos una medida para guardar.",
  );
export type BodyMeasurements = z.output<typeof bodyMeasurementsSchema>;
export function bogotaDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) =>
    parts.find((entry) => entry.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export const bodyDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value + "T12:00:00Z");
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "1900-01-01" &&
      value <= bogotaDay()
    );
  }, "Elige una fecha válida, de hoy o anterior.");
export const bodyRecordSchema = z
  .object({
    requestId: z.string().uuid(),
    expectedVersion: z.number().int().min(0).max(2147483646),
    gender: z.enum(bodyGenders),
    measuredOn: bodyDateSchema,
    measurements: bodyMeasurementsSchema,
  })
  .strict();
export const bodyDeleteSchema = z
  .object({
    recordId: z.string().uuid(),
    expectedVersion: z.number().int().min(0).max(2147483646),
  })
  .strict();
export const bodyProfileSchema = z
  .object({
    gender: z.enum(bodyGenders),
    expectedVersion: z.number().int().min(0).max(2147483646),
  })
  .strict();
export type BodyRecordInput = z.output<typeof bodyRecordSchema>;
export type BodyRecord = {
  id: string;
  measuredOn: string;
  gender: BodyGender;
  measurements: BodyMeasurements;
  createdAt: string;
};
export type BodyLatest = Partial<
  Record<
    BodyMetric,
    { value: number; measuredOn: string; previous: number | null }
  >
>;
export type BodyOverview = {
  gender: BodyGender;
  version: number;
  latest: BodyLatest;
  count: number;
  records: BodyRecord[];
  nextCursor: string | null;
};
export function bodyBmiValue(weightKg?: number, heightCm?: number) {
  if (
    !weightKg ||
    !heightCm ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightCm) ||
    weightKg <= 0 ||
    heightCm <= 0
  )
    return null;
  const value = (weightKg * 10000) / heightCm ** 2;
  return Number.isFinite(value) && value > 0 ? value : null;
}
export function bodyBmi(weightKg?: number, heightCm?: number) {
  const value = bodyBmiValue(weightKg, heightCm);
  return value === null ? null : Math.round(value * 10) / 10;
}
export const adultBmiRanges = [
  { id: "underweight", label: "Bajo peso", range: "Menos de 18,5", max: 18.5 },
  { id: "normal", label: "Peso normal", range: "18,5 a menos de 25", max: 25 },
  { id: "overweight", label: "Sobrepeso", range: "25 a menos de 30", max: 30 },
  { id: "obesity", label: "Obesidad", range: "30 o más", max: Infinity },
] as const;
export function adultBmiCategory(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  return adultBmiRanges.find((range) => value < range.max)!;
}
export function bodyNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 }).format(
    value,
  );
}
export function bodyDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value + "T12:00:00Z"));
}
