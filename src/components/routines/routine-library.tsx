"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Layers3,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import type { SavedRoutine } from "@/lib/routine-definition";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { cn } from "@/lib/utils";

export function RoutineLibrary({ routines }: { routines: SavedRoutine[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function activate(id: string) {
    setPending(id);
    setError("");
    try {
      const response = await fetch(
        "/api/routines/" + encodeURIComponent(id) + "/activate",
        { method: "POST" },
      );
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("No pudimos activar la rutina. Vuelve a intentarlo.");
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <div className="flex items-end justify-between gap-5 py-10 mobile:flex-col mobile:items-start mobile:py-7">
        <div>
          <h1 className="font-heading text-[46px] leading-tight mobile:text-[38px]">
            Tus rutinas, a tu ritmo.
          </h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted">
            Guarda distintos ciclos y elige cuál acompaña tu semana. Solo uno
            está activo a la vez.
          </p>
        </div>
        <Button asChild>
          <Link href="/rutinas/nueva">
            <Plus size={18} />
            Crear rutina
          </Link>
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 items-start gap-6 touch:grid-cols-1">
        {routines.map((routine) => (
          <Card
            key={routine.id}
            className={cn(routine.active && "border-sage")}
          >
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <Layers3 size={24} className="text-sage" />
                <Badge variant={routine.active ? "default" : "outline"}>
                  {routine.active ? "Activa" : "Guardada"}
                </Badge>
              </div>
              <CardTitle>{routine.definition.name}</CardTitle>
              <CardDescription>
                {routine.definition.weeks.length}{" "}
                {routine.definition.weeks.length === 1 ? "semana" : "semanas"}{" "}
                en el ciclo.{" "}
                {routine.definition.scheduling === "iso-parity"
                  ? "Alternancia por semanas pares e impares."
                  : "Se repite desde el " + routine.definition.startDate + "."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {routine.definition.weeks.map((week, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-sage-light font-heading text-lg text-sage-dark">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {week.name}
                    </span>
                    <div
                      className="flex gap-1.5"
                      aria-label={week.days.map((day) => day.title).join(", ")}
                    >
                      {week.days.map((day, dayIndex) => (
                        <span
                          title={day.title}
                          key={dayIndex}
                          className={cn(
                            "size-2.5 rounded-full",
                            day.activityId === "rest"
                              ? "bg-lavender"
                              : day.activityId === "hiit"
                                ? "bg-coral"
                                : "bg-sage",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-3">
              <Button variant="outline" asChild>
                <Link
                  href={
                    "/rutinas/" + encodeURIComponent(routine.id) + "/editar"
                  }
                >
                  <Pencil size={16} />
                  Editar
                </Link>
              </Button>
              {routine.active ? (
                <Button variant="secondary" asChild>
                  <Link href="/">
                    Ver mi semana
                    <ArrowUpRight size={17} />
                  </Link>
                </Button>
              ) : (
                <Button
                  disabled={pending !== null}
                  onClick={() => activate(routine.id)}
                >
                  {pending === routine.id ? (
                    <Loader2 size={17} className="motion-safe:animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  Activar rutina
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        La rutina de fuerza y cardio original es el punto de partida de todas
        las cuentas. Tus cambios son solo tuyos.
      </p>
    </>
  );
}
