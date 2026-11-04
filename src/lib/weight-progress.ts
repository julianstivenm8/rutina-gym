import { z } from "zod";

export const weightValueSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^\d{1,4}(?:[.,]\d{1,3})?$/.test(value),
    "Escribe un peso entre 0 y 9999,999, con hasta tres decimales.",
  )
  .transform((value) => Number(value.replace(",", ".")).toFixed(3));
export const weightFormSchema = z.object({
  amount: weightValueSchema,
  unit: z.enum(["kg", "lb"]),
});
export const weightRecordSchema = weightFormSchema
  .extend({
    routineId: z.string().min(1).max(200),
    exerciseId: z.string().uuid(),
    requestId: z.string().uuid(),
    expectedVersion: z.number().int().min(0).max(2147483646),
  })
  .strict();
export type WeightInput = z.infer<typeof weightRecordSchema>;
export const weightDeleteSchema = z.object({
  routineId: z.string().min(1).max(200),
  exerciseId: z.string().uuid(),
  recordId: z.string().uuid(),
  expectedVersion: z.number().int().min(0).max(2147483646),
}).strict();
export const weightHistorySchema = z.object({
  routineId: z.string().min(1).max(200),
  exerciseId: z.string().uuid(),
  beforeVersion: z.coerce.number().int().min(1).max(2147483647).optional(),
}).strict();
export type WeightDeleteInput = z.infer<typeof weightDeleteSchema>;
export type WeightUnit = "kg" | "lb";
export type WeightRecord = {
  id: string;
  amount: string;
  unit: WeightUnit;
  version: number;
  recordedAt: string;
};
export type ExerciseProgress = {
  id: string;
  version: number;
  count: number;
  first: WeightRecord | null;
  recent: WeightRecord[];
};
export type ProgressMap = Record<string, ExerciseProgress>;
export type WeightHistoryPage = {
  progress: ExerciseProgress;
  entries: WeightRecord[];
  nextCursor: number | null;
};
export function exerciseNameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}
export function weightInUnit(
  record: Pick<WeightRecord, "amount" | "unit">,
  unit: WeightUnit,
) {
  const amount = Number(record.amount);
  return record.unit === unit
    ? amount
    : unit === "kg"
      ? amount * 0.45359237
      : amount / 0.45359237;
}
export function formatWeight(value: number | string) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 }).format(
    Number(value),
  );
}
export function weightChange(progress: ExerciseProgress, unit: WeightUnit) {
  if (!progress.first || !progress.recent[0] || progress.count < 2)
    return null;
  return (
    Math.round(
      (weightInUnit(progress.recent[0], unit) -
        weightInUnit(progress.first, unit)) *
        1000,
    ) / 1000 || 0
  );
}
