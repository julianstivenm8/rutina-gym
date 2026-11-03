import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RoutineDefinition } from "@/lib/routine-definition";
import { CycleIcon } from "./icons";

export function RoutineCycle({
  routine,
  definition,
}: {
  routine: number;
  definition: RoutineDefinition;
}) {
  return (
    <aside
      className="rounded-[15px] border border-cycle-border bg-cycle-surface px-[25px] pt-[23px] pb-2 compact:px-[21px] tablet:grid tablet:grid-cols-2 tablet:gap-x-6 tablet:px-[25px] tablet:pt-[22px] mobile:rounded-xl mobile:px-[23px] mobile:pt-[22px]"
      aria-labelledby="cycle-title"
    >
      <div className="flex items-center gap-2.5 [&>svg]:text-sage tablet:col-span-full">
        <CycleIcon size={21} />
        <h2 id="cycle-title" className="font-heading text-[25px] font-semibold">
          {definition.weeks.length === 1
            ? "Tu rutina semanal"
            : "Un ciclo de " + definition.weeks.length + " rutinas"}
        </h2>
      </div>
      <p className="mt-2.5 mb-[17px] text-[11px] leading-[1.7] text-muted touch:text-[12px] tablet:col-span-full">
        {definition.name}. Cada lunes, tu semana se organiza automáticamente.
      </p>
      {definition.weeks.map((week, index) => (
        <div
          className="relative flex items-center gap-[13px] border-t border-cycle-line py-3.5"
          key={index}
        >
          <span
            className={cn(
              "grid h-[39px] w-[33px] flex-none place-items-center rounded-md border font-heading text-[22px]",
              index % 2 === 0
                ? "border-cycle-sage-border bg-cycle-sage-surface text-sage-dark"
                : "border-cycle-lavender-border bg-cycle-lavender-surface text-cycle-lavender-ink",
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <strong className="block break-words text-xs font-semibold">
              {week.name}
            </strong>
            <p className="mt-1 text-[11px] text-cycle-ink">
              {
                week.days.filter((day) =>
                  ["upper", "lower", "strength"].includes(day.activityId),
                ).length
              }{" "}
              días de fuerza
            </p>
            <small className="text-[10px] text-muted">
              {definition.scheduling === "iso-parity"
                ? index === 0
                  ? "Semanas pares"
                  : "Semanas impares"
                : "Semana " + (index + 1) + " del ciclo"}
            </small>
          </div>
          {routine === index + 1 && (
            <span className="ml-auto shrink-0 text-[10px] text-sage-dark">
              Esta semana
            </span>
          )}
        </div>
      ))}
      <details className="group/cycle mt-1 border-t border-cycle-line tablet:col-span-full">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-[13px] text-[11px] text-cycle-summary">
          ¿Cómo cambia la rutina?<span aria-hidden="true">+</span>
        </summary>
        <p className="pb-4 text-xs leading-relaxed text-muted">
          {definition.scheduling === "iso-parity"
            ? "Cambia los lunes según el número de semana ISO, con la fecha de Colombia. Una semana 53 seguida de una semana 1 mantiene la rutina 2."
            : "El ciclo se repite sin interrupciones desde el lunes " +
              definition.startDate +
              ", incluso al cambiar de año. Las fechas anteriores siguen el mismo patrón hacia atrás."}
        </p>
      </details>
      <Link
        href="/rutinas"
        className="my-2 inline-flex min-h-11 items-center text-xs text-sage-dark underline underline-offset-4"
      >
        Gestionar mis rutinas
      </Link>
    </aside>
  );
}
