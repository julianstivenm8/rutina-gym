"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  blankTrainingDay,
  routineDefinitionSchema,
  type RoutineDefinition,
} from "@/lib/routine-definition";
import {
  DAY_NAMES,
  getDefaultRoutineDefinition,
  getWeekModel,
} from "@/lib/routine";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldDescription,
  FieldError,
} from "../ui/field";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { DayEditor } from "./day-editor";
import { CyclePreview } from "./cycle-preview";

function blankRoutine(): RoutineDefinition {
  return {
    name: "",
    scheduling: "continuous",
    startDate: getWeekModel().days[0].dateKey,
    weeks: [
      { name: "Semana 1", days: DAY_NAMES.map(() => blankTrainingDay()) },
    ],
  };
}

export function RoutineEditor({
  initial,
  routineId,
}: {
  initial?: RoutineDefinition;
  routineId?: string;
}) {
  const router = useRouter();
  const [defaultValues] = useState(() => initial ?? blankRoutine());
  const form = useForm<RoutineDefinition>({
    resolver: zodResolver(routineDefinitionSchema),
    defaultValues,
    mode: "onBlur",
  });
  const {
    register,
    control,
    setValue,
    getValues,
    reset,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "weeks" });
  const weeks = useWatch({ control, name: "weeks" });
  const scheduling = useWatch({ control, name: "scheduling" });
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [message, setMessage] = useState("");
  const [savingMode, setSavingMode] = useState(false);
  const weekIndex = Math.min(selectedWeek, fields.length - 1);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, isSubmitting]);

  function revealError() {
    const parsed = routineDefinitionSchema.safeParse(getValues());
    if (parsed.success) return;
    const issue = parsed.error.issues[0];
    if (issue.path[0] === "weeks" && typeof issue.path[1] === "number") {
      setSelectedWeek(issue.path[1]);
      if (issue.path[2] === "days" && typeof issue.path[3] === "number")
        setSelectedDay(issue.path[3]);
    }
    setMessage(issue.message);
  }
  async function save(data: RoutineDefinition, activate: boolean) {
    setMessage("");
    setSavingMode(activate);
    try {
      const response = await fetch(
        routineId
          ? "/api/routines/" + encodeURIComponent(routineId)
          : "/api/routines",
        {
          method: routineId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ definition: data, activate }),
        },
      );
      if (!response.ok) {
        if (response.status === 401) {
          setMessage(
            "Tu sesión terminó. Abre el acceso en otra pestaña y vuelve a guardar para conservar estos cambios.",
          );
          return;
        }
        throw new Error();
      }
      reset(data);
      router.push(activate ? "/" : "/rutinas");
      router.refresh();
    } catch {
      setMessage(
        "No pudimos guardar la rutina. Tus cambios siguen aquí; vuelve a intentarlo.",
      );
    }
  }
  function addWeek(copy = false) {
    if (fields.length >= 12) return;
    if (scheduling === "iso-parity")
      setValue("scheduling", "continuous", { shouldDirty: true });
    const source = copy
      ? structuredClone(getValues(`weeks.${weekIndex}`))
      : { name: "", days: DAY_NAMES.map(() => blankTrainingDay()) };
    append(
      {
        ...source,
        name: copy ? source.name + " (copia)" : "Semana " + (fields.length + 1),
      },
      { shouldFocus: false },
    );
    setSelectedWeek(fields.length);
    setSelectedDay(0);
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={handleSubmit((data) => save(data, true), revealError)}
      >
        <Link
          href="/rutinas"
          className="mt-7 inline-flex min-h-11 items-center gap-2 text-xs text-sage-dark no-underline"
        >
          <ArrowLeft size={16} />
          Mis rutinas
        </Link>
        <div className="flex items-start justify-between gap-6 pt-3 pb-8 mobile:flex-col mobile:gap-4">
          <div>
            <h1 className="font-heading text-[46px] leading-tight mobile:text-[38px]">
              {routineId
                ? "Dale forma a tu rutina."
                : "Tu semana empieza aquí."}
            </h1>
            <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted">
              Diseña una semana. Añade las que quieras alternar. El calendario
              se encarga del resto.
            </p>
          </div>
          {!routineId && (
            <Button
              variant="outline"
              disabled={isDirty || isSubmitting}
              onClick={() => {
                reset(getDefaultRoutineDefinition());
                setSelectedWeek(0);
                setSelectedDay(0);
              }}
            >
              Usar rutina original
            </Button>
          )}
        </div>
        {message && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <fieldset disabled={isSubmitting} className="min-w-0">
          <legend className="sr-only">
            Configuración y entrenamientos de la rutina
          </legend>
          <div>
            <FieldGroup className="mb-8 grid grid-cols-2 items-start gap-6 touch:grid-cols-1">
              <Field className="flex-1" data-invalid={!!errors.name}>
                <FieldLabel htmlFor="routine-name">
                  Nombre de tu rutina
                </FieldLabel>
                <Input
                  id="routine-name"
                  placeholder="Dale un nombre a este ciclo"
                  maxLength={100}
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="cycle-start">
                  Lunes de la primera semana
                </FieldLabel>
                <Input
                  id="cycle-start"
                  type="date"
                  disabled={scheduling === "iso-parity"}
                  {...register("startDate")}
                  aria-invalid={!!errors.startDate}
                />
                <FieldDescription>
                  {scheduling === "iso-parity"
                    ? "Esta rutina conserva las semanas pares e impares originales."
                    : "Elige el lunes que marca la semana 1 del ciclo."}
                </FieldDescription>
                <FieldError>{errors.startDate?.message}</FieldError>
              </Field>
            </FieldGroup>
            {fields.length === 2 && (
              <Field className="mb-8">
                <FieldLabel>Cómo se alternan las semanas</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={scheduling}
                  onValueChange={(value) => {
                    if (value)
                      setValue(
                        "scheduling",
                        value as RoutineDefinition["scheduling"],
                        { shouldDirty: true },
                      );
                  }}
                  variant="outline"
                  spacing={2}
                  className="max-w-full flex-wrap"
                  aria-label="Alternancia del ciclo"
                >
                  <ToggleGroupItem value="continuous" className="min-h-11">
                    Ciclo continuo
                  </ToggleGroupItem>
                  <ToggleGroupItem value="iso-parity" className="min-h-11">
                    Pares e impares
                  </ToggleGroupItem>
                </ToggleGroup>
                <FieldDescription>
                  En pares e impares, la primera rutina corresponde a las
                  semanas pares.
                </FieldDescription>
              </Field>
            )}
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_300px] items-start gap-7 compact:grid-cols-[minmax(0,1fr)_260px] touch:grid-cols-1">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
                <Tabs
                  value={String(weekIndex)}
                  onValueChange={(value) => {
                    setSelectedWeek(Number(value));
                    setSelectedDay(0);
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-line bg-sage-light px-5 py-4">
                    <div className="min-w-0 max-w-full flex-1 overflow-x-auto">
                      <TabsList
                        aria-label="Semanas del ciclo"
                        variant="line"
                        className="h-11"
                      >
                        {fields.map((week, index) => (
                          <TabsTrigger value={String(index)} key={week.id}>
                            Semana {index + 1}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={fields.length >= 12}
                      onClick={() => addWeek()}
                    >
                      <Plus size={16} />
                      Semana
                    </Button>
                  </div>
                  {fields.map((week, index) => (
                    <TabsContent
                      value={String(index)}
                      key={week.id}
                      className="m-0"
                    >
                      <div className="flex items-end gap-2 px-7 pt-6 mobile:flex-wrap mobile:px-5">
                        <Field
                          className="min-w-0 flex-1"
                          data-invalid={!!errors.weeks?.[index]?.name}
                        >
                          <FieldLabel htmlFor={"week-name-" + index}>
                            Nombre de esta semana
                          </FieldLabel>
                          <Input
                            id={"week-name-" + index}
                            maxLength={80}
                            {...register(`weeks.${index}.name`)}
                            aria-invalid={!!errors.weeks?.[index]?.name}
                          />
                          <FieldError>
                            {errors.weeks?.[index]?.name?.message}
                          </FieldError>
                        </Field>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={fields.length >= 12}
                          aria-label="Duplicar semana"
                          onClick={() => addWeek(true)}
                        >
                          <Copy size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={fields.length <= 1}
                          aria-label="Quitar semana"
                          onClick={() => {
                            remove(index);
                            setSelectedWeek(Math.max(0, index - 1));
                            if (scheduling === "iso-parity")
                              setValue("scheduling", "continuous", {
                                shouldDirty: true,
                              });
                          }}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                      <div className="px-7 pt-6 mobile:px-5">
                        <ToggleGroup
                          type="single"
                          value={String(selectedDay)}
                          onValueChange={(value) => {
                            if (value !== "") setSelectedDay(Number(value));
                          }}
                          spacing={1}
                          className="grid w-full grid-cols-7"
                          aria-label="Día de la semana que estás editando"
                        >
                          {DAY_NAMES.map((name, dayIndex) => (
                            <ToggleGroupItem
                              key={name}
                              value={String(dayIndex)}
                              aria-label={name}
                              className="h-auto min-w-0 flex-col gap-2 px-1 py-3"
                            >
                              <span className="text-xs">
                                {name.slice(0, 3)}
                              </span>
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "size-2 rounded-full",
                                  weeks[index]?.days[dayIndex]?.activityId ===
                                    "rest"
                                    ? "bg-lavender"
                                    : weeks[index]?.days[dayIndex]
                                          ?.activityId === "hiit"
                                      ? "bg-coral"
                                      : "bg-sage",
                                )}
                              />
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                      {index === weekIndex && (
                        <DayEditor
                          key={week.id + ":" + selectedDay}
                          weekIndex={index}
                          dayIndex={selectedDay}
                        />
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              <CyclePreview />
            </div>
          </div>
        </fieldset>
        <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 border-t border-line bg-paper/95 py-5 backdrop-blur-sm mobile:flex-wrap">
          <p className="text-xs text-muted">
            {isDirty
              ? "Tienes cambios sin guardar."
              : "La rutina se guarda en tu cuenta."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={handleSubmit((data) => save(data, false), revealError)}
            >
              {isSubmitting && !savingMode ? (
                <Loader2 size={17} className="motion-safe:animate-spin" />
              ) : (
                <Save size={17} />
              )}
              Guardar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && savingMode ? (
                <Loader2 size={17} className="motion-safe:animate-spin" />
              ) : (
                <Check size={17} />
              )}
              Guardar y activar
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
