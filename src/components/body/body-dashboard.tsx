"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  CalendarDays,
  Check,
  Info,
  Loader2,
  LockKeyhole,
  Mars,
  Ruler,
  Save,
  Venus,
} from "lucide-react";
import {
  adultBmiRanges,
  bodyDate,
  bodyGroups,
  bodyMetrics,
  bodyNumber,
  bodyRecordSchema,
  bogotaDay,
  metricKeys,
  type BodyGender,
  type BodyGroup,
  type BodyMetric,
  type BodyOverview,
} from "@/lib/body";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { BodyMap } from "./body-map";
import { BodyHistory } from "./body-history";
import { BodyProvider, useBodyState } from "./body-provider";
import { BmiIndicator } from "./bmi-indicator";

type BodyDraft = {
  gender: BodyGender;
  measuredOn: string;
  measurements: Partial<Record<BodyMetric, string>>;
};
const emptyMeasurements = () =>
  Object.fromEntries(metricKeys.map((key) => [key, ""])) as Record<
    BodyMetric,
    string
  >;

function BodySummary({ onSelect }: { onSelect: (metric: BodyMetric) => void }) {
  const latest = useBodyState((state) => state.overview.latest);
  return (
    <section
      aria-label="Tus últimas referencias corporales"
      className="mb-8 border-y border-line py-6"
    >
      <dl className="m-0 grid grid-cols-3 divide-x divide-line">
        {(["weightKg", "heightCm"] as const).map((key) => {
          const value = latest[key];
          const metric = bodyMetrics[key];
          return (
            <div key={key} className="px-7 first:pl-0 mobile:px-3">
              <dt className="text-xs text-muted">{metric.label}</dt>
              <dd className="m-0 mt-1">
                <button
                  type="button"
                  className="border-0 bg-transparent p-0 text-left"
                  onClick={() => onSelect(key)}
                  aria-label={"Registrar " + metric.label.toLowerCase()}
                >
                  <span className="font-heading text-[40px] leading-none mobile:text-[32px]">
                    {value ? bodyNumber(value.value) : "—"}
                  </span>
                  <span className="ml-1.5 text-xs text-muted">
                    {metric.unit}
                  </span>
                </button>
                <span className="mt-2 block text-[10px] text-muted">
                  {value ? bodyDate(value.measuredOn) : "Por registrar"}
                </span>
              </dd>
            </div>
          );
        })}
        <div className="px-7 mobile:px-3 mobile:pr-0">
          <dt className="text-xs text-muted">IMC</dt>
          <dd className="m-0 mt-1">
            <BmiIndicator
              weightKg={latest.weightKg?.value}
              heightCm={latest.heightCm?.value}
            />
          </dd>
        </div>
      </dl>
      <details className="mt-4 max-w-[72ch] text-[11px] leading-relaxed text-muted">
        <summary className="w-fit cursor-pointer">Sobre el IMC</summary>
        <p className="mt-2">
          Se calcula como peso en kg ÷ altura en metros al cuadrado. En adultos
          de 20 años o más, la fórmula y los rangos son iguales para hombres y
          mujeres. Es una referencia y no distingue grasa de masa muscular.
        </p>
        <dl className="my-3 grid max-w-[400px] grid-cols-[1fr_auto] gap-x-5 gap-y-2 rounded-xl bg-surface p-4">
          {adultBmiRanges.map((range) => (
            <div key={range.id} className="contents">
              <dt>{range.label}</dt>
              <dd className="m-0 text-right tabular-nums">{range.range}</dd>
            </div>
          ))}
        </dl>
        <p>
          La categoría usa el valor sin redondear. Para menores de 20 años se
          necesitan la edad y el sexo; estos rangos no se deben aplicar. El IMC
          por sí solo no determina tu estado de salud.{" "}
          <a
            href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Más información (CDC)
          </a>
          .
        </p>
      </details>
    </section>
  );
}

