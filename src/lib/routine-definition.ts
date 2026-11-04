import { z } from "zod";

export const activityIds = [
  "upper",
  "lower",
  "strength",
  "zone2",
  "hiit",
  "cardio",
  "rest",
] as const;
const requiredText = (max: number) =>
  z
    .string()
    .max(max, "Usa hasta " + max + " caracteres.")
    .refine((value) => value.trim().length > 0, "Escribe un nombre.");
export const exerciseSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: requiredText(200),
    note: z.string().max(500, "Usa hasta 500 caracteres en las notas."),
  })
  .strict();
export const trainingDaySchema = z
  .object({
    activityId: z.enum(activityIds),
    title: requiredText(100),
    description: z
      .string()
      .max(1500, "Usa hasta 1500 caracteres en las notas del día."),
    duration: z
      .string()
      .max(100, "Usa hasta 100 caracteres para la duración o estructura."),
    exercises: z
      .array(exerciseSchema)
      .max(50, "Puedes añadir hasta 50 ejercicios por día."),
  })
  .strict()
  .superRefine((day, ctx) => {
    const strength = ["upper", "lower", "strength"].includes(day.activityId);
    if (strength && day.exercises.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["exercises"],
        message:
          "Añade al menos un ejercicio para este entrenamiento de fuerza.",
      });
    if (!strength && day.exercises.length > 0)
      ctx.addIssue({
        code: "custom",
        path: ["exercises"],
        message: "Los ejercicios se añaden a los entrenamientos de fuerza.",
      });
  });

export const routineDefinitionSchema = z
  .object({
    name: requiredText(100),
    scheduling: z.enum(["iso-parity", "continuous"]),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Elige un lunes.")
      .refine((value) => {
        const date = new Date(value + "T00:00:00Z");
        return (
          Number.isFinite(date.getTime()) &&
          date.toISOString().slice(0, 10) === value &&
          date.getUTCDay() === 1
        );
      }, "El ciclo debe comenzar un lunes válido."),
    weeks: z
      .array(
        z
          .object({
            name: requiredText(80),
            days: z
              .array(trainingDaySchema)
              .length(7, "Cada semana debe tener sus siete días."),
          })
          .strict(),
      )
      .min(1, "Añade una semana.")
      .max(12, "Puedes alternar hasta 12 semanas."),
  })
  .strict()
  .superRefine((routine, ctx) => {
    if (routine.scheduling === "iso-parity" && routine.weeks.length !== 2) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduling"],
        message: "La alternancia par/impar necesita exactamente dos semanas.",
      });
    }
  });

export type RoutineDefinition = z.infer<typeof routineDefinitionSchema>;
export type TrainingDay = RoutineDefinition["weeks"][number]["days"][number];
export type SavedRoutine = {
  id: string;
  definition: RoutineDefinition;
  active: boolean;
};

export class RoutineDefinitionError extends Error {}

export function blankTrainingDay(): TrainingDay {
  return {
    activityId: "rest",
    title: "Descanso",
    description: "",
    duration: "",
    exercises: [],
  };
}

export function isStrength(activityId: string) {
  return ["upper", "lower", "strength"].includes(activityId);
}
