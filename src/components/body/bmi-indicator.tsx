import {
  adultBmiCategory,
  bodyBmi,
  bodyBmiValue,
  bodyNumber,
} from "@/lib/body";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export function BmiIndicator({
  weightKg,
  heightCm,
}: {
  weightKg?: number;
  heightCm?: number;
}) {
  const value = bodyBmiValue(weightKg, heightCm);
  const rounded = bodyBmi(weightKg, heightCm);
  const category = adultBmiCategory(value);
  // Show extra precision at a boundary, rather than displaying 25 with a normal-weight category.
  const display =
    value !== null && adultBmiCategory(rounded)?.id !== category?.id
      ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 8 }).format(
          value,
        )
      : rounded === null
        ? "—"
        : bodyNumber(rounded);
  const position =
    value === null ? 0 : Math.max(0, Math.min(100, ((value - 12) / 28) * 100));
  return (
    <div aria-live="polite" aria-atomic="true">
      <span
        className={cn(
          "font-heading text-[40px] leading-none mobile:text-[32px]",
          display.length > 6 && "text-[32px] mobile:text-[24px]",
        )}
      >
        {display}
      </span>
      {category ? (
        <>
          <Badge
            variant="outline"
            className={cn(
              "mt-2 block max-w-full whitespace-normal px-2 py-1 text-center text-[11px] leading-snug mobile:px-1 mobile:text-[10px]",
              category.id === "normal" &&
                "border-sage/25 bg-sage-light text-sage-dark",
              category.id === "underweight" &&
                "border-lavender/25 bg-lavender-light text-lavender-ink",
              (category.id === "overweight" || category.id === "obesity") &&
                "border-coral/25 bg-coral-light text-coral",
            )}
          >
            {category.label}
          </Badge>
          <div
            className="relative mt-3 w-full max-w-[180px]"
            aria-hidden="true"
          >
            <div className="grid h-1.5 grid-cols-[6.5fr_6.5fr_5fr_10fr] gap-0.5 overflow-hidden rounded-full">
              <span className="bg-lavender/65" />
              <span className="bg-sage" />
              <span className="bg-coral/55" />
              <span className="bg-coral" />
            </div>
            <span
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-ink ring-1 ring-ink/40"
              style={{ left: `${position}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted">
            Rango de adultos (20+)
          </p>
        </>
      ) : (
        <p className="mt-2 text-[10px] text-muted">Añade peso y altura</p>
      )}
    </div>
  );
}