function BodyWorkspace() {
  const overview = useBodyState((state) => state.overview);
  const pending = useBodyState((state) => state.pending);
  const save = useBodyState((state) => state.save);
  const saveProfile = useBodyState((state) => state.profile);
  const [group, setGroup] = useState<BodyGroup>("general");
  const [selected, setSelected] = useState<BodyMetric>("weightKg");
  const [baseVersion, setBaseVersion] = useState(overview.version);
  const [notice, setNotice] = useState("");
  const request = useRef<{ key: string; id: string } | null>(null);
  const form = useForm<BodyDraft>({
    defaultValues: {
      gender: overview.gender,
      measuredOn: bogotaDay(),
      measurements: emptyMeasurements(),
    },
  });
  const {
    register,
    watch,
    setValue,
    setFocus,
    reset,
    clearErrors,
    setError,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;
  const gender = watch("gender");
  const draft = watch("measurements");
  const count = Object.values(draft).filter((value) => value?.trim()).length;
  useEffect(() => {
    if (!isDirty) {
      setBaseVersion(overview.version);
      setValue("gender", overview.gender);
    }
  }, [overview.version, overview.gender, isDirty, setValue]);

  function choose(metric: BodyMetric) {
    setSelected(metric);
    setGroup(bodyMetrics[metric].group);
    requestAnimationFrame(() => {
      setFocus(`measurements.${metric}`);
      if (window.matchMedia("(max-width: 900px)").matches)
        document
          .getElementById("body-measure-editor")
          ?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }
  async function submit(values: BodyDraft) {
    clearErrors();
    setNotice("");
    const measurements = Object.fromEntries(
      Object.entries(values.measurements).filter(([, value]) => value?.trim()),
    );
    if (
      !Object.keys(measurements).length &&
      values.gender !== overview.gender
    ) {
      const result = await saveProfile(values.gender, baseVersion);
      if (result.overview) setBaseVersion(result.overview.version);
      if (result.ok && result.overview) {
        reset({
          gender: result.overview.gender,
          measuredOn: values.measuredOn,
          measurements: emptyMeasurements(),
        });
        setNotice("Perfil guardado en tu cuenta");
      } else setError("root", { message: result.error });
      return;
    }
    const key = JSON.stringify({ ...values, measurements, baseVersion });
    if (request.current?.key !== key)
      request.current = { key, id: crypto.randomUUID() };
    const parsed = bodyRecordSchema.safeParse({
      gender: values.gender,
      measuredOn: values.measuredOn,
      measurements,
      expectedVersion: baseVersion,
      requestId: request.current.id,
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        if (
          issue.path[0] === "measurements" &&
          metricKeys.includes(issue.path[1] as BodyMetric)
        )
          setError(`measurements.${issue.path[1] as BodyMetric}`, {
            message: issue.message,
          });
        else if (issue.path[0] === "measuredOn")
          setError("measuredOn", { message: issue.message });
      }
      setError("root", {
        message:
          parsed.error.issues[0]?.message ??
          "Revisa tus medidas antes de guardar.",
      });
      return;
    }
    const result = await save(parsed.data);
    if (result.overview) {
      setBaseVersion(result.overview.version);
      request.current = null;
    }
    if (result.ok && result.overview) {
      reset({
        gender: result.overview.gender,
        measuredOn: values.measuredOn,
        measurements: emptyMeasurements(),
      });
      setNotice("Medidas guardadas en tu cuenta");
    } else
      setError("root", {
        message: result.error ?? "No pudimos guardar tus medidas.",
      });
  }
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-5 pt-9 pb-7 mobile:pt-7">
        <div>
          <h1 className="font-heading text-[64px] leading-none tracking-[-1px] mobile:text-[52px]">
            Mi cuerpo
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Conoce tus cambios, medida a medida.
          </p>
        </div>
        <p className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[11px] text-muted">
          <LockKeyhole size={13} />
          Solo tú puedes ver tus medidas
        </p>
      </header>
      <BodySummary onSelect={choose} />
      <form noValidate onSubmit={handleSubmit(submit)}>
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-7 touch:grid-cols-1 mobile:gap-5">
          <section
            aria-labelledby="body-map-title"
            className="overflow-hidden rounded-[24px] border border-lavender/20 bg-lavender-light/45"
          >
            <div className="px-7 pt-6 mobile:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="body-map-title" className="font-heading text-[32px]">
                    Tu mapa corporal
                  </h2>
                  <p className="mt-1 text-xs text-muted">
                    Toca un punto para registrar esa zona.
                  </p>
                </div>
                <Ruler size={21} className="mt-2 text-lavender" />
              </div>
              <ToggleGroup
                type="single"
                value={gender}
                spacing={1}
                className="mt-5 grid w-full grid-cols-3 gap-1 rounded-xl bg-surface/75 p-1"
                aria-label="Género y figura corporal"
                onValueChange={(value) => {
                  if (value)
                    setValue("gender", value as BodyGender, {
                      shouldDirty: true,
                    });
                }}
                disabled={pending}
              >
                <ToggleGroupItem
                  value="unspecified"
                  className="h-10 rounded-lg px-2 text-[11px] data-[state=on]:bg-lavender-light"
                >
                  Sin especificar
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="male"
                  className="h-10 rounded-lg px-2 text-xs data-[state=on]:bg-lavender-light"
                >
                  <Mars size={14} />
                  Hombre
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="female"
                  className="h-10 rounded-lg px-2 text-xs data-[state=on]:bg-lavender-light"
                >
                  <Venus size={14} />
                  Mujer
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="px-4 pt-3 mobile:px-1">
              <BodyMap
                gender={gender}
                selected={selected}
                latest={overview.latest}
                draft={draft}
                onSelect={choose}
              />
            </div>
            <div className="mx-7 flex flex-wrap items-center justify-between gap-3 border-t border-lavender/20 py-5 mobile:mx-5">
              <p className="flex items-center gap-2 text-[11px] text-muted">
                <span className="size-2 rounded-full bg-sage-dark" />
                Con registro
                <span className="ml-2 size-2 rounded-full border border-lavender" />
                Por medir
              </p>
              <span className="text-[10px] text-muted">Figura ilustrativa</span>
            </div>
          </section>
          <section
            id="body-measure-editor"
            aria-labelledby="body-editor-title"
            className="scroll-mt-6 rounded-[24px] border border-line bg-surface p-7 mobile:p-5"
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 id="body-editor-title" className="font-heading text-[32px]">
                  Nuevo registro
                </h2>
                <p className="mt-1 max-w-[36ch] text-xs leading-relaxed text-muted">
                  Anota solo lo que mediste. Las demás medidas conservarán su
                  fecha.
                </p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-light text-sage">
                <PlusMark />
              </span>
            </div>
            <Field className="mb-5 gap-2">
              <FieldLabel
                htmlFor="body-date"
                className="flex items-center gap-2 text-xs"
              >
                <CalendarDays size={14} />
                Fecha de las medidas
              </FieldLabel>
              <Input
                id="body-date"
                type="date"
                max={bogotaDay()}
                min="1900-01-01"
                {...register("measuredOn")}
                disabled={pending}
                aria-invalid={!!errors.measuredOn}
              />
              <FieldError>{errors.measuredOn?.message}</FieldError>
            </Field>
            <ToggleGroup
              type="single"
              value={group}
              onValueChange={(value) => {
                if (value) {
                  setGroup(value as BodyGroup);
                  setSelected(
                    metricKeys.find((key) => bodyMetrics[key].group === value)!,
                  );
                }
              }}
              spacing={1}
              className="mb-6 grid w-full grid-cols-4 gap-1 rounded-xl bg-paper p-1"
              aria-label="Zona de las medidas"
            >
              {bodyGroups.map((entry) => (
                <ToggleGroupItem
                  key={entry.id}
                  value={entry.id}
                  className="h-10 min-w-0 rounded-lg px-1.5 text-[11px] data-[state=on]:bg-sage-light"
                >
                  {entry.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <h3 className="mb-1 text-base font-medium">
              {bodyGroups.find((entry) => entry.id === group)!.hint}
            </h3>
            <p className="mb-5 text-[11px] text-muted">
              {group === "general"
                ? "El IMC se calcula al tener peso y altura."
                : "Medidas de contorno, en centímetros. Izquierda y derecha corresponden a tu cuerpo."}
            </p>
            <FieldGroup className="gap-4">
              {metricKeys
                .filter((key) => bodyMetrics[key].group === group)
                .map((key) => {
                  const metric = bodyMetrics[key];
                  const latest = overview.latest[key];
                  const difference =
                    latest && latest.previous !== null
                      ? Math.round((latest.value - latest.previous) * 1000) /
                        1000
                      : null;
                  return (
                    <Field
                      key={key}
                      data-invalid={!!errors.measurements?.[key]}
                      className={cn(
                        "grid grid-cols-[minmax(0,1fr)_118px] items-center gap-x-4 gap-y-1 rounded-xl border border-transparent p-3 mobile:grid-cols-[minmax(0,1fr)_104px] mobile:gap-x-2",
                        selected === key && "border-sage/25 bg-sage-light/40",
                      )}
                    >
                      <div className="min-w-0">
                        <FieldLabel
                          htmlFor={"body-" + key}
                          className="text-[13px] leading-snug"
                        >
                          {metric.label}
                        </FieldLabel>
                        {latest && (
                          <p className="mt-1 text-[10px] leading-relaxed text-muted">
                            Última: {bodyNumber(latest.value)} {metric.unit}
                            <span className="block">
                              {bodyDate(latest.measuredOn)}
                              {difference !== null && difference !== 0
                                ? ` (${difference > 0 ? "+" : ""}${bodyNumber(difference)} ${metric.unit})`
                                : ""}
                            </span>
                          </p>
                        )}
                      </div>
                      <InputGroup>
                        <InputGroupInput
                          id={"body-" + key}
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="—"
                          maxLength={7}
                          {...register(`measurements.${key}`, {
                            onChange: () => setNotice(""),
                          })}
                          disabled={pending}
                          aria-invalid={!!errors.measurements?.[key]}
                          aria-describedby={
                            errors.measurements?.[key]
                              ? "body-error-" + key
                              : undefined
                          }
                          className="text-right tabular-nums"
                          onFocus={() => setSelected(key)}
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText className="text-[11px]">
                            {metric.unit}
                          </InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError
                        id={"body-error-" + key}
                        className="col-span-full"
                      >
                        {errors.measurements?.[key]?.message}
                      </FieldError>
                    </Field>
                  );
                })}
            </FieldGroup>
            <div className="mt-6 rounded-xl bg-paper p-4">
              <div className="flex items-start gap-2.5">
                <Info size={15} className="mt-0.5 shrink-0 text-lavender" />
                <p className="text-[11px] leading-relaxed text-muted">
                  Para comparar, toma las medidas en condiciones similares y usa
                  la cinta sin apretar. No necesitas completar todas las zonas.
                </p>
              </div>
            </div>
            {errors.root?.message && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
              <p className="text-[11px] text-muted">
                {count
                  ? `${count} ${count === 1 ? "medida lista" : "medidas listas"}`
                  : "Todas las medidas son opcionales"}
              </p>
              <Button
                type="submit"
                disabled={pending || (!count && gender === overview.gender)}
                className="shrink-0 px-3 text-xs"
              >
                {pending ? (
                  <Loader2 size={15} className="motion-safe:animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                {!count && gender !== overview.gender
                  ? "Guardar perfil"
                  : "Guardar registro"}
              </Button>
            </div>
            <p
              role="status"
              className="mt-3 flex min-h-4 items-center gap-2 text-xs text-sage"
            >
              {notice && (
                <>
                  <Check size={14} />
                  {notice}
                </>
              )}
            </p>
          </section>
        </div>
      </form>
      <BodyHistory />
    </>
  );
}
function PlusMark() {
  return (
    <span aria-hidden="true" className="text-xl leading-none">
      +
    </span>
  );
}
export function BodyDashboard({ initial }: { initial: BodyOverview }) {
  return (
    <BodyProvider initial={initial}>
      <BodyWorkspace />
    </BodyProvider>
  );
}
