import type { ReactNode } from "react";
import type { Activity, WeekDay } from "@/lib/routine";
import { cn } from "@/lib/utils";
import { ActivityIcon, ArrowIcon, ClockIcon, DumbbellIcon } from "./icons";

const sessionTones = {
  sage: { icon: "border-[#d0d9c7] bg-[#eef0e7] text-sage", label: "text-sage" },
  coral: { icon: "border-[#dfb7a7] bg-coral-light text-coral", label: "text-coral" },
  lavender: { icon: "border-[#d5cbe0] bg-lavender-light text-lavender", label: "text-lavender" },
} satisfies Record<Activity["color"], { icon: string; label: string }>;

function SessionFact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-[21px] py-[17px] text-sage not-first:border-l not-first:border-[#dce1d4] compact:gap-[9px] compact:px-3 compact:py-[15px] mobile:gap-2 mobile:px-2.5 mobile:py-3.5 mobile:[&>svg]:size-[19px] mobile:[&>svg]:shrink-0 small:gap-1.5 small:px-2 small:py-3">
      {icon}
      <div className="flex flex-col gap-[5px]">
        <span className="text-[10px] text-muted">{label}</span>
        <strong className="text-[17px] font-medium text-ink compact:text-[15px] mobile:text-[14px]">
          {children}
        </strong>
      </div>
    </div>
  );
}

function SessionContent({ activity }: { activity: Activity }) {
  if (activity.id === "zone2") {
    return (
      <div className="grid grid-cols-2 rounded-[9px] border border-[#dce1d4] bg-[#f5f6ef] mobile:grid-cols-[1fr_1.1fr]">
        <SessionFact icon={<ClockIcon size={22} />} label="Duración">
          45–60 <small className="text-[11px] font-normal mobile:text-[10px]">minutos</small>
        </SessionFact>
        <SessionFact icon={<ActivityIcon activity="hiit" size={25} />} label="Tipo de sesión">
          Cardio continuo
        </SessionFact>
      </div>
    );
  }

  if (activity.id === "hiit") {
    return (
      <div>
        <div className="mb-[13px] flex flex-wrap items-center gap-1.5 text-[9px] text-muted mobile:gap-x-1 mobile:leading-[1.7]">
          <span className="size-1.5 rounded-xs bg-[#bb7962]" />4 min intensos
          <span className="ml-[11px] size-1.5 rounded-xs border border-[#bccbb0] bg-[#dce4d5] mobile:ml-1" />3–4 min de recuperación
        </div>
        <div className="flex min-w-0 gap-[5px] mobile:gap-[3px] small:gap-0.5" aria-label="Cuatro intervalos de cuatro minutos intensos, con recuperación entre ellos">
          {[1, 2, 3, 4].map((round) => <div className="flex min-w-0 flex-[1_1_0] gap-[5px] last:flex-[.7_1_0] mobile:gap-[3px] small:gap-0.5" key={round}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md border border-[#e0b4a1] bg-[#f0dacf] px-1.5 py-[13px] text-[#8c4833] mobile:px-[3px] mobile:py-[11px]">
              <strong className="font-heading text-[22px] font-semibold whitespace-nowrap mobile:text-[20px] small:text-[19px]">4 min</strong>
              <span className="text-[8px] whitespace-nowrap mobile:text-[7px]">Intervalo {round}</span>
            </div>
            {round < 4 && <div className="flex flex-[0_0_19px] flex-col items-center justify-center gap-[3px] rounded-[5px] bg-[#edf0e6] p-[5px] text-[10px] text-[#647359] mobile:p-[3px] mobile:text-[9px] small:flex-[0_0_15px] small:p-0.5">
              <span>3–4</span><span className="text-[8px]">min</span>
            </div>}
          </div>)}
        </div>
      </div>
    );
  }

  const isRest = activity.id === "rest";
  return (
    <div className={cn(
      "flex items-center gap-3.5 rounded-[9px] border p-[17px] [&>svg]:shrink-0 mobile:gap-[11px] mobile:p-3.5",
      isRest ? "border-[#dfd6e6] bg-[#f4f0f7] [&>svg]:text-lavender" : "border-[#e0e3d6] bg-[#f4f5ee] [&>svg]:text-sage",
    )}>
      {isRest ? <ActivityIcon activity="rest" size={34} /> : <DumbbellIcon size={24} />}
      <p className="max-w-[55ch] text-[12px] leading-[1.7] text-[#64715c]">
        {isRest ? "Descansar también es parte de la rutina." : "La rutina indica el grupo corporal. Los ejercicios, las series y las repeticiones están por definir."}
      </p>
    </div>
  );
}

export function SessionDetail({ day, activity, isToday, onBackToToday }: {
  day: WeekDay;
  activity: Activity;
  isToday: boolean;
  onBackToToday: () => void;
}) {
  const tone = sessionTones[activity.color];

  return (
    <section id="session-detail" className="overflow-hidden rounded-[15px] border border-line bg-surface px-7 pt-[23px] pb-[26px] compact:p-[21px] tablet:px-7 tablet:py-6 mobile:rounded-xl mobile:p-5 small:p-4" aria-labelledby="session-title" aria-live="polite" aria-atomic="true">
      <div className="flex items-center gap-2.5 border-b border-line pb-5 text-[12px] mobile:pb-[17px]">
        <span className="first-letter:uppercase">{day.fullDate}</span>
        {isToday && <span className="rounded-sm bg-coral-light px-[7px] py-[3px] text-[9px] text-[#a04d37]">Hoy</span>}
        <a className="ml-auto hidden min-h-7 items-center text-[11px] text-sage-dark underline-offset-[3px] mobile:inline-flex" href="#week">Cambiar día</a>
      </div>
      <div className="flex items-center gap-[22px] py-6 motion-safe:animate-detail-in compact:gap-[17px] tablet:gap-[22px] mobile:items-start mobile:gap-[15px] mobile:py-[22px] small:gap-[11px]" key={day.dateKey}>
        <span className={cn(
          "grid size-[90px] flex-none place-items-center rounded-full border compact:size-[76px] compact:[&>svg]:size-[52px] mobile:mt-1 mobile:size-[65px] mobile:[&>svg]:size-[45px] small:size-[52px] small:[&>svg]:size-[38px]",
          tone.icon,
        )}>
          <ActivityIcon activity={activity.id} size={60} />
        </span>
        <div>
          <span className={cn("mb-[5px] block text-[11px]", tone.label)}>{activity.category}</span>
          <h2 id="session-title" className="font-heading text-[34px] leading-[1.15] font-semibold compact:text-[30px] tablet:text-[34px] mobile:text-[29px] small:text-[26px]">{activity.title}</h2>
          <p className="mt-[9px] max-w-[52ch] text-[12px] leading-[1.7] text-muted mobile:mt-2">
            {isToday ? activity.description : activity.description.replace("Hoy corresponde", "Corresponde").replace("Hoy no hay", "No hay")}
          </p>
        </div>
      </div>
      <SessionContent activity={activity} />
      {!isToday && <button className="mt-3 flex min-h-11 items-center gap-2 border-0 bg-transparent px-0 py-1.5 text-[11px] text-sage-dark" type="button" onClick={onBackToToday}>
        Volver a hoy<ArrowIcon size={17} />
      </button>}
    </section>
  );
}
