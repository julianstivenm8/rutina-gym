import { bigint, boolean, foreignKey, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { RoutineDefinition } from "../lib/routine-definition";

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
