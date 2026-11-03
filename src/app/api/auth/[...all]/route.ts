import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { readAuthEnvironment } from "@/lib/auth-environment";

export const runtime = "nodejs";

function unavailable() {
  return Response.json({ error: "El acceso con Google no está disponible en este momento." }, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  if (!readAuthEnvironment().ready) return unavailable();
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  if (!readAuthEnvironment().ready) return unavailable();
  return toNextJsHandler(getAuth()).POST(request);
}
