import type { SVGProps } from "react";
import type { ActivityId } from "@/lib/routine";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
const common = {
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function ActivityIcon({ activity, size = 48, ...props }: IconProps & { activity: ActivityId }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} {...common} {...props}>
      {activity === "upper" && <>
        <circle cx="32" cy="23" r="5" />
        <path d="M24 51V37l-7-4V20M40 51V37l7-4V20M24 51h16M25 32l7 4 7-4M24 39l-12-7V22M40 39l12-7V22" />
        <path d="M10 17h10M10 24h10M12 14v13M18 14v13M44 17h10M44 24h10M46 14v13M52 14v13" />
      </>}
      {activity === "lower" && <>
        <circle cx="32" cy="18" r="5" />
        <path d="M25 27l-6 4-4-5M39 27l6 4 4-5M26 27l-2 12 8 5 8-5-2-12M24 39l-8 9 3 7h8M40 39l8 9-3 7h-8M32 44v10" />
        <path d="M9 22h46M10 17v10M14 15v14M50 15v14M54 17v10" />
      </>}
      {activity === "zone2" && <>
        <circle cx="38" cy="13" r="4" />
        <path d="M26 26l9-7 6 11 10 2M35 19l-6 16 10 8-7 12M29 35l-7 9-10 2M28 24l-9 2-4 9" strokeWidth="2.5" />
        <path d="M10 56h8M7 51h5" />
      </>}
      {activity === "hiit" && <>
        <path d="M32 52S10 38 10 24a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 14-22 28-22 28Z" />
        <path d="M6 33h16l5-10 8 22 5-12h18" strokeWidth="2" />
      </>}
      {activity === "rest" && <>
        <path d="M32 48C14 36 24 18 32 10c8 8 18 26 0 38Z" />
        <path d="M31 48C13 49 9 37 7 28c12-1 22 5 24 20ZM33 48c18 1 22-11 24-20-12-1-22 5-24 20Z" />
        <path d="M20 27c-3-7-7-10-10-11-3 14 0 23 8 27M44 27c3-7 7-10 10-11 3 14 0 23-8 27M18 51c8 4 20 4 28 0" />
      </>}
    </svg>
  );
}

export function DumbbellIcon({ size = 24, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...common} {...props}>
    <path d="M7 12h10M3 9v6M7 6v12M17 6v12M21 9v6M3 10h4M3 14h4M17 10h4M17 14h4" />
  </svg>;
}
export function CalendarIcon({ size = 20, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...common} {...props}>
    <rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4M16 3v4M4 11h16M8 15h2M14 15h2" />
  </svg>;
}
export function ArrowIcon({ size = 20, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...common} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}
export function CycleIcon({ size = 20, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...common} {...props}><path d="M20 9A8 8 0 0 0 6 6L3 9M3 4v5h5M4 15a8 8 0 0 0 14 3l3-3M21 20v-5h-5" /></svg>;
}
export function ClockIcon({ size = 20, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...common} {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
export function InfoIcon({ size = 18, ...props }: IconProps) {
  return <svg viewBox="0 0 24 24" width={size} height={size} {...common} {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>;
}
