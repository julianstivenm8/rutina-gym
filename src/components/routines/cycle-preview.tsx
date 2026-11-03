"use client";
import { useFormContext, useWatch } from "react-hook-form";
import { Repeat2 } from "lucide-react";
import type { RoutineDefinition } from "@/lib/routine-definition";
import { getWeekModel } from "@/lib/routine";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";

export function CyclePreview() {
  const { control } = useFormContext<RoutineDefinition>();
  const values = useWatch({ control }) as RoutineDefinition;
  const validDate = Number.isFinite(
    new Date(values.startDate + "T12:00:00Z").getTime(),
  );
  const monday = getWeekModel().days[0].dateKey;
  const upcoming =
    validDate && values.weeks.length
      ? Array.from({ length: 6 }, (_, index) => {
          const instant = new Date(
            new Date(monday + "T12:00:00Z").getTime() + index * 7 * 86400000,
          );
          const model = getWeekModel(instant, values);
          return {
            model,
            label: new Intl.DateTimeFormat("es-CO", {
              timeZone: "America/Bogota",
              day: "numeric",
              month: "short",
            }).format(instant),
          };
        })
      : [];
  return (
    <Card className="sticky top-6 touch:static">
      <CardHeader>
        <Repeat2 className="text-sage" size={26} />
        <CardTitle>Así rueda tu ciclo</CardTitle>
        <CardDescription>
          Vista previa de las próximas seis semanas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="m-0 flex list-none flex-col gap-0 p-0">
          {upcoming.map(({ model, label }, index) => (
            <li
              key={index}
              className="flex items-center gap-3 border-b border-line py-4 last:border-0"
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full font-heading text-xl",
                  model.routine % 2
                    ? "bg-sage-light text-sage-dark"
                    : "bg-lavender-light text-lavender",
                )}
              >
                {model.routine}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs font-medium">
                  {model.routineName || "Sin nombre"}
                </strong>
                <span className="mt-1 block text-[11px] text-muted">
                  {index === 0 ? "Esta semana" : "Desde el " + label}
                </span>
              </span>
              <div className="flex gap-1" aria-hidden="true">
                {model.days.map((day, dayIndex) => (
                  <span
                    key={dayIndex}
                    className={cn(
                      "h-6 w-1.5 rounded-full",
                      day.activityId === "rest"
                        ? "bg-lavender/40"
                        : day.activityId === "hiit"
                          ? "bg-coral"
                          : "bg-sage",
                    )}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs leading-relaxed text-muted">
          {values.scheduling === "iso-parity"
            ? "Semana par: rutina 1. Impar: rutina 2. Al pasar de la semana 53 a la 1, se repite la rutina 2."
            : "Las semanas se repiten en este orden durante todo el año, sin reiniciarse en enero. Antes del inicio, se calcula el mismo ciclo hacia atrás."}
        </p>
        <p className="mt-3 text-xs text-muted">
          El día cambia con la fecha de Colombia.
        </p>
      </CardContent>
    </Card>
  );
}
