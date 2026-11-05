"use client";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import {
  bodyMetrics,
  bodyNumber,
  type BodyGender,
  type BodyLatest,
  type BodyMetric,
} from "@/lib/body";
import { cn } from "@/lib/utils";

const points: { metric: BodyMetric; x: number; y: number }[] = [
  { metric: "neck", x: 50, y: 15.5 },
  { metric: "shoulders", x: 32, y: 20 },
  { metric: "chest", x: 50, y: 26 },
  { metric: "waist", x: 50, y: 36 },
  { metric: "hips", x: 50, y: 46 },
  { metric: "rightArm", x: 26, y: 30 },
  { metric: "leftArm", x: 74, y: 30 },
  { metric: "rightForearm", x: 19, y: 43 },
  { metric: "leftForearm", x: 81, y: 43 },
  { metric: "rightThigh", x: 42, y: 59 },
  { metric: "leftThigh", x: 58, y: 59 },
  { metric: "rightCalf", x: 40, y: 80 },
  { metric: "leftCalf", x: 60, y: 80 },
];
export function BodyMap({
  gender,
  selected,
  latest,
  draft,
  onSelect,
}: {
  gender: BodyGender;
  selected: BodyMetric;
  latest: BodyLatest;
  draft: Partial<Record<BodyMetric, string>>;
  onSelect: (metric: BodyMetric) => void;
}) {
  return (
    <div
      className="relative mx-auto aspect-[2/3] w-full max-w-[400px]"
      aria-label="Mapa interactivo de medidas corporales"
    >
      <svg
        viewBox="0 0 400 600"
        className="pointer-events-none absolute inset-0 size-full text-lavender/15"
        aria-hidden="true"
      >
        <path
          d="M200 10V590 M40 156H360 M40 216H360 M40 276H360 M40 354H360 M40 480H360"
          stroke="currentColor"
          strokeDasharray="3 7"
          fill="none"
        />
        <ellipse
          cx="200"
          cy="316"
          rx="175"
          ry="248"
          fill="none"
          stroke="currentColor"
        />
      </svg>
      {gender === "unspecified" ? (
        <svg
          viewBox="0 0 400 600"
          className="absolute inset-0 size-full text-lavender"
          role="img"
          aria-label="Figura humana neutral de referencia"
        >
          <g
            fill="currentColor"
            fillOpacity=".11"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity=".6"
          >
            <ellipse cx="200" cy="45" rx="24" ry="34" />
            <path d="M185 77L183 93Q154 98 138 112L117 172L79 249Q74 258 79 270L85 277Q93 276 96 264L106 249L145 185L154 154L159 220Q153 252 156 279L170 361L173 453L170 550Q160 568 174 574L190 569L194 451L199 345L201 345L206 451L210 569L226 574Q240 568 230 550L227 453L230 361L244 279Q247 252 241 220L246 154L255 185L294 249L304 264Q307 276 315 277L321 270Q326 258 321 249L283 172L262 112Q246 98 217 93L215 77" />
          </g>
        </svg>
      ) : (
        <Image
          src={`/images/body/${gender}.webp`}
          alt={
            gender === "male"
              ? "Figura masculina de referencia"
              : "Figura femenina de referencia"
          }
          fill
          sizes="(max-width: 700px) 85vw, 400px"
          priority
          className="object-contain"
        />
      )}
      {points.map(({ metric, x, y }) => {
        const value = latest[metric]?.value;
        const filled = !!draft[metric]?.trim();
        const active = selected === metric;
        return (
          <button
            key={metric}
            type="button"
            aria-label={`Medir ${bodyMetrics[metric].label.toLowerCase()}${value !== undefined ? `, último registro ${bodyNumber(value)} cm` : ""}`}
            title={bodyMetrics[metric].label}
            aria-pressed={active}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect(metric)}
            className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-0 bg-transparent p-0 focus-visible:outline-offset-0"
          >
            <span
              className={cn(
                "grid size-[23px] place-items-center rounded-full border-2 border-surface bg-surface/95 text-sage shadow-sm transition-[background-color,box-shadow] motion-reduce:transition-none",
                active &&
                  "size-[29px] bg-coral text-paper ring-[7px] ring-coral/15",
                !active &&
                  (filled || value !== undefined) &&
                  "bg-sage-dark text-paper",
                !active &&
                  !filled &&
                  value === undefined &&
                  "ring-1 ring-lavender/40",
              )}
            >
              {filled ? <Check size={12} /> : <Plus size={12} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
