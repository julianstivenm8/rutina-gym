import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import { exerciseWeight } from "@/db/schema";
import { findRoutine } from "./routine-repository";
import type { ExerciseProgress, WeightInput, WeightDeleteInput, WeightRecord } from "./weight-progress";

async function readProgress(
  userId: string,
  ids: string[],
  beforeVersion?: number,
) {
  if (!ids.length) return [];
  const result = await getDatabase().execute<ExerciseProgress & { page?: WeightRecord[] }>(sql`
    select t.id, t.version,
      (select count(*)::int from exercise_weight where exercise_id = t.id and user_id = t.user_id) as count,
      (select jsonb_build_object('id', e.id, 'amount', e.amount::text, 'unit', e.unit, 'version', e.version, 'recordedAt', e.recorded_at)
       from exercise_weight e where e.exercise_id = t.id and e.user_id = t.user_id order by e.version asc limit 1) as first,
      coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'amount', e.amount::text, 'unit', e.unit, 'version', e.version, 'recordedAt', e.recorded_at) order by e.version desc)
        from (select * from exercise_weight where exercise_id = t.id and user_id = t.user_id order by version desc limit 5) e), '[]'::jsonb) as recent
      ${beforeVersion === undefined ? sql`` : sql`,
        coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'amount', e.amount::text, 'unit', e.unit, 'version', e.version, 'recordedAt', e.recorded_at) order by e.version desc)
          from (select * from exercise_weight where exercise_id = t.id and user_id = t.user_id and version < ${beforeVersion} order by version desc limit 6) e), '[]'::jsonb) as page`}
    from exercise_track t where t.user_id = ${userId} and t.id in (${sql.join(
      ids.map((id) => sql`${id}`),
      sql`, `,
    )})
  `);
  return result.rows;
}

export async function getRoutineProgress(userId: string, routineId: string) {
  const routine = await findRoutine(userId, routineId);
  if (!routine) return null;
  const ids = [
    ...new Set(
      routine.definition.weeks.flatMap((week) =>
        week.days.flatMap((day) =>
          day.exercises.flatMap((exercise) =>
            exercise.id ? [exercise.id] : [],
          ),
        ),
      ),
    ),
  ];
  return readProgress(userId, ids);
}

export async function getExerciseHistory(
  userId: string,
  input: { routineId: string; exerciseId: string; beforeVersion?: number },
) {
  const routine = await findRoutine(userId, input.routineId);
  if (!routine?.definition.weeks.some((week) =>
    week.days.some((day) => day.exercises.some((exercise) => exercise.id === input.exerciseId)),
  )) return null;
  // The summary and page share one database snapshot, including concurrent edits.
  const [result] = await readProgress(userId, [input.exerciseId], input.beforeVersion ?? 2147483647);
  if (!result) return null;
  const { page = [], ...progress } = result;
  const entries = page.slice(0, 5);
  return { progress, entries, nextCursor: page.length > 5 ? entries[4].version : null };
}

export async function deleteExerciseWeight(userId: string, input: WeightDeleteInput) {
  const routine = await findRoutine(userId, input.routineId);
  if (!routine?.definition.weeks.some((week) =>
    week.days.some((day) => day.exercises.some((exercise) => exercise.id === input.exerciseId)),
  )) return { status: 404, error: "No encontramos ese ejercicio en tu rutina." };
  const db = getDatabase();
  const [progress] = await readProgress(userId, [input.exerciseId]);
  if (!progress) return { status: 404, error: "No encontramos ese ejercicio." };
  const [record] = await db.select({ id: exerciseWeight.id }).from(exerciseWeight).where(and(
    eq(exerciseWeight.id, input.recordId),
    eq(exerciseWeight.userId, userId),
    eq(exerciseWeight.exerciseId, input.exerciseId),
  ));
  // A retry after a successful deletion must not remove a different record.
  if (!record) return { status: 200, progress };
  const deleted = await db.execute<{ id: string }>(sql`
    with changed as (
      update exercise_track set version = version + 1
      where id = ${input.exerciseId} and user_id = ${userId} and version = ${input.expectedVersion}
        and exists (select 1 from exercise_weight where id = ${input.recordId} and exercise_id = ${input.exerciseId} and user_id = ${userId})
      returning id, user_id
    )
    delete from exercise_weight e using changed
    where e.id = ${input.recordId} and e.exercise_id = changed.id and e.user_id = changed.user_id
    returning e.id
  `);
  const [updated] = await readProgress(userId, [input.exerciseId]);
  return deleted.rows.length
    ? { status: 200, progress: updated }
    : {
        status: 409,
        error: "El historial cambió en otra pestaña. Revisa los registros y vuelve a eliminarlo.",
        progress: updated,
      };
}

export async function saveExerciseWeight(userId: string, input: WeightInput) {
  const routine = await findRoutine(userId, input.routineId);
  const exercise = routine?.definition.weeks
    .flatMap((week) => week.days.flatMap((day) => day.exercises))
    .find((exercise) => exercise.id === input.exerciseId);
  if (!routine || !exercise)
    return { status: 404, error: "No encontramos ese ejercicio en tu rutina." };
  const db = getDatabase();
  const [existing] = await db
    .select()
    .from(exerciseWeight)
    .where(
      and(
        eq(exerciseWeight.userId, userId),
        eq(exerciseWeight.requestId, input.requestId),
      ),
    );
  const [progress] = await readProgress(userId, [input.exerciseId]);
  if (!progress) return { status: 404, error: "No encontramos ese ejercicio." };
  if (existing) {
    const sameRequest =
      existing.exerciseId === input.exerciseId &&
      existing.routineId === input.routineId &&
      Number(existing.amount) === Number(input.amount) &&
      existing.unit === input.unit;
    return sameRequest
      ? { status: 200, progress }
      : {
          status: 409,
          error: "Este guardado ya se utilizó. Vuelve a intentarlo.",
          progress,
        };
  }
  if (progress.version !== input.expectedVersion)
    return {
      status: 409,
      error:
        "El peso cambió en otra pestaña. Revisa el último registro y vuelve a guardar si quieres aplicar tu cambio.",
      progress,
    };
  const latest = progress.recent[0];
  if (
    latest &&
    Number(latest.amount) === Number(input.amount) &&
    latest.unit === input.unit
  )
    return { status: 200, progress };
  // Compare-and-swap and append are one SQL statement/transaction: no overwritten changes.
  const inserted = await db.execute<{ id: string }>(sql`
    with changed as (
      update exercise_track set version = version + 1
      where id = ${input.exerciseId} and user_id = ${userId} and version = ${input.expectedVersion}
      returning id, user_id, version
    )
    insert into exercise_weight (id, user_id, exercise_id, request_id, amount, unit, version, routine_id, routine_name, exercise_name)
    select ${randomUUID()}, user_id, id, ${input.requestId}, ${input.amount}::numeric, ${input.unit}, version, ${routine.id}, ${routine.definition.name}, ${exercise.name}
    from changed returning id
  `);
  const [updated] = await readProgress(userId, [input.exerciseId]);
  return inserted.rows.length
    ? { status: 201, progress: updated }
    : {
        status: 409,
        error:
          "Hay un registro más reciente. Revisa el peso y vuelve a guardar.",
        progress: updated,
      };
}
