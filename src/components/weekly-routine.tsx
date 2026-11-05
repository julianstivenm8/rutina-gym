"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { ACTIVITIES, getWeekModel, type WeekModel } from "@/lib/routine";
import type { AuthenticatedUser } from "@/lib/auth-types";
import type { RoutineDefinition } from "@/lib/routine-definition";
import { InfoIcon } from "./icons";
import { AppHeader } from "./app-header";
import { RoutineCycle } from "./routine-cycle";
import { SessionDetail } from "./session-detail";
import { WeekCalendar } from "./week-calendar";
import { WeightProgressProvider } from "./weights/weight-progress-provider";

type ViewState = { week: WeekModel; selectedIndex: number } | null;

export function WeeklyRoutine({
  user,
  definition,
  routineId,
}: {
  user: AuthenticatedUser;
  definition: RoutineDefinition;
  routineId: string;
}) {
  const [view, setView] = useState<ViewState>(null);

  useEffect(() => {
    const refresh = () => {
      const week = getWeekModel(new Date(), definition);
      setView((previous) =>
        previous?.week.todayKey === week.todayKey
          ? { week, selectedIndex: previous.selectedIndex }
          : { week, selectedIndex: week.todayIndex },
      );
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [definition]);

  function selectDay(index: number, reveal = true) {
    setView((previous) =>
      previous ? { ...previous, selectedIndex: index } : previous,
    );
    if (reveal && window.matchMedia("(max-width: 700px)").matches) {
      window.requestAnimationFrame(() =>
        document.getElementById("session-detail")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        }),
      );
    }
  }

  function handleDayKey(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const keys: Record<string, number> = {
      ArrowRight: (index + 1) % 7,
      ArrowLeft: (index + 6) % 7,
      Home: 0,
      End: 6,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    selectDay(next, false);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        "button[aria-pressed]",
      );
    buttons?.[next]?.focus();
  }

  const week = view?.week;
  const selectedDay = view ? view.week.days[view.selectedIndex] : null;
  const selectedActivity = selectedDay
    ? (selectedDay.activity ?? ACTIVITIES[selectedDay.activityId])
    : null;
  const selectedIsToday = selectedDay?.dateKey === week?.todayKey;

  return (
    <WeightProgressProvider key={routineId} routineId={routineId}>
      <div className="mx-auto max-w-[1440px] px-16 wide:px-[70px] compact:px-9 tablet:px-[26px] mobile:max-w-[560px] mobile:px-5 small:px-3.5">
        <a
          className="fixed -top-20 left-4 z-20 rounded-lg bg-ink px-[18px] py-3 text-surface focus:top-3"
          href="#week"
        >
          Ir a la semana
        </a>
        <AppHeader user={user} />

        <main id="main-content">
          <h1 className="sr-only mobile:not-sr-only mobile:pt-6 mobile:font-heading mobile:text-[40px] mobile:leading-none">
            Mi semana
          </h1>
          <WeekCalendar
            week={week}
            selectedIndex={view?.selectedIndex}
            onSelectDay={selectDay}
            onDayKeyDown={handleDayKey}
          />

          {week && selectedDay && selectedActivity && (
            <div className="mt-[25px] grid grid-cols-[minmax(0,1.8fr)_minmax(285px,1fr)] items-start gap-6 compact:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] compact:gap-[18px] touch:grid-cols-1 mobile:mt-[18px] mobile:gap-[17px]">
              <SessionDetail
                day={selectedDay}
                activity={selectedActivity}
                isToday={selectedIsToday}
                onBackToToday={() => selectDay(week.todayIndex)}
              />
              <RoutineCycle routine={week.routine} definition={definition} />
            </div>
          )}

          <div className="mt-[23px] mb-[35px] flex items-start justify-center gap-[7px] text-muted [&>svg]:-mt-px [&>svg]:shrink-0 mobile:mx-0.5 mobile:mt-[22px] mobile:mb-7 mobile:justify-start">
            <InfoIcon size={17} />
            <p className="text-[10px] leading-[1.6] touch:text-[11px] mobile:max-w-[55ch]">
              Tu rutina de fuerza y cardio, organizada por día.
            </p>
          </div>
          <noscript>
            <p className="p-5 leading-[1.7]">
              Activa JavaScript para calcular la semana actual y consultar los
              días de entrenamiento.
            </p>
          </noscript>
        </main>

        <footer className="flex justify-between gap-[18px] border-t border-line pt-[23px] pb-7 text-[10px] text-muted touch:text-[11px] mobile:flex-col mobile:gap-[11px] mobile:pt-5 mobile:pb-[25px]">
          <span>Un poco de fuerza. Un poco de cardio. Tu equilibrio.</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="size-1 rounded-full bg-sage" />
            Fecha de Colombia
          </span>
        </footer>
      </div>
    </WeightProgressProvider>
  );
}
