import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { getAuth } from "./auth";
import { readAuthEnvironment } from "./auth-environment";

export const getCurrentSession = cache(async () => {
  if (!readAuthEnvironment().ready) return null;
  return getAuth().api.getSession({ headers: await headers() });
});
