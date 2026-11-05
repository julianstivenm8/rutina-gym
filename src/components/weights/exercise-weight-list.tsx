"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  MoveRight,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import {
  formatWeight,
  weightFormSchema,
  type ExerciseProgress,
  type WeightUnit,
  type WeightRecord,
} from "@/lib/weight-progress";
import { useWeightProgress } from "./weight-progress-provider";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "../ui/input-group";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

const recordDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
function WeightHistory({ progress, name, pending, onRemove }: {
  progress?: ExerciseProgress;
  name: string;
  pending: boolean;
  onRemove: (recordId: string) => Promise<boolean>;
}) {
  const history = useWeightProgress((state) => state.history);
  const [older, setOlder] = useState<WeightRecord[]>([]);
  const [cursor, setCursor] = useState<number | null>(
    progress && progress.count > progress.recent.length
      ? progress.recent.at(-1)!.version : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const entries = [...(progress?.recent ?? []), ...older];
  async function more() {
    if (!progress || cursor === null || loading) return;
    setLoading(true);
    setError("");
    try {
      const page = await history(progress.id, cursor);
      // A mutation remounts this history with the latest five records.
      if (page.progress.version !== progress.version) return;
      setOlder((previous) => {
        const known = new Set([...progress.recent, ...previous].map((entry) => entry.id));
        return [...previous, ...page.entries.filter((entry) => !known.has(entry.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setError("No pudimos cargar más registros. Vuelve a intentarlo.");
    } finally { setLoading(false); }
  }
  const latest = progress?.recent[0];
  return (
    <>
      {latest && progress?.first ? (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <div>
              <p className="mb-1 text-[11px] text-muted">Primer registro</p>
              <p className="font-heading text-2xl">
                {formatWeight(progress.first.amount)}{" "}
                <small className="font-sans text-xs">
                  {progress.first.unit}
                </small>
              </p>
            </div>
            <MoveRight size={20} className="text-muted" />
            <div>
              <p className="mb-1 text-[11px] text-muted">Más reciente</p>
              <p className="font-heading text-2xl">
                {formatWeight(latest.amount)}{" "}
                <small className="font-sans text-xs">{latest.unit}</small>
              </p>
            </div>
          </div>
          <h4 className="mb-2 text-xs font-medium">Últimos cambios</h4>
          <ol aria-label={"Historial de pesos de " + name} className="m-0 flex list-none flex-col gap-0 p-0">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col gap-2 border-b border-line py-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <time dateTime={entry.recordedAt} className="min-w-0 flex-1 text-[11px] text-muted">
                    {recordDate(entry.recordedAt)}
                  </time>
                  <span className="whitespace-nowrap text-sm tabular-nums">
                    {formatWeight(entry.amount)} {entry.unit}
                  </span>
                  <Button size="icon" variant="ghost" className="shrink-0 text-muted hover:text-coral"
                    aria-label={"Eliminar registro de " + formatWeight(entry.amount) + " " + entry.unit + " del " + recordDate(entry.recordedAt)}
                    title="Eliminar registro" disabled={pending || loading}
                    aria-expanded={confirmId === entry.id}
                    onClick={() => setConfirmId(confirmId === entry.id ? null : entry.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                {confirmId === entry.id && (
                  <Alert variant="destructive">
                    <AlertDescription className="gap-3">
                      <p>¿Eliminar este registro de {formatWeight(entry.amount)} {entry.unit}? Tu avance se recalculará con los registros restantes.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="destructive" size="sm" disabled={pending}
                          onClick={async () => { if (await onRemove(entry.id)) setConfirmId(null); }}>
                          {pending && <Loader2 size={14} className="motion-safe:animate-spin" />}
                          Eliminar registro
                        </Button>
                        <Button variant="outline" size="sm" disabled={pending} onClick={() => setConfirmId(null)}>Cancelar</Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-[11px] text-muted">{entries.length} de {progress.count} registros</p>
            {cursor !== null && (
              <Button variant="outline" size="sm" disabled={loading || pending} onClick={() => void more()}>
                {loading && <Loader2 size={14} className="motion-safe:animate-spin" />}
                {loading ? "Cargando…" : "Ver más"}
              </Button>
            )}
          </div>
          {error && <FieldError className="mt-2">{error}</FieldError>}
        </>
      ) : (
        <p className="text-xs leading-relaxed text-muted">
          Tu primer peso será el punto de partida. Registrarlo es opcional.
        </p>
      )}
    </>
  );
}

function ExerciseWeightRow({
  id,
  name,
  note,
}: {
  id?: string;
  name: string;
  note?: string;
}) {
  const progress = useWeightProgress((state) =>
    id ? state.progress[id] : undefined,
  );
  const ready = useWeightProgress((state) => state.ready);
  const pending = useWeightProgress((state) =>
    id ? !!state.pending[id] : false,
  );
  const save = useWeightProgress((state) => state.save);
  const remove = useWeightProgress((state) => state.remove);
  const latest = progress?.recent[0];
  const [open, setOpen] = useState(false);
  const [baseVersion, setBaseVersion] = useState(progress?.version ?? 0);
  const [notice, setNotice] = useState("");
  const request = useRef<{ key: string; id: string } | null>(null);
  const form = useForm<{ amount: string; unit: WeightUnit }>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      amount: latest ? String(Number(latest.amount)).replace(".", ",") : "",
      unit: latest?.unit ?? "kg",
    },
    mode: "onBlur",
  });
  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = form;
  const amount = watch("amount");
  const unit = watch("unit");
  useEffect(() => {
    if (!isDirty && ready) {
      reset({
        amount: latest ? String(Number(latest.amount)).replace(".", ",") : "",
        unit: latest?.unit ?? "kg",
      });
      setBaseVersion(progress?.version ?? 0);
    }
  }, [
    latest?.id,
    latest?.amount,
    latest?.unit,
    progress?.version,
    ready,
    isDirty,
    reset,
  ]);
  const changed =
    amount.trim() !== "" &&
    (!latest ||
      Number(amount.replace(",", ".")) !== Number(latest.amount) ||
      unit !== latest.unit);
  const fieldId = "exercise-weight-" + useId();
  async function submit(values: { amount: string; unit: WeightUnit }) {
    if (!id || !ready) return;
    clearErrors("root");
    setNotice("");
    const key = values.amount + ":" + values.unit + ":" + baseVersion;
    if (request.current?.key !== key)
      request.current = { key, id: crypto.randomUUID() };
    const result = await save({
      exerciseId: id,
      ...values,
      expectedVersion: baseVersion,
      requestId: request.current.id,
    });
    if (result.ok && result.progress) {
      const entry = result.progress.recent[0];
      reset({
        amount: entry ? String(Number(entry.amount)).replace(".", ",") : "",
        unit: entry?.unit ?? unit,
      });
      setBaseVersion(result.progress.version);
      setNotice("Peso guardado");
      request.current = null;
    } else {
      if (result.progress) {
        setBaseVersion(result.progress.version);
        request.current = null;
      }
      setError("root", { message: result.error });
    }
  }
  async function removeRecord(recordId: string) {
    if (!id || !progress || pending) return false;
    clearErrors("root");
    setNotice("");
    const result = await remove({ exerciseId: id, recordId, expectedVersion: progress.version });
    if (result.progress) {
      setBaseVersion(result.progress.version);
      request.current = null;
    }
    if (result.ok && result.progress) {
      if (!isDirty) {
        const entry = result.progress.recent[0];
        reset({ amount: entry ? String(Number(entry.amount)).replace(".", ",") : "", unit: entry?.unit ?? unit });
      }
      setNotice("Registro eliminado");
      return true;
    }
    setError("root", { message: result.error });
    return false;
  }
  return (
    <li className="border-b border-exercise-border last:border-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <form noValidate onSubmit={handleSubmit(submit)}>
          <FieldGroup className="grid grid-cols-[minmax(0,1fr)_148px_44px] items-start gap-2 px-[17px] py-4 mobile:grid-cols-[minmax(0,1fr)_44px] mobile:px-3.5">
            <div className="min-w-0 self-center pr-3 mobile:col-span-2 mobile:mb-1">
              <p className="break-words text-lg font-medium leading-relaxed mobile:text-base">
                {name}
              </p>
              {note && (
                <p className="mt-1 break-words text-xs text-muted">{note}</p>
              )}
            </div>
            <Field data-invalid={!!errors.amount} className="gap-1">
              <FieldLabel htmlFor={fieldId} className="sr-only">
                Peso de {name}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={fieldId}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="—"
                  maxLength={10}
                  {...register("amount", { onChange: () => setNotice("") })}
                  disabled={!ready || !id || pending}
                  aria-invalid={!!errors.amount}
                  aria-describedby={
                    errors.amount ? fieldId + "-error" : undefined
                  }
                  className="text-right tabular-nums"
                  onFocus={(event) => event.target.select()}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      reset({
                        amount: latest
                          ? String(Number(latest.amount)).replace(".", ",")
                          : "",
                        unit: latest?.unit ?? "kg",
                      });
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <CollapsibleTrigger asChild>
                    <InputGroupButton
                      size="sm"
                      aria-label={"Ver evolución de " + name}
                      title={open ? "Ocultar evolución" : "Ver evolución y cambiar unidad"}
                      disabled={pending || !ready}
                    >
                      {unit}
                      {open ? (
                        <ChevronUp data-icon="inline-end" />
                      ) : (
                        <ChevronDown data-icon="inline-end" />
                      )}
                    </InputGroupButton>
                  </CollapsibleTrigger>
                </InputGroupAddon>
              </InputGroup>
              <FieldError id={fieldId + "-error"}>
                {errors.amount?.message}
              </FieldError>
            </Field>
            <Button
              type="submit"
              variant={changed ? "default" : "ghost"}
              size="icon"
              disabled={!changed || !ready || pending || !id}
              aria-label={"Guardar peso de " + name}
              title="Guardar peso"
            >
              {pending ? (
                <Loader2 size={18} className="motion-safe:animate-spin" />
                ) : changed || !latest ? (
                <Save size={18} />
              ) : (
                <Check size={18} />
              )}
            </Button>
            {(errors.root?.message || notice) && (
              <div className="col-span-full">
                <FieldError>{errors.root?.message}</FieldError>
                <p role="status" className="text-[11px] text-sage-dark">
                  {notice}
                </p>
              </div>
            )}
          </FieldGroup>
          <CollapsibleContent className="border-0 border-t border-dashed border-exercise-border bg-surface px-5 py-5 mobile:px-3.5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-heading text-[23px]">Tu recorrido</h3>
              <Field className="w-auto">
                <FieldLabel className="sr-only">Unidad del peso</FieldLabel>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) {
                          field.onChange(value);
                          setNotice("");
                        }
                      }}
                      disabled={pending || !ready}
                      variant="outline"
                      aria-label={"Unidad para " + name}
                    >
                      <ToggleGroupItem value="kg">kg</ToggleGroupItem>
                      <ToggleGroupItem value="lb">lb</ToggleGroupItem>
                    </ToggleGroup>
                  )}
                />
              </Field>
            </div>
            <WeightHistory key={progress?.version ?? 0} progress={progress} name={name} pending={pending} onRemove={removeRecord} />
          </CollapsibleContent>
        </form>
      </Collapsible>
    </li>
  );
}

export function ExerciseWeightList({
  exercises,
  notes,
  ids,
}: {
  exercises: readonly string[];
  notes?: readonly string[];
  ids?: readonly (string | undefined)[];
}) {
  const ready = useWeightProgress((state) => state.ready);
  const error = useWeightProgress((state) => state.error);
  const load = useWeightProgress((state) => state.load);
  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RotateCcw size={14} />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <ul
        className="m-0 list-none overflow-hidden rounded-[9px] border border-exercise-border bg-exercise-surface p-0"
        aria-label="Ejercicios del día y pesos opcionales"
      >
        {exercises.map((exercise, index) => (
          <ExerciseWeightRow
            key={(ids?.[index] ?? exercise) + ":" + index + ":" + (ready ? "ready" : "loading")}
            id={ids?.[index]}
            name={exercise}
            note={notes?.[index]}
          />
        ))}
      </ul>
    </div>
  );
}
