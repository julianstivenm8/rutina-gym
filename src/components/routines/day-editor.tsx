"use client";
import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  type RoutineDefinition,
  type TrainingDay,
  isStrength,
} from "@/lib/routine-definition";
import { DAY_NAMES } from "@/lib/routine";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Field,
  FieldLabel,
  FieldGroup,
  FieldError,
  FieldDescription,
} from "../ui/field";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

const types: { id: TrainingDay["activityId"]; label: string }[] = [
  { id: "upper", label: "Tren superior" },
  { id: "lower", label: "Tren inferior" },
  { id: "strength", label: "Otra fuerza" },
  { id: "zone2", label: "Cardio zona 2" },
  { id: "hiit", label: "Intervalos" },
  { id: "cardio", label: "Otro cardio" },
  { id: "rest", label: "Descanso" },
];

export function DayEditor({
  weekIndex,
  dayIndex,
}: {
  weekIndex: number;
  dayIndex: number;
}) {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<RoutineDefinition>();
  const prefix = `weeks.${weekIndex}.days.${dayIndex}` as const;
  const day = useWatch({ control, name: prefix });
  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: `${prefix}.exercises`,
  });
  const [paste, setPaste] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const dayErrors = errors.weeks?.[weekIndex]?.days?.[dayIndex];

  function changeType(value: string) {
    const type = types.find((type) => type.id === value);
    if (!type) return;
    setValue(`${prefix}.activityId`, type.id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`${prefix}.title`, type.label, { shouldDirty: true });
    if (!isStrength(type.id)) replace([]);
  }
  function pasteExercises() {
    const names = paste
      .split(/\r?\n/)
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0 || fields.length + names.length > 50) return;
    append(
      names.map((name) => ({ name, note: "" })),
      { shouldFocus: false },
    );
    setPaste("");
  }
  return (
    <section
      aria-labelledby="day-editor-title"
      className="min-w-0 p-7 mobile:p-5"
    >
      <div className="mb-7 flex items-center justify-between gap-3">
        <h2 id="day-editor-title" className="font-heading text-[32px]">
          {DAY_NAMES[dayIndex]}
        </h2>
        <span className="text-xs text-muted">Diseña este día</span>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel>Tipo de entrenamiento</FieldLabel>
          <ToggleGroup
            type="single"
            value={day.activityId}
            onValueChange={changeType}
            spacing={2}
            variant="outline"
            className="max-w-full flex-wrap justify-start"
            aria-label="Tipo de entrenamiento"
          >
            {types.map((type) => (
              <ToggleGroupItem
                key={type.id}
                value={type.id}
                className="min-h-11"
              >
                {type.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field data-invalid={!!dayErrors?.title}>
          <FieldLabel htmlFor="training-name">
            Nombre del entrenamiento
          </FieldLabel>
          <Input
            id="training-name"
            maxLength={100}
            {...register(`${prefix}.title`)}
            aria-invalid={!!dayErrors?.title}
            aria-describedby={
              dayErrors?.title ? "training-name-error" : undefined
            }
          />
          <FieldError id="training-name-error">
            {dayErrors?.title?.message}
          </FieldError>
        </Field>
        {isStrength(day.activityId) && (
          <Field>
            <FieldLabel>Ejercicios, en tu orden</FieldLabel>
            <FieldDescription>
              Añade solo lo que vas a hacer. Las series, repeticiones y pesos
              son opcionales en las notas.
            </FieldDescription>
            <ol
              className="m-0 flex list-none flex-col gap-3 p-0"
              aria-label="Ejercicios del entrenamiento"
            >
              {fields.map((exercise, index) => (
                <li
                  key={exercise.id}
                  className="grid min-w-0 grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3 rounded-xl mobile:grid-cols-[18px_minmax(0,1fr)] border border-exercise-border bg-exercise-surface p-3 mobile:gap-2"
                >
                  <span
                    className="pt-3 font-heading text-xl text-sage"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <FieldGroup className="min-w-0 flex-1 gap-2">
                    <Field
                      className="gap-1"
                      data-invalid={!!dayErrors?.exercises?.[index]?.name}
                    >
                      <FieldLabel
                        htmlFor={"exercise-" + index}
                        className="sr-only"
                      >
                        Ejercicio {index + 1}
                      </FieldLabel>
                      <Input
                        id={"exercise-" + index}
                        placeholder="Nombre del ejercicio"
                        maxLength={200}
                        {...register(`${prefix}.exercises.${index}.name`)}
                        aria-invalid={!!dayErrors?.exercises?.[index]?.name}
                      />
                      <FieldError>
                        {dayErrors?.exercises?.[index]?.name?.message}
                      </FieldError>
                    </Field>
                    <Field className="gap-1">
                      <FieldLabel
                        htmlFor={"exercise-note-" + index}
                        className="sr-only"
                      >
                        Notas del ejercicio {index + 1}
                      </FieldLabel>
                      <Input
                        id={"exercise-note-" + index}
                        placeholder="Notas opcionales"
                        maxLength={500}
                        {...register(`${prefix}.exercises.${index}.note`)}
                      />
                    </Field>
                  </FieldGroup>
                  <div className="flex items-center mobile:col-start-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === 0}
                      aria-label={"Subir ejercicio " + (index + 1)}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={index === fields.length - 1}
                      aria-label={"Bajar ejercicio " + (index + 1)}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={"Quitar ejercicio " + (index + 1)}
                      onClick={() => remove(index)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            <FieldError>
              {dayErrors?.exercises?.root?.message ??
                dayErrors?.exercises?.message}
            </FieldError>
            <Button
              variant="outline"
              disabled={fields.length >= 50}
              onClick={() => append({ name: "", note: "" })}
            >
              <Plus size={17} />
              Añadir ejercicio
            </Button>
            <details className="rounded-lg border border-dashed border-line px-4 py-3">
              <summary className="cursor-pointer text-xs text-sage-dark">
                ¿Ya tienes una lista? Pégala de una vez
              </summary>
              <FieldGroup className="mt-4 gap-3">
                <Field>
                  <FieldLabel htmlFor="paste-exercises">
                    Un ejercicio por línea
                  </FieldLabel>
                  <Textarea
                    id="paste-exercises"
                    value={paste}
                    maxLength={10000}
                    onChange={(event) => setPaste(event.target.value)}
                    placeholder="Pega aquí tus ejercicios"
                  />
                </Field>
                <Button
                  variant="secondary"
                  disabled={
                    !paste.trim() ||
                    fields.length +
                      paste.split(/\r?\n/).filter((line) => line.trim())
                        .length >
                      50
                  }
                  onClick={pasteExercises}
                >
                  Añadir a la lista
                </Button>
              </FieldGroup>
            </details>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="training-duration">
            Duración o estructura{" "}
            <span className="text-xs font-normal text-muted">opcional</span>
          </FieldLabel>
          <Input
            id="training-duration"
            maxLength={100}
            placeholder="Escribe la duración o los intervalos de tu sesión"
            {...register(`${prefix}.duration`)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="training-description">
            Notas del día{" "}
            <span className="text-xs font-normal text-muted">opcional</span>
          </FieldLabel>
          <Textarea
            id="training-description"
            maxLength={1500}
            placeholder="Lo que quieras recordar para este entrenamiento"
            {...register(`${prefix}.description`)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="copy-day">
            Reutilizar este entrenamiento
          </FieldLabel>
          <FieldDescription>
            Reemplaza el entrenamiento del día que elijas.
          </FieldDescription>
          <select
            id="copy-day"
            value=""
            className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm"
            onChange={(event) => {
              if (event.target.value === "") return;
              const destination = Number(event.target.value);
              setValue(
                `weeks.${weekIndex}.days.${destination}`,
                structuredClone(getValues(prefix)),
                { shouldDirty: true, shouldValidate: true },
              );
              setCopyMessage(
                "Entrenamiento copiado al " +
                  DAY_NAMES[destination].toLowerCase() +
                  ".",
              );
            }}
          >
            <option value="">Copiar a otro día de esta semana…</option>
            {DAY_NAMES.map(
              (name, index) =>
                index !== dayIndex && (
                  <option value={index} key={name}>
                    {name}
                  </option>
                ),
            )}
          </select>
          <p role="status" className="text-xs text-sage-dark">
            {copyMessage}
          </p>
        </Field>
      </FieldGroup>
    </section>
  );
}
