import type { KeyboardEvent } from "react";
import { ACTIVITIES, type WeekDay, type WeekModel } from "@/lib/routine";
import { cn } from "@/lib/utils";
import { ActivityIcon, ArrowIcon, CalendarIcon } from "./icons";

type WeekCalendarProps = {
  week?: WeekModel;
  selectedIndex?: number;
  onSelectDay: (index: number) => void;
  onDayKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
};

function CalendarDay({
  day, isToday, isSelected, onClick, onKeyDown,
}: {
  day: WeekDay;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const activity = ACTIVITIES[day.activityId];

  return (
    <button
      type="button"
      className={cn(
        "group/day relative flex min-w-0 flex-col items-start rounded-[10px] border px-3 pt-[15px] pb-[13px] text-left transition-[background-color,border-color] duration-[140ms] ease-[ease] motion-reduce:transition-none",
        "after:pointer-events-none after:absolute after:top-5 after:-right-0.5 after:bottom-[18px] after:w-px after:bg-line after:content-[''] last:after:hidden",
        "compact:px-[9px] tablet:px-[7px] tablet:pt-3 tablet:pb-2.5",
        "mobile:rounded-lg mobile:px-[13px] mobile:pt-3 mobile:pb-2.5 mobile:after:hidden small:p-2.5",
        "mobile:last:col-span-full mobile:last:grid mobile:last:grid-cols-[49px_50px_1fr] mobile:last:items-center mobile:last:gap-x-2.5 mobile:last:p-[13px]",
        isSelected
          ? isToday ? "border-[#ce9b88] after:hidden" : "border-[#aebba7] after:hidden"
          : "border-transparent mobile:border-[#e3e4da]",
        isToday
          ? isSelected ? "bg-coral-light text-[#9c4936] hover:bg-coral-light" : "bg-[#fbf2eb] text-[#9c4936] hover:bg-[#f8eade]"
          : isSelected ? "bg-sage-light text-ink hover:bg-sage-light" : "bg-transparent text-ink hover:bg-[#eff1e9]",
      )}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-controls="session-detail"
      aria-label={day.fullDate + ": " + activity.title + (isToday ? ". Hoy" : "")}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <span className="flex min-h-[19px] w-full items-center justify-between gap-1 tablet:min-h-[34px] tablet:flex-col tablet:items-start tablet:justify-start tablet:gap-[5px] mobile:min-h-[18px] mobile:group-last/day:col-start-1 mobile:group-last/day:row-start-1">
        <span className={cn("text-[11px] font-medium touch:text-[12px]", isToday ? "text-[#9c4936] underline decoration-[1.5px] underline-offset-[5px]" : "text-muted")}>
          {day.name}
        </span>
        {isToday && <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#9c4936] mobile:text-[10px]"><span className="size-1 rounded-full bg-current" />Hoy</span>}
      </span>
      <span className="mt-0.5 font-heading text-[36px] leading-[1.2] tabular-nums tablet:text-[30px] mobile:text-[31px] mobile:group-last/day:col-start-1 mobile:group-last/day:row-[2/4] mobile:group-last/day:mt-0">
        {day.dayNumber.toString().padStart(2, "0")}
      </span>
      <span className={cn(
        "mt-[21px] mb-5 grid size-[76px] place-items-center self-center rounded-full border compact:size-[67px] compact:[&>svg]:size-12",
        "tablet:my-[15px] tablet:size-[60px] tablet:[&>svg]:size-[43px] mobile:mt-2 mobile:mb-3 mobile:size-[58px] mobile:[&>svg]:size-[43px]",
        "mobile:group-last/day:col-start-2 mobile:group-last/day:row-[1/4] mobile:group-last/day:m-0 mobile:group-last/day:size-[47px] mobile:group-last/day:[&>svg]:size-[34px]",
        isToday ? "border-[#cb9d86] text-[#ae5e46]"
          : activity.color === "coral" ? "border-[#d4a996] text-coral"
          : activity.color === "lavender" ? "border-[#bcb0c9] text-lavender" : "border-[#aab9a5] text-sage",
      )}>
        <ActivityIcon activity={day.activityId} size={54} />
      </span>
      <span className="min-h-[27px] self-center font-heading text-[23px] leading-[1.15] font-semibold whitespace-nowrap compact:text-[21px] tablet:flex tablet:min-h-11 tablet:items-center tablet:text-center tablet:text-[19px] tablet:whitespace-normal mobile:min-h-auto mobile:text-[24px] mobile:group-last/day:col-start-3 mobile:group-last/day:row-[1/3] mobile:group-last/day:self-end mobile:group-last/day:justify-self-start small:flex small:min-h-[50px] small:w-full small:items-center small:justify-center small:text-center small:text-[22px] small:whitespace-normal mobile:group-last/day:text-[24px] small:group-last/day:min-h-auto small:group-last/day:w-auto">
        {activity.calendarTitle}
      </span>
      <span className="mt-[7px] mb-6 block self-center text-center text-[10px] text-muted touch:text-[11px] tablet:mb-4 mobile:mt-[5px] mobile:mb-[13px] mobile:group-last/day:col-start-3 mobile:group-last/day:row-start-3 mobile:group-last/day:mt-1 mobile:group-last/day:mb-0 mobile:group-last/day:justify-self-start">
        {activity.id === "upper" || activity.id === "lower" ? activity.category : activity.calendarMeta}
      </span>
      <span className={cn(
        "flex w-full items-center justify-between gap-1 border-t pt-[11px] text-[10px] [&>svg]:flex-none compact:text-[8px] touch:text-[11px] tablet:[&>span]:max-w-[42px] mobile:pt-[9px] mobile:group-last/day:col-span-full mobile:group-last/day:mt-3",
        isToday ? "border-[#dfc4b3] text-[#9c4936]" : isSelected ? "border-[#c2cdbb] text-sage-dark" : "border-line text-[#6c7664]",
      )}>
        <span>{isSelected ? "Viendo detalle" : "Ver detalle"}</span><ArrowIcon size={16} />
      </span>
    </button>
  );
}

export function WeekCalendar({ week, selectedIndex, onSelectDay, onDayKeyDown }: WeekCalendarProps) {
  const isRoutineTwo = week?.routine === 2;

  return (
    <section className="mt-8 overflow-hidden rounded-[17px] border border-[#d4d9ce] bg-surface mobile:rounded-[13px]" id="week" aria-label="Calendario de la semana actual" aria-busy={!week}>
      {week ? <>
        <div className={cn(
          "flex min-h-[74px] items-center justify-between gap-[15px] border-b px-6 py-[18px] tablet:p-4 mobile:items-start mobile:gap-2.5 mobile:p-4",
          isRoutineTwo ? "border-[#d5ccdf] bg-lavender-light" : "border-[#d4d9ce] bg-sage-light",
        )}>
          <div className="flex items-center gap-5 tablet:gap-[13px] mobile:flex-col mobile:items-start mobile:gap-[11px]">
            <span className={cn(
              "rounded-[7px] px-4 pt-[5px] pb-1.5 font-heading text-[23px] leading-[1.2] whitespace-nowrap text-surface mobile:rounded-md mobile:px-[13px] mobile:py-[5px]",
              isRoutineTwo ? "bg-[#756384]" : "bg-sage-dark",
            )}>Rutina {week.routine}</span>
            <p className={cn("text-[12px] [&>strong]:font-[650] tablet:text-[10px] mobile:text-[11px] mobile:whitespace-nowrap", isRoutineTwo ? "text-[#6e5b7f]" : "text-sage-dark")}>
              <strong>{week.routine === 1 ? "2" : "1"}</strong> de tren superior <span className="mx-[9px] text-[#9ca995] touch:mx-[5px]">/</span> <strong>{week.routine === 1 ? "1" : "2"}</strong> de tren inferior
            </p>
          </div>
          <div className={cn("inline-flex items-center gap-[9px] text-[12px] whitespace-nowrap mobile:gap-[7px] mobile:pt-[9px] mobile:text-[11px]", isRoutineTwo ? "text-[#6e5b7f]" : "text-sage-dark")}>
            Semana {week.isoWeek}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0.5 px-3.5 pt-[17px] tablet:gap-px tablet:px-2 tablet:pt-2.5 mobile:grid-cols-2 mobile:gap-[7px] mobile:px-[9px] mobile:pt-[9px]" role="group" aria-label="Elige un día para consultar su entrenamiento">
          {week.days.map((day, index) => <CalendarDay
            key={day.dateKey}
            day={day}
            isToday={day.dateKey === week.todayKey}
            isSelected={index === selectedIndex}
            onClick={() => onSelectDay(index)}
            onKeyDown={(event) => onDayKeyDown(event, index)}
          />)}
        </div>
        <div className="flex items-center justify-center gap-[7px] px-4 pt-[18px] pb-[17px] text-[10px] text-muted touch:text-[11px] mobile:px-2.5 mobile:py-[15px]">
          <span className="size-[5px] rounded-full border border-[#8e9d83]" />Toca un día para explorar tu entrenamiento.
        </div>
      </> : <div className="flex min-h-[371px] items-center justify-center gap-3 text-sage mobile:min-h-[300px] mobile:text-[12px]" role="status">
        <CalendarIcon size={26} /><span>Preparando tu semana…</span><span className="h-0.5 w-[30px] bg-[#b9c6b2]" />
      </div>}
    </section>
  );
}
