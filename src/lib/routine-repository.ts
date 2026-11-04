import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { routinePlan, routineSelection } from "@/db/schema";
import { getDefaultRoutineDefinition } from "./routine";
import { prepareExerciseTracks } from "./exercise-tracks";
import {
  routineDefinitionSchema,
  type RoutineDefinition,
  type SavedRoutine,
} from "./routine-definition";

export async function ensureDefaultRoutine(userId: string) {
  const db = getDatabase();
  const id = "default:" + userId;
  const [initialized] = await db
    .select({ id: routinePlan.id })
    .from(routinePlan)
    .innerJoin(
      routineSelection,
      eq(routineSelection.userId, routinePlan.userId),
    )
    .where(and(eq(routinePlan.id, id), eq(routinePlan.userId, userId)));
  if (initialized) return;
  const definition = await prepareExerciseTracks(
    userId,
    getDefaultRoutineDefinition(),
  );
  await db.batch([
    db
      .insert(routinePlan)
      .values({ id, userId, definition })
      .onConflictDoNothing(),
    db
      .insert(routineSelection)
      .values({ userId, routineId: id })
      .onConflictDoNothing(),
  ]);
}

export async function listRoutines(userId: string): Promise<SavedRoutine[]> {
  await ensureDefaultRoutine(userId);
  const db = getDatabase();
  const rows = await db
    .select({
      id: routinePlan.id,
      definition: routinePlan.definition,
      activeId: routineSelection.routineId,
    })
    .from(routinePlan)
    .leftJoin(routineSelection, eq(routineSelection.userId, routinePlan.userId))
    .where(eq(routinePlan.userId, userId))
    .orderBy(desc(routinePlan.createdAt));
  return rows.map((row) => ({
    id: row.id,
    definition: routineDefinitionSchema.parse(row.definition),
    active: row.activeId === row.id,
  }));
}

export async function findRoutine(userId: string, id: string) {
  const [row] = await getDatabase()
    .select()
    .from(routinePlan)
    .where(and(eq(routinePlan.id, id), eq(routinePlan.userId, userId)));
  return row
    ? { id: row.id, definition: routineDefinitionSchema.parse(row.definition) }
    : null;
}

export async function getActiveRoutine(userId: string) {
  await ensureDefaultRoutine(userId);
  const [row] = await getDatabase()
    .select({ id: routinePlan.id, definition: routinePlan.definition })
    .from(routineSelection)
    .innerJoin(
      routinePlan,
      and(
        eq(routinePlan.id, routineSelection.routineId),
        eq(routinePlan.userId, routineSelection.userId),
      ),
    )
    .where(eq(routineSelection.userId, userId));
  if (!row) throw new Error("No hay una rutina activa para esta cuenta.");
  return {
    id: row.id,
    definition: routineDefinitionSchema.parse(row.definition),
  };
}

export async function saveRoutine(
  userId: string,
  definition: RoutineDefinition,
  activate: boolean,
  existingId?: string,
) {
  await ensureDefaultRoutine(userId);
  const db = getDatabase();
  const id = existingId ?? randomUUID();
  if (existingId && !(await findRoutine(userId, existingId))) return null;
  definition = await prepareExerciseTracks(userId, definition);
  const write = existingId
    ? db
        .update(routinePlan)
        .set({ definition, updatedAt: new Date() })
        .where(and(eq(routinePlan.id, id), eq(routinePlan.userId, userId)))
        .returning({ id: routinePlan.id })
    : db
        .insert(routinePlan)
        .values({ id, userId, definition })
        .returning({ id: routinePlan.id });
  if (activate) {
    // Batch runs in one database transaction. The composite FK enforces ownership.
    await db.batch([
      write,
      db
        .insert(routineSelection)
        .values({ userId, routineId: id })
        .onConflictDoUpdate({
          target: routineSelection.userId,
          set: { routineId: id },
        }),
    ]);
  } else {
    await write;
  }
  return id;
}

export async function activateRoutine(userId: string, id: string) {
  if (!(await findRoutine(userId, id))) return false;
  await getDatabase()
    .insert(routineSelection)
    .values({ userId, routineId: id })
    .onConflictDoUpdate({
      target: routineSelection.userId,
      set: { routineId: id },
    });
  return true;
}
