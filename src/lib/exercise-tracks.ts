import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/db";
import { exerciseTrack } from "@/db/schema";
import {
  RoutineDefinitionError,
  type RoutineDefinition,
} from "./routine-definition";
import { exerciseNameKey } from "./weight-progress";

export async function prepareExerciseTracks(
  userId: string,
  definition: RoutineDefinition,
) {
  const result = structuredClone(definition);
  const exercises = result.weeks.flatMap((week) =>
    week.days.flatMap((day) => day.exercises),
  );
  if (!exercises.length) return result;
  const db = getDatabase();
  const requestedIds = [
    ...new Set(
      exercises.flatMap((exercise) => (exercise.id ? [exercise.id] : [])),
    ),
  ];
  if (requestedIds.length) {
    const owned = await db
      .select({ id: exerciseTrack.id })
      .from(exerciseTrack)
      .where(
        and(
          eq(exerciseTrack.userId, userId),
          inArray(exerciseTrack.id, requestedIds),
        ),
      );
    if (owned.length !== requestedIds.length)
      throw new RoutineDefinitionError(
        "Uno de los ejercicios no pertenece a tu cuenta. Vuelve a abrir la rutina.",
      );
  }
  const unnamed = exercises.filter((exercise) => !exercise.id);
  if (!unnamed.length) return result;
  const names = new Map(
    unnamed.map((exercise) => [exerciseNameKey(exercise.name), exercise.name]),
  );
  await db
    .insert(exerciseTrack)
    .values(
      [...names].map(([nameKey, initialName]) => ({
        id: randomUUID(),
        userId,
        nameKey,
        initialName,
      })),
    )
    .onConflictDoNothing({
      target: [exerciseTrack.userId, exerciseTrack.nameKey],
    });
  const tracks = await db
    .select({ id: exerciseTrack.id, nameKey: exerciseTrack.nameKey })
    .from(exerciseTrack)
    .where(
      and(
        eq(exerciseTrack.userId, userId),
        inArray(exerciseTrack.nameKey, [...names.keys()]),
      ),
    );
  const byName = new Map(tracks.map((track) => [track.nameKey, track.id]));
  for (const exercise of unnamed)
    exercise.id = byName.get(exerciseNameKey(exercise.name))!;
  return result;
}
