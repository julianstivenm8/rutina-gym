import { cn } from "@/lib/utils";
import { CycleIcon } from "./icons";

export function RoutineCycle({ routine }: { routine: 1 | 2 }) {
  return (
    <aside className="rounded-[15px] border border-[#e2e1d8] bg-[#eeede7] px-[25px] pt-[23px] pb-2 compact:px-[21px] tablet:grid tablet:grid-cols-2 tablet:gap-x-6 tablet:px-[25px] tablet:pt-[22px] mobile:rounded-xl mobile:px-[23px] mobile:pt-[22px]" aria-labelledby="cycle-title">
      <div className="flex items-center gap-2.5 [&>svg]:text-sage tablet:col-span-full">
        <CycleIcon size={21} /><h2 id="cycle-title" className="font-heading text-[25px] font-semibold">Un ciclo de dos rutinas</h2>
      </div>
      <p className="mt-2.5 mb-[17px] text-[11px] leading-[1.7] text-muted touch:text-[12px] tablet:col-span-full tablet:mb-3 tablet:[&>br]:hidden">
        La fuerza alterna cada semana. <br />El cardio y el descanso se mantienen.
      </p>
      {([1, 2] as const).map((number) => <div className="relative flex items-center gap-[13px] border-t border-[#d9dace] py-3.5 tablet:py-[15px]" key={number}>
        <span className={cn(
          "grid h-[39px] w-[33px] flex-none place-items-center rounded-md border font-heading text-[22px]",
          number === 1 ? "border-[#c4cebd] bg-[#e3e9dc] text-sage-dark" : "border-[#d5cbde] bg-[#e8e2ed] text-[#78608c]",
        )}>{number}</span>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <strong className="text-[11px] font-semibold mobile:text-[12px]">Rutina {number}</strong>
            {routine === number && <span className="text-[9px] text-sage-dark mobile:text-[10px]">Esta semana</span>}
          </div>
          <p className="mt-1 mb-[3px] text-[11px] text-[#5f6b5b] mobile:text-[12px]">{number === 1 ? "2 superior / 1 inferior" : "2 inferior / 1 superior"}</p>
          <small className="text-[9px] text-muted touch:text-[11px]">{number === 1 ? "Semanas pares" : "Semanas impares"}</small>
        </div>
        {routine === number && <span className="ml-auto size-[5px] rounded-full bg-sage" />}
      </div>)}
      <details className="group/cycle mt-1 border-t border-[#d9dace] tablet:col-span-full">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-[13px] text-[10px] text-[#5c6856] [&::-webkit-details-marker]:hidden touch:text-[12px] mobile:min-h-12">
          ¿Cómo cambia la rutina?<span className="text-[19px] leading-none group-open/cycle:rotate-45" aria-hidden="true">+</span>
        </summary>
        <p className="pr-1 pb-[13px] text-[11px] leading-[1.7] text-muted touch:text-[12px]">Cambia los lunes según el número de semana ISO, con la fecha de Colombia. Una semana 53 seguida de una semana 1 mantiene la rutina 2.</p>
      </details>
    </aside>
  );
}
