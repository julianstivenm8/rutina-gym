import { z } from "zod";
import { withBodyUser } from "@/lib/body-api";
import { routineResponse } from "@/lib/routine-api";
import {
  bodyDeleteSchema,
  bodyProfileSchema,
  bodyRecordSchema,
} from "@/lib/body";
import {
  deleteBodyRecord,
  getBodyHistory,
  getBodyOverview,
  saveBodyRecord,
  saveBodyProfile,
} from "@/lib/body-repository";

export async function GET(request: Request) {
  return withBodyUser(async (userId) => {
    const parsed = z
      .object({ before: z.string().uuid().optional() })
      .strict()
      .safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success)
      return routineResponse({ error: "Elige un historial válido." }, 400);
    return routineResponse(
      parsed.data.before
        ? await getBodyHistory(userId, parsed.data.before)
        : { overview: await getBodyOverview(userId) },
    );
  });
}

export async function POST(request: Request) {
  return withBodyUser(async (userId) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return routineResponse(
        { error: "Revisa tus medidas antes de guardar." },
        400,
      );
    }
    const parsed = bodyRecordSchema.safeParse(body);
    if (!parsed.success)
      return routineResponse(
        { error: parsed.error.issues[0]?.message ?? "Revisa tus medidas." },
        400,
      );
    const result = await saveBodyRecord(userId, parsed.data);
    return routineResponse(
      { overview: result.overview, error: result.error },
      result.status,
    );
  }, request);
}

export async function DELETE(request: Request) {
  return withBodyUser(async (userId) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return routineResponse({ error: "Elige un registro válido." }, 400);
    }
    const parsed = bodyDeleteSchema.safeParse(body);
    if (!parsed.success)
      return routineResponse({ error: "Elige un registro válido." }, 400);
    const result = await deleteBodyRecord(
      userId,
      parsed.data.recordId,
      parsed.data.expectedVersion,
    );
    return routineResponse(
      { overview: result.overview, error: result.error },
      result.status,
    );
  }, request);
}

export async function PUT(request: Request) {
  return withBodyUser(async (userId) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return routineResponse(
        { error: "Revisa tu perfil antes de guardar." },
        400,
      );
    }
    const parsed = bodyProfileSchema.safeParse(body);
    if (!parsed.success)
      return routineResponse({ error: "Elige una figura válida." }, 400);
    const result = await saveBodyProfile(userId, parsed.data);
    return routineResponse(
      { overview: result.overview, error: result.error },
      result.status,
    );
  }, request);
}
