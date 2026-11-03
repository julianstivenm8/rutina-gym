import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { requireAuthEnvironment } from "@/lib/auth-environment";
import * as schema from "./schema";

function createDatabase() {
  const { DATABASE_URL } = requireAuthEnvironment();
  return drizzle({ client: neon(DATABASE_URL), schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

export function getDatabase() {
  return database ??= createDatabase();
}
