"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import type { BodyOverview, BodyRecordInput } from "@/lib/body";

type Result = { ok: boolean; overview?: BodyOverview; error?: string };
type BodyState = {
  overview: BodyOverview;
  pending: boolean;
  refresh: () => Promise<void>;
  save: (input: BodyRecordInput) => Promise<Result>;
  profile: (
    gender: BodyOverview["gender"],
    expectedVersion: number,
  ) => Promise<Result>;
  remove: (recordId: string) => Promise<Result>;
};
function createBodyStore(initial: BodyOverview) {
  return createStore<BodyState>((set, get) => {
    function apply(overview?: BodyOverview) {
      if (overview && overview.version >= get().overview.version)
        set({ overview });
    }
    async function change(
      method: "POST" | "DELETE" | "PUT",
      input: unknown,
    ): Promise<Result> {
      if (get().pending)
        return { ok: false, error: "Espera a que termine el cambio anterior." };
      set({ pending: true });
      try {
        const response = await fetch("/api/body", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(15_000),
        });
        const body = (await response.json()) as {
          overview?: BodyOverview;
          error?: string;
        };
        apply(body.overview);
        return { ok: response.ok, ...body };
      } catch {
        return {
          ok: false,
          error:
            method !== "DELETE"
              ? "No pudimos confirmar el guardado. Tus medidas siguen en el formulario; vuelve a intentarlo."
              : "No pudimos confirmar el borrado. Vuelve a intentarlo; solo se eliminará ese registro.",
        };
      } finally {
        set({ pending: false });
      }
    }
    return {
      overview: initial,
      pending: false,
      refresh: async () => {
        try {
          const response = await fetch("/api/body", {
            cache: "no-store",
            signal: AbortSignal.timeout(15_000),
          });
          if (response.ok) apply((await response.json()).overview);
        } catch {
          /* Keep the existing snapshot and any unsaved draft. */
        }
      },
      save: (input) => change("POST", input),
      profile: (gender, expectedVersion) =>
        change("PUT", { gender, expectedVersion }),
      remove: (recordId) =>
        change("DELETE", { recordId, expectedVersion: get().overview.version }),
    };
  });
}
const BodyContext = createContext<StoreApi<BodyState> | null>(null);
export function BodyProvider({
  initial,
  children,
}: {
  initial: BodyOverview;
  children: ReactNode;
}) {
  const [store] = useState(() => createBodyStore(initial));
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible")
        void store.getState().refresh();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [store]);
  return <BodyContext.Provider value={store}>{children}</BodyContext.Provider>;
}
export function useBodyState<T>(selector: (state: BodyState) => T) {
  const store = useContext(BodyContext);
  if (!store) throw new Error("BodyProvider is required");
  return useStore(store, selector);
}
