import { bigint, boolean, check, date, foreignKey, index, integer, jsonb, numeric, pgTable, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { RoutineDefinition } from "../lib/routine-definition";
import type { BodyGender, BodyMetric } from "../lib/body";

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const user = pgTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  ...timestamps(),
});

export const session = pgTable("auth_session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  ...timestamps(),
}, (table) => [index("auth_session_user_idx").on(table.userId)]);

export const account = pgTable("auth_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps(),
}, (table) => [
  index("auth_account_user_idx").on(table.userId),
  uniqueIndex("auth_account_provider_account_idx").on(table.providerId, table.accountId),
]);

export const verification = pgTable("auth_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps(),
}, (table) => [index("auth_verification_identifier_idx").on(table.identifier)]);

export const rateLimit = pgTable("auth_rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const routinePlan = pgTable("routine_plan", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  definition: jsonb("definition").$type<RoutineDefinition>().notNull(),
  ...timestamps(),
}, table => [
  index("routine_plan_user_idx").on(table.userId),
  uniqueIndex("routine_plan_id_user_idx").on(table.id, table.userId),
]);

// One row per account guarantees one active routine during concurrent activations.
export const routineSelection = pgTable("routine_selection", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  routineId: text("routine_id").notNull(),
}, table => [
  foreignKey({ columns: [table.routineId, table.userId], foreignColumns: [routinePlan.id, routinePlan.userId], name: "routine_selection_owner_fk" }),
  index("routine_selection_routine_user_idx").on(table.routineId, table.userId),
]);

export const exerciseTrack = pgTable("exercise_track", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nameKey: text("name_key").notNull(),
  initialName: text("initial_name").notNull(),
  version: integer("version").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique("exercise_track_owner_unique").on(table.id, table.userId),
  unique("exercise_track_name_unique").on(table.userId, table.nameKey),
  check("exercise_track_version_check", sql`${table.version} >= 0`),
]);

export const exerciseWeight = pgTable("exercise_weight", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  requestId: text("request_id").notNull(),
  amount: numeric("amount", { precision: 7, scale: 3 }).notNull(),
  unit: text("unit").$type<"kg" | "lb">().notNull(),
  version: integer("version").notNull(),
  routineId: text("routine_id").notNull(),
  routineName: text("routine_name").notNull(),
  exerciseName: text("exercise_name").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  foreignKey({ columns: [table.exerciseId, table.userId], foreignColumns: [exerciseTrack.id, exerciseTrack.userId], name: "exercise_weight_owner_fk" }).onDelete("cascade"),
  unique("exercise_weight_request_unique").on(table.userId, table.requestId),
  unique("exercise_weight_version_unique").on(table.exerciseId, table.userId, table.version),
  check("exercise_weight_amount_check", sql`${table.amount} >= 0 AND ${table.amount} <= 9999.999`),
  check("exercise_weight_unit_check", sql`${table.unit} IN ('kg', 'lb')`),
  check("exercise_weight_version_check", sql`${table.version} > 0`),
]);

export const bodyProfile = pgTable("body_profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  gender: text("gender").$type<BodyGender>().default("unspecified").notNull(),
  version: integer("version").default(0).notNull(),
}, table => [
  check("body_profile_gender_check", sql`${table.gender} IN ('unspecified', 'male', 'female')`),
  check("body_profile_version_check", sql`${table.version} >= 0`),
]);

export const bodyRecord = pgTable("body_record", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  requestId: text("request_id").notNull(),
  gender: text("gender").$type<BodyGender>().notNull(),
  measuredOn: date("measured_on").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => [
  unique("body_record_owner_unique").on(table.id, table.userId),
  unique("body_record_request_unique").on(table.userId, table.requestId),
  index("body_record_user_date_idx").on(table.userId, table.measuredOn, table.createdAt, table.id),
  check("body_record_gender_check", sql`${table.gender} IN ('unspecified', 'male', 'female')`),
  check("body_record_date_check", sql`${table.measuredOn} >= '1900-01-01'::date`),
]);

export const bodyMeasurement = pgTable("body_measurement", {
  recordId: text("record_id").notNull(),
  userId: text("user_id").notNull(),
  metric: text("metric").$type<BodyMetric>().notNull(),
  amount: numeric("amount", { precision: 7, scale: 3 }).notNull(),
}, table => [
  foreignKey({ columns: [table.recordId, table.userId], foreignColumns: [bodyRecord.id, bodyRecord.userId], name: "body_measurement_owner_fk" }).onDelete("cascade"),
  unique("body_measurement_record_metric_unique").on(table.recordId, table.metric),
  index("body_measurement_user_metric_idx").on(table.userId, table.metric, table.recordId),
  check("body_measurement_metric_check", sql`${table.metric} IN ('weightKg', 'heightCm', 'neck', 'shoulders', 'chest', 'waist', 'hips', 'leftArm', 'rightArm', 'leftForearm', 'rightForearm', 'leftThigh', 'rightThigh', 'leftCalf', 'rightCalf')`),
  check("body_measurement_amount_check", sql`${table.amount} > 0 AND ((${table.metric} = 'weightKg' AND ${table.amount} <= 600) OR (${table.metric} <> 'weightKg' AND ${table.amount} <= 300))`),
]);
