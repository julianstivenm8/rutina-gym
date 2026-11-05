import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import type { BodyOverview, BodyRecord, BodyRecordInput } from "./body";

const recordJson = sql`jsonb_build_object(
  'id', r.id, 'measuredOn', r.measured_on::text, 'gender', r.gender, 'createdAt', r.created_at,
  'measurements', (select jsonb_object_agg(m.metric, m.amount) from body_measurement m where m.record_id = r.id and m.user_id = r.user_id)
)`;

export async function getBodyOverview(userId: string): Promise<BodyOverview> {
  const result = await getDatabase().execute<
    Omit<BodyOverview, "nextCursor">
  >(sql`
    with ranked as (
      select m.metric, m.amount, r.measured_on,
        lead(m.amount) over metric_order as previous,
        row_number() over metric_order as position
      from body_measurement m join body_record r on r.id = m.record_id and r.user_id = m.user_id
      where m.user_id = ${userId}
      window metric_order as (partition by m.metric order by r.measured_on desc, r.created_at desc, r.id desc)
    ), recent as (
      select * from body_record where user_id = ${userId} order by measured_on desc, created_at desc, id desc limit 6
    )
    select coalesce(p.gender, 'unspecified') as gender, coalesce(p.version, 0) as version,
      coalesce((select jsonb_object_agg(metric, jsonb_build_object('value', amount, 'measuredOn', measured_on::text, 'previous', previous)) from ranked where position = 1), '{}'::jsonb) as latest,
      (select count(*)::int from body_record where user_id = ${userId}) as count,
      coalesce((select jsonb_agg(${recordJson} order by r.measured_on desc, r.created_at desc, r.id desc) from recent r), '[]'::jsonb) as records
    from (select ${userId}::text as user_id) u left join body_profile p on p.user_id = u.user_id
  `);
  const overview = result.rows[0];
  const records = overview.records.slice(0, 5);
  return {
    ...overview,
    records,
    nextCursor: overview.records.length > 5 ? records[4].id : null,
  };
}

export async function getBodyHistory(userId: string, before: string) {
  const result = await getDatabase().execute<{ record: BodyRecord }>(sql`
    select ${recordJson} as record from body_record r
    where r.user_id = ${userId} and (r.measured_on, r.created_at, r.id) < (
      select measured_on, created_at, id from body_record where id = ${before} and user_id = ${userId}
    ) order by r.measured_on desc, r.created_at desc, r.id desc limit 6
  `);
  const records = result.rows.slice(0, 5).map((entry) => entry.record);
  return { records, nextCursor: result.rows.length > 5 ? records[4].id : null };
}

export async function saveBodyRecord(userId: string, input: BodyRecordInput) {
  const db = getDatabase();
  const existing = await db.execute<{ record: BodyRecord }>(sql`
    select ${recordJson} as record from body_record r where r.user_id = ${userId} and r.request_id = ${input.requestId}
  `);
  const overview = await getBodyOverview(userId);
  const record = existing.rows[0]?.record;
  if (record) {
    const entries = Object.entries(input.measurements);
    const same =
      record.gender === input.gender &&
      record.measuredOn === input.measuredOn &&
      Object.keys(record.measurements).length === entries.length &&
      entries.every(
        ([key, value]) =>
          record.measurements[key as keyof typeof record.measurements] ===
          value,
      );
    return same
      ? { status: 200, overview }
      : {
          status: 409,
          overview,
          error: "Este guardado ya se utilizó. Vuelve a intentarlo.",
        };
  }
  if (overview.version !== input.expectedVersion)
    return {
      status: 409,
      overview,
      error:
        "Tus medidas cambiaron en otra pestaña. Revisa los datos recientes y vuelve a guardar.",
    };
  // Profile revision, record and all measurements commit as one statement.
  const saved = await db.execute<{ record_id: string }>(sql`
    with changed as (
      insert into body_profile (user_id, gender, version) values (${userId}, ${input.gender}, 1)
      on conflict (user_id) do update set gender = excluded.gender, version = body_profile.version + 1
      where body_profile.version = ${input.expectedVersion}
      returning user_id
    ), recorded as (
      insert into body_record (id, user_id, request_id, gender, measured_on)
      select ${randomUUID()}, user_id, ${input.requestId}, ${input.gender}, ${input.measuredOn}::date from changed
      returning id, user_id
    )
    insert into body_measurement (record_id, user_id, metric, amount)
    select r.id, r.user_id, m.key, (m.value::text)::numeric
    from recorded r cross join lateral jsonb_each(${JSON.stringify(input.measurements)}::jsonb) m
    returning record_id
  `);
  const updated = await getBodyOverview(userId);
  return saved.rows.length
    ? { status: 201, overview: updated }
    : {
        status: 409,
        overview: updated,
        error:
          "Hay un registro más reciente. Revisa tus medidas y vuelve a guardar.",
      };
}

export async function deleteBodyRecord(
  userId: string,
  recordId: string,
  expectedVersion: number,
) {
  const db = getDatabase();
  const target = await db.execute<{ id: string }>(
    sql`select id from body_record where id = ${recordId} and user_id = ${userId}`,
  );
  if (!target.rows.length)
    return { status: 200, overview: await getBodyOverview(userId) };
  const deleted = await db.execute<{ id: string }>(sql`
    with changed as (
      update body_profile set version = version + 1 where user_id = ${userId} and version = ${expectedVersion}
        and exists (select 1 from body_record where id = ${recordId} and user_id = ${userId}) returning user_id
    )
    delete from body_record r using changed where r.id = ${recordId} and r.user_id = changed.user_id returning r.id
  `);
  const overview = await getBodyOverview(userId);
  return deleted.rows.length
    ? { status: 200, overview }
    : {
        status: 409,
        overview,
        error:
          "Tus medidas cambiaron en otra pestaña. Revisa el registro y vuelve a eliminarlo.",
      };
}

export async function saveBodyProfile(
  userId: string,
  input: { gender: BodyOverview["gender"]; expectedVersion: number },
) {
  const overview = await getBodyOverview(userId);
  if (overview.gender === input.gender) return { status: 200, overview };
  if (overview.version !== input.expectedVersion)
    return {
      status: 409,
      overview,
      error:
        "Tu perfil cambió en otra pestaña. Revisa la figura y vuelve a guardar.",
    };
  const changed = await getDatabase().execute<{ user_id: string }>(sql`
    insert into body_profile (user_id, gender, version) values (${userId}, ${input.gender}, 1)
    on conflict (user_id) do update set gender = excluded.gender, version = body_profile.version + 1
    where body_profile.version = ${input.expectedVersion} returning user_id
  `);
  const updated = await getBodyOverview(userId);
  return changed.rows.length
    ? { status: 200, overview: updated }
    : {
        status: 409,
        overview: updated,
        error:
          "Tu perfil cambió en otra pestaña. Revisa la figura y vuelve a guardar.",
      };
}
