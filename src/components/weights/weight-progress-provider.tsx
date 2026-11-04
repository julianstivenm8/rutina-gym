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
import type {
  ExerciseProgress,
  ProgressMap,
  WeightInput,
  WeightDeleteInput,
  WeightHistoryPage,
} from "@/lib/weight-progress";

type SaveResult = { ok: boolean; error?: string; progress?: ExerciseProgress };
type ProgressState = {
  progress: ProgressMap;
  loading: boolean;
  ready: boolean;
  error: string;
  pending: Record<string, boolean>;
  load: () => Promise<void>;
  save: (input: Omit<WeightInput, "routineId">) => Promise<SaveResult>;
  remove: (input: Omit<WeightDeleteInput, "routineId">) => Promise<SaveResult>;
  history: (
    exerciseId: string,
    beforeVersion: number,
  ) => Promise<WeightHistoryPage>;
};
function createProgressStore(routineId: string) {
  return createStore<ProgressState>((set, get) => {
    function applyProgress(entry?: ExerciseProgress) {
      if (!entry) return;
      set((state) => ({
        progress: {
          ...state.progress,
          [entry.id]:
            !state.progress[entry.id] ||
            entry.version >= state.progress[entry.id].version
              ? entry
              : state.progress[entry.id],
        },
      }));
    }
    async function change(
      method: "POST" | "DELETE",
      input: Omit<WeightInput, "routineId"> | Omit<WeightDeleteInput, "routineId">,
    ): Promise<SaveResult> {
      if (get().pending[input.exerciseId])
        return { ok: false, error: "Espera a que termine el cambio anterior." };
      set((state) => ({ pending: { ...state.pending, [input.exerciseId]: true } }));
      try {
        const response = await fetch("/api/weights", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, routineId }),
          signal: AbortSignal.timeout(15_000),
        });
        const body = (await response.json()) as {
          progress?: ExerciseProgress;
          error?: string;
        };
        const entry = body.progress?.id === input.exerciseId ? body.progress : undefined;
        applyProgress(entry);
        return response.ok
          ? { ok: true, progress: entry }
          : {
              ok: false,
              progress: entry,
              error: body.error ?? "No pudimos aplicar el cambio. Vuelve a intentarlo.",
            };
      } catch {
        return {
          ok: false,
          error:
            method === "DELETE"
              ? "No pudimos confirmar el borrado. Vuelve a intentarlo; solo se eliminará este registro."
              : "No pudimos confirmar el guardado. Tu peso sigue en el campo; vuelve a intentarlo.",
        };
      } finally {
        set((state) => ({ pending: { ...state.pending, [input.exerciseId]: false } }));
      }
    }
    return {
      progress: {},
      pending: {},
      loading: true,
      ready: false,
      error: "",
      load: async () => {
        try {
          set({ error: "" });
          const response = await fetch(
            "/api/weights?routineId=" + encodeURIComponent(routineId),
            { cache: "no-store", signal: AbortSignal.timeout(15_000) },
          );
          if (!response.ok) throw new Error();
          const body = (await response.json()) as {
            progress: ExerciseProgress[];
          };
          set((state) => {
            const progress = { ...state.progress };
            for (const entry of body.progress)
              if (
                !progress[entry.id] ||
                entry.version >= progress[entry.id].version
              )
                progress[entry.id] = entry;
            return { progress, ready: true, loading: false };
          });
        } catch {
          set({
            loading: false,
            error:
              "No pudimos cargar tus pesos. Vuelve a intentarlo antes de registrar cambios.",
          });
        }
      },
      save: (input) => change("POST", input),
      remove: (input) => change("DELETE", input),
      history: async (exerciseId, beforeVersion) => {
        const params = new URLSearchParams({ routineId, exerciseId, beforeVersion: String(beforeVersion) });
        const response = await fetch("/api/weights/history?" + params, {
          cache: "no-store", signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) throw new Error("No pudimos cargar más registros. Vuelve a intentarlo.");
        const page = (await response.json()) as WeightHistoryPage;
        if (page.progress.id !== exerciseId) throw new Error("Historial inválido");
        applyProgress(page.progress);
        return page;
      },
    };
  });
}
const ProgressContext = createContext<StoreApi<ProgressState> | null>(null);
export function WeightProgressProvider({
  routineId,
  children,
}: {
  routineId: string;
  children: ReactNode;
}) {
  const [store] = useState(() => createProgressStore(routineId));
  useEffect(() => {
    void store.getState().load();
    const refresh = () => {
      if (document.visibilityState === "visible") void store.getState().load();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [store]);
  return (
    <ProgressContext.Provider value={store}>
      {children}
    </ProgressContext.Provider>
  );
}
export function useWeightProgress<T>(selector: (state: ProgressState) => T) {
  const store = useContext(ProgressContext);
  if (!store) throw new Error("WeightProgressProvider is required");
  return useStore(store, selector);
}
