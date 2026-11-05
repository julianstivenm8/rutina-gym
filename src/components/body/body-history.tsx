"use client";
import { useState } from "react";
import { ChevronDown, History, Loader2, Trash2 } from "lucide-react";
import {
  bodyDate,
  bodyMetrics,
  bodyNumber,
  metricKeys,
  type BodyOverview,
  type BodyRecord,
} from "@/lib/body";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { useBodyState } from "./body-provider";

function HistoryEntries({
  overview,
  onError,
}: {
  overview: BodyOverview;
  onError: (error: string) => void;
}) {
  const remove = useBodyState((state) => state.remove);
  const pending = useBodyState((state) => state.pending);
  const [older, setOlder] = useState<BodyRecord[]>([]);
  const [cursor, setCursor] = useState(overview.nextCursor);
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const records = [...overview.records, ...older];
  async function more() {
    if (!cursor || loading) return;
    setLoading(true);
    onError("");
    try {
      const response = await fetch(
        "/api/body?before=" + encodeURIComponent(cursor),
        { cache: "no-store", signal: AbortSignal.timeout(15_000) },
      );
      if (!response.ok) throw new Error();
      const page = (await response.json()) as {
        records: BodyRecord[];
        nextCursor: string | null;
      };
      setOlder((previous) => {
        const known = new Set(
          [...overview.records, ...previous].map((record) => record.id),
        );
        return [
          ...previous,
          ...page.records.filter((record) => !known.has(record.id)),
        ];
      });
      setCursor(page.nextCursor);
    } catch {
      onError("No pudimos cargar más registros. Vuelve a intentarlo.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <ol
        aria-label="Historial de medidas corporales"
        className="m-0 list-none divide-y divide-line p-0"
      >
        {records.map((record) => {
          const keys = metricKeys.filter(
            (key) => record.measurements[key] !== undefined,
          );
          return (
            <li key={record.id} className="py-4 first:pt-0">
              <div className="flex items-start gap-3">
                <details className="min-w-0 flex-1 group">
                  <summary className="flex cursor-pointer list-none items-start gap-3 rounded-lg py-1 [&::-webkit-details-marker]:hidden">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sage-light text-sage">
                      <History size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <time
                        dateTime={record.measuredOn}
                        className="block text-sm font-medium"
                      >
                        {bodyDate(record.measuredOn)}
                      </time>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {keys
                          .slice(0, 3)
                          .map(
                            (key) =>
                              `${bodyMetrics[key].label}: ${bodyNumber(record.measurements[key]!)} ${bodyMetrics[key].unit}`,
                          )
                          .join(" · ")}
                        {keys.length > 3 && ` · +${keys.length - 3} medidas`}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className="mt-1 shrink-0 group-open:rotate-180"
                    />
                  </summary>
                  <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 rounded-xl bg-paper p-4 mobile:grid-cols-1">
                    {keys.map((key) => (
                      <div
                        key={key}
                        className="flex justify-between gap-3 text-xs"
                      >
                        <dt className="text-muted">{bodyMetrics[key].label}</dt>
                        <dd className="m-0 whitespace-nowrap font-medium tabular-nums">
                          {bodyNumber(record.measurements[key]!)}{" "}
                          {bodyMetrics[key].unit}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted hover:text-coral"
                  disabled={pending || loading}
                  aria-label={
                    "Eliminar registro corporal del " +
                    bodyDate(record.measuredOn)
                  }
                  aria-expanded={confirmId === record.id}
                  onClick={() => {
                    onError("");
                    setConfirmId(confirmId === record.id ? null : record.id);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {confirmId === record.id && (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription>
                    <p>
                      ¿Eliminar las {keys.length} medidas de este registro? Se
                      actualizarán tus últimas medidas.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                        onClick={async () => {
                          const result = await remove(record.id);
                          if (result.ok) setConfirmId(null);
                          else
                            onError(
                              result.error ??
                                "No pudimos eliminar el registro.",
                            );
                        }}
                      >
                        {pending && (
                          <Loader2
                            size={14}
                            className="motion-safe:animate-spin"
                          />
                        )}
                        Eliminar registro
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">
          {records.length} de {overview.count}{" "}
          {overview.count === 1 ? "registro" : "registros"}
        </p>
        {cursor && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading || pending}
            onClick={() => void more()}
          >
            {loading && (
              <Loader2 size={14} className="motion-safe:animate-spin" />
            )}
            {loading ? "Cargando…" : "Ver más"}
          </Button>
        )}
      </div>
    </>
  );
}
export function BodyHistory() {
  const overview = useBodyState((state) => state.overview);
  const [error, setError] = useState("");
  return (
    <section
      className="mt-8 rounded-[22px] border border-line bg-surface p-7 mobile:p-5"
      aria-labelledby="body-history-title"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="body-history-title" className="font-heading text-[32px]">
            Tu recorrido, por fecha
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Abre un registro para ver todas sus medidas.
          </p>
        </div>
        <span className="text-xs text-muted">
          Solo datos que tú registraste
        </span>
      </div>
      {overview.count ? (
        <HistoryEntries
          key={overview.version}
          overview={overview}
          onError={setError}
        />
      ) : (
        <div className="flex items-start gap-4 rounded-xl bg-paper p-5">
          <History className="mt-1 shrink-0 text-lavender" size={23} />
          <p className="max-w-[44ch] text-sm leading-relaxed text-muted">
            Tu primer registro será tu punto de partida. Puedes empezar con una
            sola medida y añadir otras cuando quieras.
          </p>
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
